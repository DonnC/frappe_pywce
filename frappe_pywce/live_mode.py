import frappe
import frappe.utils
from pywce import HookArg, WhatsAppServiceModel, client, template, WhatsAppService

from frappe_pywce.config import  get_engine_config
from frappe_pywce.util import LIVE_MODE_AUTO_REPLY_PREFIX, LIVE_MODE_CACHE_KEY, LIVE_MODE_SYSTEM_ALERT_PREFIX, \
      LIVE_MODE_WHATSAPP_ALERT_PREFIX, clean_comment_for_whatsapp, create_cache_key, get_whatsapp_media_type

_eng_config = get_engine_config()
_wa_client = _eng_config.whatsapp
_session = _eng_config.config.session_manager

def send_wa_message(wa_id: str, message_template: template.BaseTemplate, hook_arg: HookArg=None):
    if message_template:
        hook_arg = hook_arg or HookArg(
            session_manager=_session.session(wa_id),
            user=client.WaUser(
                wa_id=wa_id
            ),
            session_id=wa_id,
        )
        wa_serv_model = WhatsAppServiceModel(
            config=_eng_config.config,
            template=message_template,
            hook_arg= hook_arg
        )

        serv = WhatsAppService(wa_serv_model)
        serv.send_message(handle_session=False)
        # TODO: verify if msg was sent successfully

def get_message_for_live_mode(payload:dict) -> HookArg:
    if not _wa_client.util.is_valid_webhook_message(payload): return None

    wa_user = _wa_client.util.get_wa_user(payload)
    response = _wa_client.util.get_response_structure(payload)
    computed_input = _wa_client.util.get_user_input(response)

    hook_arg = HookArg(
        session_id=wa_user.wa_id,
        session_manager=_session.session(wa_user.wa_id),
        user=wa_user,
        user_input=computed_input[0],
        additional_data=computed_input[1]
    )
    
    return hook_arg

# --- events functions ---
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
    
    if ticket.assigned_agent and ticket.assigned_agent != doc.owner:
        return
    
    # Auto-claim ticket if unassigned
    # if not ticket.assigned_agent:
    #     ticket.assigned_agent = doc.owner
    #     ticket.save(ignore_permissions=True)

    message_text = clean_comment_for_whatsapp(doc.content)

    if LIVE_MODE_WHATSAPP_ALERT_PREFIX in message_text or LIVE_MODE_AUTO_REPLY_PREFIX in message_text or LIVE_MODE_SYSTEM_ALERT_PREFIX in message_text:
        return
    
    response_template = template.TextTemplate(
        message=message_text
    )
    
    send_wa_message(ticket.wa_id, response_template)

def on_ticket_update(doc, method):
    """
    Triggered on_update of WhatsApp Support Ticket.
    Handles closing the live chat session.
    """
    previous_doc = doc.get_doc_before_save()
    
    if not previous_doc:
        return

    was_open = previous_doc.status == "Open"
    is_closed = doc.status in ["Closed", "Resolved"]

    if was_open and is_closed:
        wa_id = doc.wa_id
        
        stop_live_mode(wa_id)
        
        try:
            doc.add_comment("Comment", text=f"{LIVE_MODE_SYSTEM_ALERT_PREFIX} Support chat closed by {frappe.session.user}.")
            doc.save(ignore_permissions=True)

            msg = "This support chat has been *closed*.\n\nYou are now reconnected to the automated assistant."
            response_template = template.TextTemplate(message=msg)
            send_wa_message(wa_id, response_template)
            
        except Exception as e:
            frappe.log_error(f"Failed to close chat for {wa_id}: {e}")

def on_file_upload(file_doc, method):
    """
    Automatically upload doctype attachment to whatsapp

    Assumption: If Agent uploads a file, it is to send to the user on the active open support chat

    Args:
        file_doc (Document): document object of the File doctype
        method (str): called method
    """
    if file_doc.attached_to_doctype != "WhatsApp Support Ticket":
        return

    try:
        ticket = frappe.get_doc("WhatsApp Support Ticket", file_doc.attached_to_name)
    except frappe.DoesNotExistError:
        return

    if ticket.status != "Open":
        return

    try:
        full_path = file_doc.get_full_path()
        media_id = _wa_client.util.upload_media(media_path=full_path)
        
        if not media_id:
            raise ValueError("Media upload returned no media ID.")
        
        response_template = template.MediaTemplate(
            typing=True,
            message=template.MediaMessage(
                kind=get_whatsapp_media_type(file_doc.file_name),
                media_id=media_id,
                caption=f"Attachment: {file_doc.file_name}",
                filename=file_doc.file_name
            )
        )

        send_wa_message(ticket.wa_id, response_template)

        ticket.add_comment("Comment", text=f"{LIVE_MODE_SYSTEM_ALERT_PREFIX} 📤: Automatically sent file '{file_doc.file_name}' to user.")

    except Exception as e:
        frappe.log_error(f"WhatsApp file upload error")
        frappe.msgprint(f"⚠️ Failed to send file to WhatsApp: {e}")

def init_live_mode(wa_id: str, context: dict = None):
    """
    Starts Live Mode for a user.
    The bot engine will stop processing messages for this user.
    
    Args:
        wa_id (str): The user's WhatsApp ID.
        context (dict): Optional data to store in the session 
                        (e.g., {'ticket_id': 'ISS-001', 'source': 'erpnext'}).
    """
    
    data = {
        "is_active": True,
        "started_at": frappe.utils.now()
    }
    
    if context:
        data.update(context)
        
    _session.save(wa_id, create_cache_key(LIVE_MODE_CACHE_KEY), data)

def live_mode_active(wa_id: str) -> bool:
    """
    Check if Live Mode is active for the given WhatsApp ID.
    """
    state = _session.get(wa_id, create_cache_key(LIVE_MODE_CACHE_KEY))
    return state.get("is_active") if state else False

def stop_live_mode(wa_id: str):
    """
    Ends Live Mode.
    The user will return to the automated bot flow on their next message.
    """
    _session.evict(wa_id, create_cache_key(LIVE_MODE_CACHE_KEY))

def get_live_context(wa_id: str):
    """
    Retrieve the context data stored when live mode was started.
    """
    return _session.get(wa_id, create_cache_key(LIVE_MODE_CACHE_KEY))

# --- non-events functions ---
@frappe.whitelist()
def claim_ticket(ticket_id:str):
    """
    Assigns the current user as the agent for the given WhatsApp Support Ticket.
    Sends a greeting message to the user notifying them of the assignment.

    If the ticket is already claimed by another agent, it updates the assignment
    to the current user and notifies them.

    Args:
        ticket_id (str): the name of the WhatsApp Support Ticket DocType
    """
    greeting_text = "👋 Hello! I am {0}, and I will be assisting you today. How can I help you?"

    try:
        is_reassigned = False
        old_agent = ""
        ticket = ticket = frappe.get_doc("WhatsApp Support Ticket", ticket_id)

        if ticket.assigned_agent:
            is_reassigned = True
            old_agent = ticket.assigned_agent
            greeting_text = f"Update: I am {0}, and I am taking over this chat to assist you further."

        ticket.assigned_agent = frappe.session.user
        ticket.claimed_at = frappe.utils.now()
        ticket.save(ignore_permissions=True)

        greeting_text = greeting_text.format(agent_name)

        agent_name = frappe.db.get_value("User", frappe.session.user, "full_name") or "Support Agent"

        response_template = template.TextTemplate(
            message=greeting_text
        )

        send_wa_message(ticket.wa_id, response_template)

        if is_reassigned:
            ticket.add_comment("Comment", text=f"{LIVE_MODE_SYSTEM_ALERT_PREFIX} Reassigned from {old_agent} to {ticket.assigned_agent}")

        else:
            ticket.add_comment("Comment", text=f"{LIVE_MODE_SYSTEM_ALERT_PREFIX} Sent greeting: '{greeting_text}'")
            
        frappe.msgprint("You have claimed this ticket. User has been notified.")
            
    except Exception as e:
        frappe.log_error("WhatsApp ticket claim failed")
        frappe.msgprint("Ticket claimed, but failed to send WhatsApp greeting.")

# --- end non-events functions ---

