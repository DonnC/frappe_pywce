import hashlib
import hmac
import json

from frappe_pywce.config import get_engine_config, get_wa_config
import frappe
import frappe.utils

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

def _verify_webhook_signature(payload: bytes, received_sig: str):
    if not received_sig:
        frappe.throw("Missing X-Hub-Signature-256 header", exc=frappe.ValidationError)

    expected_sig = "sha256=" + hmac.new(get_wa_config().config.app_secret.encode("utf-8"), payload, hashlib.sha256).hexdigest()

    if not hmac.compare_digest(expected_sig, received_sig):
        frappe.log_error(title="Chatbot Webhook Signature")
        frappe.throw("Invalid webhook signature", exc=frappe.ValidationError)


def internal_webhook_handler(payload, headers):
    """Process webhook data internally

    If user is authenticated in the session, get current user and call

    frappe.set_user(...)

    This is because, each webhook requests comes in as a guest request since its initiated by whatsapp

    frappe.set_user(..) is called if and only if all secure checks are valid

    Its reset back when a request is sent back to whatsapp

    Args:
        payload (dict): webhook raw payload data to process
        headers (dict): request headers
    """
    site = frappe.db.get_single_value("PywceConfig", "site")

    if not site:
        frappe.throw(msg="Site not configured in app settings")

    try:
        frappe.connect(site=site, set_admin_as_user=False)
        get_engine_config().process_webhook(payload, headers)

    except Exception as e:
        frappe.log_error(title="Chatbot Webhook Handler", message=f"Error handling webhook: {frappe.get_traceback(with_context=True)}")

    finally:
        frappe.db.close()
        frappe.set_user('Guest')

def _handle_webhook():
    payload = frappe.request.data
    headers = dict(frappe.request.headers)

    normalized_headers = {k.lower(): v for k, v in headers.items()}

    _verify_webhook_signature(payload, headers.get("x-hub-signature-256"))

    try:
        payload_dict = json.loads(payload.decode('utf-8'))
    except json.JSONDecodeError as e:
        frappe.throw("Invalid webhook data", exc=frappe.ValidationError)

    should_run_in_bg = frappe.db.get_single_value("PywceConfig", "process_in_background")

    if should_run_in_bg == 1:
        wa_user = get_wa_config().util.get_wa_user(payload_dict)

        if wa_user is None:
            return "Invalid user"

        frappe.enqueue(
            internal_webhook_handler,
            queue="short",
            payload=payload_dict,
            headers=normalized_headers,
            job_id=f"fpw:{wa_user.wa_id}:{wa_user.msg_id}"
        )

    else:
        internal_webhook_handler(payload=payload_dict, headers=normalized_headers)

    return "OK"

@frappe.whitelist()
def get_webhook():
    return frappe.utils.get_request_site_address() + '/api/method/frappe_pywce.webhook.webhook'

@frappe.whitelist()
def clear_session():
    frappe.cache.delete_keys("fpw:")

@frappe.whitelist(allow_guest=True, methods=["GET", "POST"])
def webhook():
    if frappe.request.method == 'GET':
        return _verifier()
    
    if frappe.request.method == 'POST':
        return _handle_webhook()
    
    frappe.throw("Forbidden method", exc=frappe.PermissionError)