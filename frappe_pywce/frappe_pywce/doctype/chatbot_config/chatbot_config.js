// Copyright (c) 2025, donnc and contributors
// For license information, please see license.txt

frappe.ui.form.on("ChatBot Config", {
  setup: function (frm) {
    frm.trigger("setup_help");
  },
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

  setup_help(frm) {
    frm.get_field("help").html(`
<p>A big thank you for checking out my app! </p>
<p>Any editor script hook type must have a function name as <b>hook</b> and will be called with only 1 parameter: <b>HookArg</b></p>

<a href="https://docs.page/donnc/wce" target="_blank">
    <u>View official documentation [WIP]</u>
</a>

<hr>

<h4>Hooks</h4>
<p>You are already familiar with this. This uses the same approach as your custom server side business logic. The hook value must be a full dotted path to the server script</p>
<p>Hooks enables you to "hook" / "attach" business logic to your template. For example, if you want to send an email, create a doctype, fetch records. You create your usual server script and reference that hook on the template</p>

Always remember, pywce supports different hook types as defined by their name, hook appropriately.

</br>
Example: Suppose your custom app name is my_app with a structure as below:
</br>
<pre><code>
my_app/
└── my_app/
    └── hook/
        └── tasks.py
</code></pre>
</br>
With a hook as below:

<pre><code>
# tasks.py
import frappe
from pywce import HookArg

def create_a_task(arg: HookArg) -> HookArg:
    # take task name from provided user input
    task_name = arg.user_input

    doc = frappe.get_doc({
            "doctype": "Task",
            "task_name": task_name
          })
    doc.insert()
    
    return arg
</code></pre>

Your hook will be like: <i>my_app.my_app.hook.tasks.create_a_task</i>

<hr>

<h4>Authentication</h4>
<p>The app comes with defaukt hook and function to handle authentication and resuming user session on each webhook</p>

<p> You can choose to use login via a link, where user will be directed to your frappe/erpnext instance's login page and be redirected back to WhatsApp </p>
<p> or if using WhatsApp Flows, can use a helper method to perform log in</p>

frappe_pywce.frappe_pywce.hook.auth.generate_login_link
`);
  },
});
