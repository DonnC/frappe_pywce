from fnmatch import fnmatch
import json
import frappe
from frappe.auth import LoginManager
import frappe.utils.data

from pywce import SessionConstants

from frappe_pywce.util import create_cache_key, get_logger
from frappe_pywce.security import verify_webhook_signature
from frappe_pywce.config import get_engine_config


logger = get_logger()

def whatsapp_session_hook():
    """
        check if its webhook request, check user session if available and resume-inject
        logged in user session
    """
    if getattr(frappe.local, "pywce_session_hook_ran", False):
        return
    
    frappe.local.pywce_session_hook_ran = True

    request_path = frappe.request.path
    pywce_path = '/api/method/frappe_pywce.webhook.*'

    if fnmatch(request_path, pywce_path):
        if frappe.session.user != 'Guest': return

        try:
            raw_payload = frappe.request.data

            if not verify_webhook_signature(frappe.request):
                logger.warning(f"WhatsApp hook signature failed: %s", raw_payload)
                return
        
            webhook_data = json.loads(raw_payload.decode('utf-8'))
        except:
            logger.error("Signature verification error", exc_info=True) 
            return
        
        wa_user = get_engine_config().config.whatsapp.util.get_wa_user(webhook_data)

        if wa_user is None: return

        session_cache_key = create_cache_key(f"session:{wa_user.wa_id}")

        # attempt cache read
        data = frappe.cache.get_value(session_cache_key)
        
        if data:
            try:
                cached = json.loads(data)
                sid = cached.get("sid")

                # expiry check
                if cached.get("expires_on") and frappe.utils.data.get_datetime(cached["expires_on"]) < frappe.utils.data.now_datetime():
                    frappe.cache.delete_value(session_cache_key)
                    return
                
            except:
                sid = None

        else:
            sid = None

        # fallback to DB lookup
        if not sid:
            try:
                doc = frappe.get_doc("WhatsApp Session", wa_user.wa_id)
                if doc.status != 'active': return
                if doc.expires_on and frappe.utils.data.get_datetime(doc.expires_on) < frappe.utils.data.now_datetime():
                    doc.status = "expired"
                    doc.save(ignore_permissions=True)
                    return
                
                sid = doc.sid

            except frappe.DoesNotExistError:
                return
            
        if not sid:
            return

        session = get_engine_config().config.session_manager
        auth_data = session.get(session_id=wa_user.wa_id, key=SessionConstants.VALID_AUTH_SESSION) or {}

        if auth_data.get("sid") is None or auth_data.get("sid") != sid: return

        # Inject for session resumption
        frappe.local.form_dict["sid"] = sid

        # Re-bootstrap LoginManager
        try:
            frappe.local.login_manager = LoginManager()
        except:
            frappe.local.form_dict.pop("sid", None)
            logger.error("Injected sid, LoginManager rebootstrap error", exc_info=True)
            return

        # mark last used
        try:
            doc = frappe.get_doc("WhatsApp Session", wa_user.wa_id)
            doc.last_used = frappe.utils.data.now_datetime()
            doc.save(ignore_permissions=True)
            # refresh cache
            payload = json.dumps({"sid": doc.sid, "user": doc.user, "expires_on": doc.expires_on})
            remaining = (frappe.utils.data.get_datetime(doc.expires_on) - frappe.utils.data.now_datetime()).total_seconds()

            if remaining > 0:
                frappe.cache.set_value(session_cache_key, payload, expires_in_sec=int(remaining))

        except:
            pass

        # may do further cleanup
        # frappe.local.form_dict.pop("sid", None)

        logger.debug('[whatsapp_session_hook] resume-inject sid success:, <user>: %s', frappe.session.user)

    else: return
