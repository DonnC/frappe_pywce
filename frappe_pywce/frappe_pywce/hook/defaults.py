"""
default hooks

1. Get default username
2. Login user
"""
import secrets
import frappe
from pywce import HookArg, ISessionManager, SessionConstants, TemplateDynamicBody

import frappe.auth
import frappe.utils

def get_name(arg: HookArg) -> HookArg:
    _name = arg.user.name
    arg.session_manager.save(session_id=arg.user.wa_id, key="username", data=_name)
    arg.template_body = TemplateDynamicBody(render_template_payload={"name": _name})
    
    return arg

def login_usr(arg: HookArg) -> dict:
    """
        a helper login function

        returns a dict with 

        {
            "success": false,
            "message": "invalid username"
        }
    """
    login_manager = frappe.auth.LoginManager()

    success = False
    message = "Failed to process request"

    usr = arg.additional_data.get('usr')
    pwd = arg.additional_data.get('pwd')

    if not isinstance(arg.session_manager, ISessionManager):
        raise frappe.ValidationError

    if not usr or not pwd:
        message = "Missing email or username and or password"

    try:
        if arg.session_manager.get(arg.session_id, SessionConstants.VALID_AUTH_SESSION) is not None:
            return {"success": True, "message": "Already logged in"}

        login_manager.authenticate(user=usr, pwd=pwd)
        login_duration_min = frappe.db.get_single_value("PywceConfig", "expiry")
        login_expiry = frappe.utils.add_to_date(frappe.utils.now(), minutes=login_duration_min).isoformat()

        user_mobile = frappe.db.get_value("User", usr, "mobile_no")

        if frappe.db.get_single_value("PywceConfig", "wa_id_same_mobile") == 1:
            if user_mobile is None:
                return {"success": False, "message": "Mobile number not linked to account"}

            if user_mobile != arg.user.wa_id:
                return {"success": False, "message": "WhatsApp number not the same as mobile number linked to account"}

        session_data = {
            "name": login_manager.user,
            "usr": usr,
            "token": secrets.token_urlsafe(32),
            "login_time": frappe.utils.now(),
            "expiry_time": login_expiry
        }

        arg.session_manager.save(arg.session_id, SessionConstants.AUTH_EXPIRE_AT, login_expiry)
        arg.session_manager.save(arg.session_id, SessionConstants.VALID_AUTH_MSISDN, arg.user.wa_id)
        arg.session_manager.save(arg.session_id, SessionConstants.VALID_AUTH_SESSION, session_data)

        frappe.set_user(usr)
        login_manager.post_login()

        success, message = True, "Login successful"

    except frappe.AuthenticationError:
        success = False
        if frappe.local.response and "message" in frappe.local.response:
            message = frappe.local.response["message"]
        else:
            message="Authentication failed!"
        frappe.set_user('Guest')

    except Exception as e:
        frappe.set_user('Guest')
        frappe.log_error("Chatbot Login")
        success, message = False, "Failed to process login"

    return {"success": success, "message": message}

def logout_usr(arg: HookArg) -> HookArg:
    try:
        usr = arg.session_manager.get(arg.session_id, SessionConstants.VALID_AUTH_SESSION).get('usr')
        frappe.auth.LoginManager().logout(user=usr)
    finally:
        arg.session_manager.clear(arg.session_id)
        frappe.set_user('Guest')

    return arg
    
@frappe.whitelist(allow_guest=True)
def hook_wrapper(arg: HookArg, login:bool=False):
    if login is True:
        return login_usr(arg)
    logout_usr(arg)
