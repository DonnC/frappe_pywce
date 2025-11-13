import json

import frappe

import frappe.utils
from frappe_pywce.config import get_engine_config, get_wa_config
from frappe_pywce.util import CACHE_KEY_PREFIX, bot_settings, create_cache_key, get_logger

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


def _internal_webhook_handler(user:str, payload):
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
        get_engine_config().process_webhook(payload)

    except Exception:
        frappe.log_error(title="Chatbot Webhook E.Handler")

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

    frappe.enqueue(
        _internal_webhook_handler,
        queue="short",
        now=should_run_in_bg == 0,
        user=frappe.session.user,
        payload=payload_dict,
        job_id= create_cache_key(f"{wa_user.wa_id}:{wa_user.msg_id}")
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