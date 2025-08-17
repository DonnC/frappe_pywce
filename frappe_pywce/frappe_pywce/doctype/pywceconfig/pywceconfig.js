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
      __("Import Templates"),
      function () {
        frappe.prompt(
          [
            {
              fieldname: "template_directory_path",
              fieldtype: "Data",
              label: __("Directory Path"),
              reqd: 1,
              description: __("E.g., /home/projects/chatbot/templates"),
            },
            {
              label: __("Update Existing?"),
              fieldname: "update_existing",
              fieldtype: "Check",
              default: 0,
            },
          ],
          function (values) {
            const directory_path = values.template_directory_path;
            const update_existing = values.update_existing;

            frappe.call({
              method: "frappe_pywce.templates_util.import_templates",
              args: {
                directory_path: directory_path,
                update_existing: update_existing == 1,
              },
              freeze: true,
              callback: function (r) {
                if (r.message && r.message.job_id) {
                  frappe.show_alert({
                    message: __("Job ID: {0}", [r.message.job_id]),
                    indicator: "blue",
                    title: __("Import Initiated"),
                  });
                } else if (r.message) {
                  frappe.show_alert({
                    message: __("Import process could not be started: {0}", [
                      r.message.message || r.message,
                    ]),
                    indicator: "red",
                  });
                }
              },
              error: function (err) {
                frappe.show_alert({
                  message: __(
                    "An error occurred while starting the import: {0}",
                    [err.message]
                  ),
                  indicator: "red",
                });
              },
            });
          },
          __("YAML|JSON Templates Importer"),
          __("Import Templates")
        );
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
