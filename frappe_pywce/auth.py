import json
import frappe
from frappe.auth import LoginManager

from pywce import SessionConstants
from frappe_pywce.config import get_engine_config

def whatsapp_session_hook():
    """
        check if its webhook request, check user session if available and resume-inject
        logged in user session
    """
    if frappe.request.path.endswith('/api/method/frappe_pywce.webhook.webhook'):
        print('[whatsapp_session_hook] Attempting to check authd user to resume-inject sid')

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

        # Re-bootstrap LoginManager (it will see sid and do make_session(resume=True))
        frappe.local.login_manager = LoginManager()

        print('[whatsapp_session_hook] resume-inject sid success:, <user>: ', frappe.session.user)

    else: return
