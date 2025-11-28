// Copyright (c) 2025, donnc and contributors
// For license information, please see license.txt

frappe.ui.form.on("WhatsApp Support Ticket", {
  refresh(frm) {
    if (frm.doc.status === "Closed") {
      frm.disable_save();
    }

    if (frm.doc.status === "Open") {
      frm
        .add_custom_button(__("Claim Ticket"), function () {
          frm.call({
            method: "frappe_pywce.live_mode.claim_ticket",
            args: {
                ticket_id: frm.doc.name,
            },
            freeze: true,
            freeze_message: "Assigning and Greeting...",
            callback: function () {
              frm.reload_doc();
            },
          });
        })
        .addClass("btn-primary");
    }
  },
});
