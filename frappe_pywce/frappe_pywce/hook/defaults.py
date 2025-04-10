"""
default hooks

1. Get default username
2. Login user
"""
import frappe
from pywce import HookArg, TemplateDynamicBody

import frappe.auth


def get_name(arg: HookArg) -> HookArg:
    _name = arg.user.name
    arg.session_manager.save(session_id=arg.user.wa_id, key="username", data=_name)
    arg.template_body = TemplateDynamicBody(render_template_payload={"name": _name})
    
    return arg

def login_usr(arg: HookArg) -> HookArg:
    # TODO: WIP
    
    return arg
    # try:
    #     user = frappe.auth.LoginManager().authenticate(user=email, pwd=password)
    #     arg.session.set("logged_in_user", user)
    #     arg.message = f"✅ Logged in as {user}"
    # except frappe.AuthenticationError as e:
        
    #     # TODO: throw HookException with the message
    #     e_msg = frappe.local.response['message']
    #     arg.message = f"❌ Login failed: {str(e)}"
    #     arg.route = "LOGIN-EMAIL"
    # return arg

def logout_usr(arg: HookArg) -> HookArg:
    user = frappe.auth.LoginManager().logout()
    return arg