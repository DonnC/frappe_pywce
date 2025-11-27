import frappe

from pywce import HookArg, TemplateDynamicBody

def start_live_chat(arg: HookArg) -> HookArg:
    """
    Hook to transition user from Bot Mode to Live Human or AI Agent Mode.
    Creates a Ticket and sets the Redis flag.
    """
    existing_ticket = frappe.db.get_value(
        "WhatsApp Support Ticket", 
        {"wa_id": arg.session_id, "status": "Open"}, 
        "name"
    )
    
    if existing_ticket:
        ticket_name = existing_ticket
        msg = "Reconnecting you to your open support ticket..."

    else:
        ticket = frappe.get_doc({
            "doctype": "WhatsApp Support Ticket",
            "wa_id": arg.session_id,
            "status": "Open",
            "subject": f"Support Request from {arg.session_id}",
            "user": frappe.session.user or None
        })
        ticket.insert(ignore_permissions=True)
        ticket_name = ticket.name
        msg = "Connecting you to an agent... Please wait."

    arg.session_manager.save(arg.session_id, "live_mode", {
        "is_active": True,
        "ticket_name": ticket_name
    })
    
    frappe.publish_realtime(
        event='msg_print', 
        message=f'New WhatsApp Chat from {arg.session_id}',
        doctype='WhatsApp Support Ticket', 
        docname=ticket_name
    )
    
    arg.template_body = TemplateDynamicBody(render_template_payload={"message": msg})

    return arg