import datetime
import json
import frappe
import frappe.utils.logger
from frappe.sessions import get_expiry_in_seconds
from frappe.utils import now_datetime

from frappe_pywce.managers import FrappeRedisSessionManager
from pywce import HookUtil, SessionConstants

# constants
LOGIN_DURATION_IN_MIN = 10
CACHE_KEY_PREFIX = "fpw:"

def create_cache_key(k:str):
    return f'{CACHE_KEY_PREFIX}{k}'

def get_logger():
    frappe.utils.logger.set_log_level("DEBUG")
    logger = frappe.logger("frappe_pywce", allow_site=True)

    return logger

def bot_settings():
    """Fetch Bot Settings from Frappe Doctype 'ChatBot Config'"""
    logger = get_logger()
    try:
        settings = frappe.get_single("ChatBot Config")
        return settings
    except Exception as e:
        logger.error("Failed to fetch Bot Settings: %s", str(e))
        frappe.throw(frappe._("Failed to fetch Bot Settings: {0}").format(str(e)))


def save_whatsapp_session(wa_id: str, sid: str, user: str, desired_ttl_minutes: int|None=None, created_from: str|None=None):
    """Persist mapping in DocType and cache. TTL chosen as min(desired ttl, Frappe session remaining)."""
    logger = get_logger()
    session_manager = FrappeRedisSessionManager()

    desired_ttl_minutes = desired_ttl_minutes or LOGIN_DURATION_IN_MIN

    # Compute Frappe session remaining seconds (safe fallback)
    try:
        session_data = frappe.local.session_obj.data.data
        session_expiry_value = session_data.get("session_expiry")
        session_expiry_seconds = get_expiry_in_seconds(session_expiry_value)
        # get how many seconds remain from now if last_updated present
        last_updated = session_data.get("last_updated")
        if last_updated:
            # last_updated is ISO string - fallback: treat remaining = session_expiry_seconds
            remaining_seconds = session_expiry_seconds
        else:
            remaining_seconds = session_expiry_seconds
    except Exception:
        remaining_seconds = None

    desired_seconds = int(desired_ttl_minutes) * 60
    # Choose TTL (the mapping should not outlive the underlying session)
    if remaining_seconds:
        ttl_seconds = min(desired_seconds, remaining_seconds)
    else:
        ttl_seconds = desired_seconds

    expires_on = (now_datetime() + datetime.timedelta(seconds=ttl_seconds)).strftime("%Y-%m-%d %H:%M:%S")

    # Create / update DocType
    try:
        doc = frappe.get_doc({
            "doctype": "WhatsApp Session",
            "provider": "whatsapp",
            "wa_id": wa_id,
            "sid": sid,
            "user": user,
            "expires_on": expires_on,
            "status": "active",
            "created_from": created_from or frappe.local.request_ip or ""
        })
        doc.insert(ignore_permissions=True)

    except frappe.DuplicateEntryError:
        # update existing record instead of insert
        doc = frappe.get_doc("WhatsApp Session", wa_id)
        doc.sid = sid
        doc.user = user
        doc.expires_on = expires_on
        doc.status = "active"
        doc.save(ignore_permissions=True)

    session_data = {
        "sid": sid,
        "user": user,
        "full_name": frappe.session.full_name,
        "login_time": frappe.utils.now()
    }

    session_manager.save(wa_id, SessionConstants.AUTH_EXPIRE_AT, expires_on)
    session_manager.save(wa_id, SessionConstants.VALID_AUTH_SESSION, session_data)


    # Cache for quick lookup (optional)
    try:
        payload = json.dumps({"sid": sid, "user": user, "expires_on": expires_on})
        frappe.cache.set_value(create_cache_key(f"session:{wa_id}"), payload, expires_in_sec=ttl_seconds)
    except Exception:
        logger.debug("Unable to set cache for wa_id=%s", wa_id)

    return True



def frappe_recursive_renderer(template_dict: dict, hook_path: str, hook_arg: object, ext_hook_processor: object) -> dict:
    """
    It does two things:
    1. Gets the business context from the hook.
    2. Recursively renders the template using frappe.render_template, which
       adds the global Frappe context automatically.
    """
    
    # 1. Get Business Context (from the template hook)
    business_context = {}
    if hook_path:
        try:
            response = HookUtil.process_hook(
                hook=hook_path,
                arg=hook_arg,
                external=ext_hook_processor
            )
            business_context = response.template_body.render_template_payload 
        except Exception as e:
            frappe.log_error(message=f"pywce template hook failed: {hook_path}", title="Frappe Recursive Renderer Hook Error")
            business_context = {"hook_error": str(e)}

    # 2. Define the recursive rendering function
    def render_recursive(value):
        if isinstance(value, str):
            # We pass the business_context. Frappe automatically
            # merges it with the global Frappe context.
            return frappe.render_template(value, business_context)
        
        elif isinstance(value, dict):
            return {key: render_recursive(val) for key, val in value.items()}
        
        elif isinstance(value, list):
            return [render_recursive(item) for item in value]
        
        return value

    # 3. Start the recursion on the whole template dictionary
    return render_recursive(template_dict)