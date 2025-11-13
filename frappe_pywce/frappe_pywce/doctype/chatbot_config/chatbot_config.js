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
          frappe.msgprint({
            title: __("Cache"),
            indicator: "green",
            message: __("Chatbot session cache cleared!"),
          });
        },
      });
    });

    frm.add_custom_button(__("Open Builder"), function () {
        window.open(`/builder`, '_blank');

        // // Button to open the emulator
        // frm.add_custom_button(__('Preview'), () => {
        //     window.open('/emulator', '_blank');
        // });

    });
  },
});
