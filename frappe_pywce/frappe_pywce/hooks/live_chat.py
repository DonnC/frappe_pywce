import frappe

from pywce import HookArg, TemplateDynamicBody

from frappe_pywce.live_mode import init_live_mode

def start_live_chat(arg: HookArg) -> HookArg:
    """
    The default live chat handler.
    Hook to transition user from Bot Mode to Live Human.
    """
    existing_ticket = frappe.db.get_value(
        "WhatsApp Support Ticket", 
        {"wa_id": arg.session_id, "status": "Open"}, 
        "name"
    )
    
    if existing_ticket:
        ticket_name = existing_ticket
        msg = f"Reconnecting you to your open support ticket: *({ticket_name})*..."

    else:
        ticket = frappe.get_doc({
            "doctype": "WhatsApp Support Ticket",
            "wa_id": arg.session_id,
            "wa_name": arg.user.name,
            "status": "Open",
            "subject": f"Support Request from {arg.session_id}",
            "user": frappe.session.user or None
        })
        ticket.insert(ignore_permissions=True)
        ticket_name = ticket.name
        msg = "Connecting you to an agent... Please wait."

    init_live_mode(arg.session_id, {"ticket_name": ticket_name})
    
    arg.template_body = TemplateDynamicBody(render_template_payload={"message": msg})

    return arg