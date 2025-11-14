import json

import redis
import redis.exceptions

import frappe
import frappe.utils

from frappe_pywce.config import get_engine_config, get_wa_config
from frappe_pywce.util import CACHE_KEY_PREFIX, LOCK_WAIT_TIME, LOCK_LEASE_TIME, bot_settings, create_cache_key, get_logger

logger = get_logger()

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


def _internal_webhook_handler(user:str, wa_id:str, payload:dict):
    """Process webhook data internally

    If user is authenticated in the session, get current user and call

    frappe.set_user(...)
    
    frappe.set_user(..) is called if and only if all secure checks are valid

    Its reset back when a request is sent back to whatsapp

    Args:
        payload (dict): webhook raw payload data to process
        headers (dict): request headers
    """

    try:
        lock_key = f"wa_lock:{wa_id}"

        print("Running worker with lock_key: ", lock_key)
        
        with frappe.cache().lock(lock_key, timeout=LOCK_LEASE_TIME, blocking_timeout=LOCK_WAIT_TIME):
            print("Running action job with lock key: ", lock_key)
            frappe.set_user(user)
            print("Running action job with user ", user)
            get_engine_config().process_webhook(payload)

    except redis.exceptions.LockError:
        logger.critical("FIFO Enforcement: Dropped concurrent message for %s due to lock error.", wa_id)
        print('Lock error: ', str(e))

    except Exception:
        frappe.log_error(title="Chatbot Webhook E.Handler")


def _on_job_success(**kwargs):
    logger.debug("Webhook job completed successfully: %s", kwargs)

def _on_job_error(**kwargs):
    logger.debug("Webhook job failed: %s", kwargs)

def _handle_webhook():
    payload = frappe.request.data

    try:
        payload_dict = json.loads(payload.decode('utf-8'))
    except json.JSONDecodeError as e:
        frappe.throw("Invalid webhook data", exc=frappe.ValidationError)

    should_run_in_bg = frappe.db.get_single_value("ChatBot Config", "process_in_background")

    wa_user = get_wa_config(bot_settings()).util.get_wa_user(payload_dict)

    if wa_user is None:
        return "Invalid user"
    
    job_id = f"{wa_user.wa_id}:{wa_user.msg_id}"
    
    logger.debug("Starting a new webhook job id: %s", job_id)

    print("Im starting a new job")

    frappe.enqueue(
        _internal_webhook_handler,
        now=should_run_in_bg == 0,

        user=frappe.session.user,
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