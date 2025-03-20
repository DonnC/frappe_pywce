from frappe_pywce.api import get_wa_config
import frappe
import pywce


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
    pass

def engine_bg_task(payload: dict, headers: dict) -> None:
    await engine.process_webhook(webhook_data=payload, webhook_headers=headers)

@frappe.whitelist(allow_guest=True, methods=["GET", "POST"])
def webhook_handler():
    if frappe.request.method == 'GET':
        return _verifier()
    
    if frappe.request.method == 'POST':
        return _handle_webhook()
    
    frappe.throw("Forbidden method", exc=frappe.PermissionError)