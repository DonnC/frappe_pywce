import datetime
import urllib.parse

import frappe

from frappe_pywce.util import bot_settings, save_whatsapp_session

from frappe_pywce.pywce_logger import app_logger as logger


def _get_bot_number() -> str:
    number = bot_settings().chatbot_mobile_number
    return ''.join(filter(str.isdigit, number))

def get_context(context):
    context.show_login_button = False
    context.show_whatsapp_button = False
    
    try:
        if frappe.session.user == "Guest":
            # TODO: Add a redirect automatically to login page with redirect back to this page
            login_url = "/login"
            redirect_to_url = frappe.request.url
            full_login_url = f"{login_url}?redirect-to={redirect_to_url}"

            context.message_title = "Login Required"
            context.message = "Please log in to link your account. Click the button below to go to the secure login page."
            
            context.full_login_url = full_login_url
            context.show_login_button = True
            return
    
        
        context.message = f"You are logged in as: {frappe.session.user}. Please wait..."

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
            save_result = save_whatsapp_session(session_id, frappe.session.sid, user)

            logger.debug("Saved WhatsApp session result: %s", save_result)

            # text to show logged in menu
            text = "menu"
            encoded_text = urllib.parse.quote(text)
            wa_link = f"https://wa.me/{_get_bot_number()}?text={encoded_text}"
                
            context.message_title = "Success!"
            context.message = f"Thank you ({user})! You are now logged in. Click the button below to return to WhatsApp."
            context.show_whatsapp_button = True
            context.whatsapp_link = wa_link
            
            token_doc.delete(ignore_permissions=True)
        
        except frappe.DoesNotExistError:
            context.message_title = "Link Invalid"
            context.message = "This login link is invalid or has already been used."
            
    except:
        logger.critical("ChatBot link login error", exc_info=True)
        context.message_title = "Error"
        context.message = "An unexpected error occurred. Please try again."