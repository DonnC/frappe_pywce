// Copyright (c) 2025, donnc and contributors
// For license information, please see license.txt

frappe.ui.form.on("PywceConfig", {
  refresh: function (frm) {
    frm.add_custom_button(
      __("Get Chatbot Webhook"),
      function () {
        frm.call({
          method: "frappe_pywce.webhook.get_webhook",
          callback: function (r) {
            frappe.msgprint(r.message);
          },
        });
      },
      "Options"
    );

    frm.add_custom_button(
      __("Clear Chatbot Cache"),
      function () {
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
      },
      "Options"
    );
  },
});
