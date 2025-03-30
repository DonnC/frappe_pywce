import asyncio

from frappe_pywce.config import get_engine_config, get_wa_config
import frappe


def engine_bg_task(payload: dict, headers: dict) -> None:
    asyncio.run(get_engine_config().process_webhook(webhook_data=payload, webhook_headers=headers))


def _verifier():
    """Verify WhatsApp webhook callback URL challenge."""
    params = frappe.request.args
    mode, token, challenge = params.get("hub.mode"), params.get("hub.verify_token"), params.get("hub.challenge")

    if get_wa_config().util.webhook_challenge(mode, challenge, token):
        return challenge

    frappe.throw("Forbidden", exc=frappe.PermissionError)

def _handle_webhook():
    payload = frappe.request.data
    headers = dict(frappe.request.headers)

    frappe.enqueue(
        engine_bg_task,
        queue="frappe_pywce",
        payload=payload,
        headers=headers
    )

    return "OK"

@frappe.whitelist(allow_guest=True, methods=["GET", "POST"])
def webhook():
    if frappe.request.method == 'GET':
        return _verifier()
    
    if frappe.request.method == 'POST':
        return _handle_webhook()
    
    frappe.throw("Forbidden method", exc=frappe.PermissionError)