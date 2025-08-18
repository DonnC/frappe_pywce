from fnmatch import fnmatch
import json
import frappe
from frappe.auth import LoginManager
import frappe.utils.logger

from pywce import SessionConstants

frappe.utils.logger.set_log_level("DEBUG")
logger = frappe.logger("frappe_pywce", allow_site=True)

from frappe_pywce.config import get_engine_config

def whatsapp_session_hook():
    """
        check if its webhook request, check user session if available and resume-inject
        logged in user session
    """
    request_path = frappe.request.path
    pywce_path = '/api/method/frappe_pywce.webhook.*'

    if fnmatch(request_path, pywce_path):
        if frappe.session.user != 'Guest': return
        
        raw_payload = frappe.request.data

        try: webhook_data = json.loads(raw_payload.decode('utf-8'))
        except json.JSONDecodeError as e: return
        
        wa_user = get_engine_config().config.whatsapp.util.get_wa_user(webhook_data)

        if wa_user is None: return
        
        session = get_engine_config().config.session_manager
        auth_data = session.get(session_id=wa_user.wa_id, key=SessionConstants.VALID_AUTH_SESSION) or {}

        if auth_data.get("sid") is None: return

        # Inject for session resumption
        frappe.local.form_dict["sid"] = auth_data.get("sid")

        # Re-bootstrap LoginManager
        frappe.local.login_manager = LoginManager()

        logger.debug('[whatsapp_session_hook] resume-inject sid success:, <user>: %s', frappe.session.user)

    else: return
