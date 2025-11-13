import hashlib
import hmac
import frappe
from frappe_pywce.config import get_wa_config

def verify_webhook_signature(request):
    settings = frappe.get_single("ChatBot Config")

    if settings.env == "local":
        return True
    
    must_validate = frappe.utils.sbool(settings.validate_webhook_payload)
    secret = get_wa_config(settings).config.app_secret

    if must_validate:
        if not secret:
            return False
    
    sig256 = request.headers.get("X-Hub-Signature-256") or request.headers.get("X-Hub-Signature")
    if not sig256:
        return False
    
    body = request.get_data()

    try:
        if sig256.startswith("sha256="):
            recv_hex = sig256.split("=", 1)[1]

        else:
            recv_hex = sig256

    except:
        return False

    computed = hmac.new(secret.encode("utf-8"), body, hashlib.sha256).hexdigest()
    return hmac.compare_digest(computed, recv_hex)