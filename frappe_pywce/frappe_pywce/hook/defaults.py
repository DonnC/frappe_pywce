import datetime

import frappe
import frappe.auth
import frappe.utils.logger

from pywce import HookArg, SessionConstants, TemplateDynamicBody
from frappe_pywce.managers import FrappeRedisSessionManager

frappe.utils.logger.set_log_level("DEBUG")
logger = frappe.logger("frappe_pywce", allow_site=True)

# TODO: use the initialized manager in engine_config
session_manager = FrappeRedisSessionManager()

def login_handler(session_id:str, email:str, password:str) -> tuple:
    """
       A helper function to handle login.
       On success: auth data like SID are saved to session

       On next webhook, the user session is automatically reconstructed if it exists.
    
       Returns: tuple
                (bool, str) -> (False, "Invalid creds")
    """
    try:
        if session_manager.get(session_id, SessionConstants.VALID_AUTH_SESSION) is not None:
            return True, "Already logged in"
    
        login_duration_min = frappe.db.get_single_value("PywceConfig", "expiry")

        current_datetime_utc = datetime.datetime.now()
        time_delta = datetime.timedelta(minutes=login_duration_min)
        future_datetime_utc = current_datetime_utc + time_delta
        login_expiry = future_datetime_utc.isoformat()

        if frappe.db.get_single_value("PywceConfig", "wa_id_same_mobile") == 1:
            user_mobile = frappe.db.get_value("User", email, "mobile_no")
            if user_mobile is None:
                return False, "Mobile number not linked to account"

            if user_mobile != session_id:
                return False, "WhatsApp number not the same as mobile number linked to account"

        login_manager = frappe.auth.LoginManager()
        login_manager.authenticate(email, password)
        login_manager.post_login()

        frappe.local.response["sid"] = frappe.session.sid
 
        session_data = {
            "sid": frappe.session.sid,
            "user": frappe.session.user,
            "full_name": frappe.session.full_name,
            "login_time": frappe.utils.now()
        }

        session_manager.save(session_id, SessionConstants.AUTH_EXPIRE_AT, login_expiry)
        session_manager.save(session_id, SessionConstants.VALID_AUTH_SESSION, session_data)
    
        return True, "Login successful"
    
    except frappe.AuthenticationError:
        frappe.log_error(title="[pywce] Login AuthError")
        if frappe.local.response and "message" in frappe.local.response:
            message = frappe.local.response["message"]
        else:
            message="Authentication failed!"
        return False, message

    except Exception as e:
        frappe.log_error(title="[pywce] Unexpected Login Error")

    return False, "Failed to process login, check your details and try again"

def logout_handler(session_id:str):
    try:
        usr = session_manager.get(session_id, SessionConstants.VALID_AUTH_SESSION).get('user')
        login_manager = frappe.auth.LoginManager()
        login_manager.logout(user=usr)
    except Exception as e:
        frappe.log_error(title="[pywce] Logout")
    finally:
        session_manager.clear(session_id)
        frappe.set_user('Guest')