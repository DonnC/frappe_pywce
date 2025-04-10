// Copyright (c) 2025, donnc and contributors
// For license information, please see license.txt

frappe.ui.form.on("Template Hook", {
    setup: function (frm) {
		frm.trigger("setup_help");
	},
	refresh(frm) {
        frm.trigger("check_safe_exec");
	},

    check_safe_exec(frm) {
		frappe.xcall("frappe_pywce.frappe_pywce.doctype.template_hook.template_hook.enabled").then((enabled) => {
			if (enabled === false) {
				let docs_link =
					"https://frappeframework.com/docs/user/en/desk/scripting/server-script";
				let docs = `<a href=${docs_link}>${__("Official Documentation")}</a>`;

				frm.dashboard.clear_comment();
				let msg = __("Server Scripts feature is not available on this site.</br><b>Editor Script</b> hook type depends on Server scripts being enabled.") + " ";
				msg += __("</br>To enable server scripts, read the {0}.", [docs]);
				frm.dashboard.add_comment(msg, "yellow", true);
			}
		});
	},

	setup_help(frm) {
		frm.get_field("help_html").html(`
<p>Template hooks are a way to add custom logic to your templates. They allow you add custom logic to the template journey.</p>
<p>Any editor script hook type must have a function name as <b>hook</b> and will be called with only 1 parameter: <b>HookArg</b></p>

<a href="https://docs.page/donnc/wce" target="_blank">
    <u>View official documentation</u>
</a>

<hr>

<h4>Server Script</h4>
<p>Server side python functions with template hook business logic. The hook value must be a full dotted path to the server script</p>
</br>
Example: Suppose your custom app name is my_app with a structure as below:
</br>
<pre><code>
my_app/
└── my_app/
    └── hook/
        └── username.py
</code></pre>
</br>
With a hook (with business logic to get user default WhatsApp name on their account) as below:

<pre><code>
# username.py
import pywce

def get_default_name(arg: pywce.HookArg) -> pywce.HookArg:
    arg.session_manager.save(session_id=arg.user.wa_id, key="username", data=arg.user.name)
    arg.template_body = pywce.TemplateDynamicBody(render_template_payload={"name": arg.user.name})
    
    return arg
</code></pre>

Your hook will be like: <i>my_app.my_app.hook.username.hook</i>

<hr>

<h4>Editor Script</h4>
<p>These hooks behave much like frappe's default API Server Scripts</p>
<p>You define your template hook logic via UI (its limited in what it can do unlike the Server Script hook types)</p>

<pre><code>
def hook(arg: HookArg) -> HookArg:
    arg.session_manager.save(session_id=arg.user.wa_id, key="username", data=arg.user.name)
    arg.template_body = TemplateDynamicBody(render_template_payload={"name": arg.user.name})
    
    return arg
</code></pre>
`);
	},
});
