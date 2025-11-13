import frappe
import datetime
from frappe.utils import url_encode

from frappe_pywce.managers import FrappeRedisSessionManager
from frappe_pywce.util import bot_settings, save_whatsapp_session

session_manager = FrappeRedisSessionManager()

def _get_bot_number() -> str:
    """Remove any non-digit characters from the mobile number."""
    number = bot_settings().chatbot_mobile_number
    return ''.join(filter(str.isdigit, number))

def get_context(context):
    try:
        if frappe.session.user == "Guest":
            frappe.local.response["redirect_to"] = frappe.request.url
            frappe.local.response["type"] = "redirect"
            return

        token = frappe.request.args.get("token")
        if not token:
            context.message_title = "Link Missing"
            context.message = "Your login link is incomplete. Please request a new link from the bot."
            return

        try:
            token_doc = frappe.get_doc("WhatsApp Login Token", {"token": token})

            if datetime.datetime.now() > token_doc.expires_on:
                context.message_title = "Link Expired"
                context.message = "This login link has expired. Please request a new one from the bot."
                token_doc.delete(ignore_permissions=True)
                return

            session_id = token_doc.wa_id
            user = frappe.session.user

            save_whatsapp_session(session_id, frappe.session.sid, user)


            # Pre-fill a "magic" text. Bot can have a trigger 
            # for "(?i)i'm logged in" or something, to send a "Welcome back!" message.
            text = "menu"
            encoded_text = url_encode(text)
            
            wa_link = f"https://wa.me/{_get_bot_number()}?text={encoded_text}"
                
            context.whatsapp_link = wa_link
            context.message_title = "Success!"
            context.message = f"Thank you ({user})! You have been logged in successfully. Click the button below to return to WhatsApp and continue."
            context.show_button = True
            
            # 6. CLEAN UP
            token_doc.delete(ignore_permissions=True)
        
        except frappe.DoesNotExistError:
            context.message_title = "Link Invalid"
            context.message = "This login link is invalid or has already been used."
            
    except Exception as e:
        frappe.log_error(title="WA Bot LinkLogin Error")
        context.message_title = "Error"
        context.message = "An unexpected error occurred. Please try again."