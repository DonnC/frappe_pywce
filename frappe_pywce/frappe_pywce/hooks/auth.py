import secrets
import datetime

import frappe
import frappe.utils

from pywce import EngineResponseException, HookArg, TemplateDynamicBody

from frappe_pywce.util import LOGIN_LINK_EXPIRE_AFTER_IN_MIN
from frappe_pywce.pywce_logger import app_logger

@frappe.whitelist()
def generate_login_link(arg: HookArg) -> HookArg:
    """
    Called by a bot state (e.g., on-receive).
    Generates a one-time login token and returns a message with the link.

    The template must be a CTA button where the link is dynamically generated, {{ link }}
    """

    app_logger.debug("Generating login link for: %s", arg)

    try:
        # token length may be configured from hook params if need be
        token = secrets.token_urlsafe(32)
        
        expires_on = datetime.datetime.now() + datetime.timedelta(minutes=LOGIN_LINK_EXPIRE_AFTER_IN_MIN)

        token_doc = frappe.get_doc({
            "doctype": "WhatsApp Login Token",
            "token": token,
            "wa_id": arg.session_id,
            "expires_on": expires_on
        })

        token_doc.insert(ignore_permissions=True)

        # Build the full, absolute URL
        login_url = frappe.utils.get_url(f"/whatsapp-bot-login?token={token}")
 
        message_body = {
            "link": login_url,
            "expiry": LOGIN_LINK_EXPIRE_AFTER_IN_MIN
        }

        arg.template_body = TemplateDynamicBody(render_template_payload=message_body)

        return arg

    except Exception:
        frappe.log_error(title="Generate Bot LoginLink")
        raise EngineResponseException("Sorry, I couldn't generate a login link right now. Please try again later.")