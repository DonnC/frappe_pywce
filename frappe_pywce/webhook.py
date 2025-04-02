import asyncio
import json

from frappe_pywce.config import get_engine_config, get_wa_config
import frappe

def engine_bg_task(payload: dict, headers: dict) -> None:
    asyncio.run(get_engine_config().process_webhook(webhook_data=payload, webhook_headers=headers))


def _verifier():
    """
        Verify WhatsApp webhook callback URL challenge.

        Ref:    https://discuss.frappe.io/t/returning-plain-text-from-whitelisted-method/32621
    """
    params = frappe.request.args

    mode, token, challenge = params.get("hub.mode"), params.get("hub.verify_token"), params.get("hub.challenge")

    if get_wa_config().util.webhook_challenge(mode, challenge, token):
        from werkzeug.wrappers import Response
        return Response(challenge)

    frappe.throw("Forbidden", exc=frappe.PermissionError)

def _handle_webhook():
    payload = frappe.request.data
    headers = dict(frappe.request.headers)

    normalized_headers = {k.lower(): v for k, v in headers.items()}

    try:
        payload_dict = json.loads(payload.decode('utf-8'))
    except json.JSONDecodeError as e:
        frappe.throw("Invalid webhook data", exc=frappe.ValidationError)

    frappe.enqueue(
        engine_bg_task,
        queue="short",
        payload=payload_dict,
        headers=normalized_headers
    )
    # asyncio.run(get_engine_config().process_webhook(webhook_data=payload_dict, webhook_headers=normalized_headers))

    return "OK"

@frappe.whitelist()
def get_webhook():
    return frappe.utils.get_request_site_address() + '/api/method/frappe_pywce.webhook.webhook'

@frappe.whitelist()
def clear_session():
    frappe.cache.delete_keys("pywce:")

@frappe.whitelist(allow_guest=True, methods=["GET", "POST"])
def webhook():
    if frappe.request.method == 'GET':
        return _verifier()
    
    if frappe.request.method == 'POST':
        return _handle_webhook()
    
    frappe.throw("Forbidden method", exc=frappe.PermissionError)