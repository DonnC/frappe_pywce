import frappe
import frappe.utils
import secrets
import datetime
from pywce import HookArg, TemplateDynamicBody
from pywce.src import exceptions
from util import get_logger

logger = get_logger()

@frappe.whitelist()
def generate_login_link(hook: HookArg) -> TemplateDynamicBody:
    """
    Called by a bot state (e.g., on-receive).
    Generates a one-time login token and returns a message with the link.

    The template must be a CTA button where the link is dynamically generated, {{ link }}
    """

    EXPIRE_AFTER_IN_MINS = 5

    try:
        # token length may be configured from hook params if need be
        token = secrets.token_urlsafe(32)
        
        expires_on = datetime.datetime.now() + datetime.timedelta(minutes=EXPIRE_AFTER_IN_MINS)

        token_doc = frappe.get_doc({
            "doctype": "WhatsApp Login Token",
            "token": token,
            "wa_id": hook.session_id,
            "expires_on": expires_on
        })

        token_doc.insert(ignore_permissions=True)

        # Build the full, absolute URL
        login_url = frappe.utils.get_url(f"/whatsapp-bot-login?token={token}")

        message_body = {
            "link": login_url,
            "expiry": EXPIRE_AFTER_IN_MINS
        }

        return TemplateDynamicBody(render_template_payload=message_body)

    except Exception as e:
        frappe.log_error(title="Generate Bot LoginLink")
        raise exceptions.EngineResponseException("Sorry, I couldn't generate a login link right now. Please try again later.")