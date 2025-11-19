import json

import redis
import redis.exceptions

import frappe
import frappe.utils

from frappe_pywce.config import get_engine_config, get_wa_config
from frappe_pywce.util import CACHE_KEY_PREFIX, LOCK_WAIT_TIME, LOCK_LEASE_TIME, bot_settings, create_cache_key
from frappe_pywce.pywce_logger import app_logger as logger


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


def _internal_webhook_handler(wa_id:str, payload:dict):
    """Process webhook data internally

    Args:
        payload (dict): webhook raw payload data to process
        headers (dict): request headers
    """

    try:
        lock_key =  create_cache_key(f"lock:{wa_id}")
        
        with frappe.cache().lock(lock_key, timeout=LOCK_LEASE_TIME, blocking_timeout=LOCK_WAIT_TIME):
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