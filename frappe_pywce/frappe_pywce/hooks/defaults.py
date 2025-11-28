import frappe
import frappe.auth

from frappe_pywce.util import  save_whatsapp_session
from frappe_pywce.managers import FrappeRedisSessionManager

from pywce import SessionConstants


session_manager = FrappeRedisSessionManager()


def login_handler(session_id:str, email:str, password:str) -> tuple:
    """
        Authenticate normally, then create a WhatsApp Session mapping so webhook can resume it.
        
        Returns (bool, message)
    """

    try:
        existing = frappe.db.exists("WhatsApp Session", session_id)
        if existing:
            return True, "Already logged in"
   
        login_manager = frappe.auth.LoginManager()
        login_manager.authenticate(email, password)
        login_manager.post_login()

        sid = frappe.session.sid
        user = frappe.session.user

        frappe.local.response["sid"] = sid
 
        save_whatsapp_session(session_id, sid, user, created_from=frappe.local.request_ip)

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