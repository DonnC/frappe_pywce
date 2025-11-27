import frappe
from pywce import HookArg, WhatsAppServiceModel, client, template, WhatsAppService

from frappe_pywce.config import  get_engine_config
from frappe_pywce.util import clean_comment_for_whatsapp

_eng_config = get_engine_config()

def send_comment_to_whatsapp(doc, method):
    """
    Triggered when a comment is added/updated.
    If it's on a WhatsApp Ticket, send it to the user.
    """
    if doc.reference_doctype != "WhatsApp Support Ticket":
        return

    try:
        ticket = frappe.get_doc("WhatsApp Support Ticket", doc.reference_name)
    except frappe.DoesNotExistError:
        return

    if ticket.status != "Open":
        return

    message_text = clean_comment_for_whatsapp(doc.content)

    if "[Auto-Reply]" in message_text:
        return
    
    response_template = template.TextTemplate(
        message=message_text
    )
    
    custom_handler = frappe.get_hooks("pywce_live_outbound_handler")

    if custom_handler:
        try:
            response_template = frappe.call(custom_handler[0], doc, message_text)
            if response_template is None:
                return
        except Exception as e:
            frappe.log_error(f"Outbound Hook Error: {e}")


    if response_template:
        hook_arg = HookArg(
            session_manager=_eng_config.config.session_manager.session(ticket.wa_id),
            user=client.WaUser(
                wa_id=ticket.wa_id
            ),
            session_id=ticket.wa_id,
        )
        wa_serv_model = WhatsAppServiceModel(
            config=_eng_config.config,
            template=response_template,
            hook_arg= hook_arg
        )

        serv = WhatsAppService(wa_serv_model)
        serv.send_message(handle_session=False)

        # TODO: verify if msg was sent successfully

        