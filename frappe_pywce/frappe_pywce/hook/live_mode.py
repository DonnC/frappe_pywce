# live mode logic

# 1. Support Live support / human takeover of conversations
# -  Hook into comment creation on WhatsApp Support Ticket to send messages back to WhatsApp

# 2. AI logic can be added here later
import frappe

from pywce import client


from frappe_pywce.util import bot_settings
from frappe_pywce.config import  get_wa_config

_whatsapp: client.WhatsApp = get_wa_config(bot_settings())

def send_comment_to_whatsapp(doc, method):
    if doc.reference_doctype != "WhatsApp Support Ticket":
        return

    ticket = frappe.get_doc("WhatsApp Support Ticket", doc.reference_name)
    wa_id = ticket.wa_id
    
    if ticket.status == "Open":
        response = _whatsapp.send_message(
            recipient_id=wa_id,
            message=doc.content
        )

        is_sent = _whatsapp.util.was_request_successful(
            recipient_id=wa_id,
            response_data=response
        )

        if not is_sent:
            frappe.log_error(
                title="[Human] Live Mode WhatsApp Error",
                message=f"WhatsApp Upstream Response: {response}"
            )
            frappe.throw(
                title='WhatsApp Error',
                msg='Message not sent. Check error log for more'
            )
