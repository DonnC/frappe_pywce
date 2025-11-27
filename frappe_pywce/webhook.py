import json

from frappe.utils import user
import redis
import redis.exceptions

import frappe
import frappe.utils

from frappe_pywce.config import get_engine_config, get_wa_config
from frappe_pywce.util import CACHE_KEY_PREFIX, LOCK_WAIT_TIME, LOCK_LEASE_TIME, bot_settings, create_cache_key
from frappe_pywce.pywce_logger import app_logger as logger

from pywce import HookArg, WhatsAppService, WhatsAppServiceModel


def _verifier():
    """
        Verify WhatsApp webhook callback URL challenge.

        Ref:    https://discuss.frappe.io/t/returning-plain-text-from-whitelisted-method/32621
    """
    params = frappe.request.args

    mode, token, challenge = params.get("hub.mode"), params.get("hub.verify_token"), params.get("hub.challenge")

    if get_wa_config(bot_settings()).util.webhook_challenge(mode, challenge, token):
        from werkzeug.wrappers import Response
        return Response(challenge)

    frappe.throw("Webhook verification challenge failed", exc=frappe.PermissionError)


def _get_message_for_live_mode(payload:dict) -> HookArg:
    wa = get_engine_config().config.whatsapp

    if not wa.util.is_valid_webhook_message(payload): return None

    wa_user = wa.util.get_wa_user(payload)
    response = wa.util.get_response_structure(payload)
    computed_input = wa.util.get_user_input(response)

    hook_arg = HookArg(
        session_id=wa_user.wa_id,
        session_manager=get_engine_config().config.session_manager.session(wa_user.wa_id),
        user=wa_user,
        user_input=computed_input[0],
        additional_data=computed_input[1]
    )
    
    return hook_arg


def _internal_webhook_handler(wa_id:str, payload:dict):
    """Process webhook data internally

    Args:
        payload (dict): webhook raw payload data to process
        headers (dict): request headers
    """

    try:
        lock_key =  create_cache_key(f"lock:{wa_id}")
        session_manager = get_engine_config().config.session_manager
        
        with frappe.cache().lock(lock_key, timeout=LOCK_LEASE_TIME, blocking_timeout=LOCK_WAIT_TIME):
            live_state = session_manager.get(wa_id, "live_mode")
            
            if live_state and live_state.get("is_active"):
                # --- LIVE MODE / AI AGENT HANDLER ---
                ticket_id = live_state.get("ticket_name")
                user_hook_arg = _get_message_for_live_mode(payload)
                
                if not user_hook_arg: return

                custom_handler = frappe.get_hooks("pywce_live_inbound_handler")

                if custom_handler:
                    try:
                        response_template = frappe.call(custom_handler[0], user_hook_arg)

                        wa_serv_model = WhatsAppServiceModel(
                            config=get_engine_config().config,
                            template=response_template,
                            hook_arg= user_hook_arg
                        )

                        serv = WhatsAppService(wa_serv_model)
                        serv.send_message(handle_session=False)

                        # TODO: verify if msg was sent successfully
            
                    except Exception:
                        frappe.log_error(title="Live Inbound Handler Error")

                if ticket_id and frappe.db.exists("WhatsApp Support Ticket", ticket_id):
                    message_text = user_hook_arg.user_input if user_hook_arg.user_input else f"Additional data:\n{user_hook_arg.additional_data}"
                    frappe.get_doc("WhatsApp Support Ticket", ticket_id).add_comment(
                        "Comment", text=f"[Auto-Reply] {message_text}"
                    )

                return
            
            else:
                get_engine_config().process_webhook(payload)

    except redis.exceptions.LockError:
        logger.critical("FIFO Enforcement: Dropped concurrent message for %s due to lock error.", wa_id)

    except Exception:
        frappe.log_error(title="Chatbot Webhook E.Handler")

def _on_job_success(*args, **kwargs):
    logger.debug("Webhook job completed successfully, args: %s, kwargs %s", args, kwargs)

def _on_job_error(*args, **kwargs):
    logger.debug("Webhook job failed, args: %s, kwargs %s", args, kwargs)

def _handle_webhook():
    payload = frappe.request.data

    try:
        payload_dict = json.loads(payload.decode('utf-8'))
    except json.JSONDecodeError:
        frappe.throw("Invalid webhook data", exc=frappe.ValidationError)

    should_run_in_bg = frappe.db.get_single_value("ChatBot Config", "process_in_background")

    wa_user = get_wa_config(bot_settings()).util.get_wa_user(payload_dict)

    if wa_user is None:
        return "Invalid user"
    
    job_id = f"{wa_user.wa_id}:{wa_user.msg_id}"
    
    logger.debug("Starting a new webhook job id: %s", job_id)

    frappe.enqueue(
        _internal_webhook_handler,
        now=should_run_in_bg == 0,

        payload=payload_dict,
        wa_id=wa_user.wa_id,

        job_id= create_cache_key(job_id),
        on_success=_on_job_success,
        on_failure=_on_job_error
    )

    return "OK"

@frappe.whitelist()
def get_webhook():
    return frappe.utils.get_request_site_address() + '/api/method/frappe_pywce.webhook.webhook'

@frappe.whitelist()
def clear_session():
    frappe.cache.delete_keys(CACHE_KEY_PREFIX)

@frappe.whitelist(allow_guest=True, methods=["GET", "POST"])
def webhook():
    if frappe.request.method == 'GET':
        return _verifier()
    
    if frappe.request.method == 'POST':
        return _handle_webhook()
    
    frappe.throw("Forbidden method", exc=frappe.PermissionError)