// Copyright (c) 2025, donnc and contributors
// For license information, please see license.txt

frappe.ui.form.on("ChatBot Config", {
  refresh: function (frm) {
    frm.add_custom_button(__("View Webhook Url"), function () {
      frm.call({
        method: "frappe_pywce.webhook.get_webhook",
        callback: function (r) {
          frappe.msgprint(r.message);
        },
      });
    });

    frm.add_custom_button(__("Clear Cache"), function () {
      frm.call({
        method: "frappe_pywce.webhook.clear_session",
        callback: function (r) {
          frappe.show_alert("Cache Cleared");
        },
      });
    });

    frm.add_custom_button(__("Open Studio"), function () {
      window.open(`/bot/studio`, "_blank");
    });
  },

  btn_launch_emulator: function (frm) {
    frappe.warn(
      "Launch local Bot emulator",
      "Ensure you started the dev server with `yarn dev` in the app folder",
      () => {
        window.open("/bot/emulator", "_blank");
      },
      "Continue",
      true
    );
  },
});
