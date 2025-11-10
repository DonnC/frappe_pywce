import json
from typing import Optional, Union

import frappe
from pywce import EngineConstants, HookUtil, TemplateTypeConstants

from frappe.utils.caching import redis_cache

def _get_hook(hook:Optional[str]=None):
    if hook is None:
        return None
    
    return f"{EngineConstants.EXT_HOOK_PROCESSOR_PLACEHOLDER}{hook}"

def _get_message(kind: str, msg: dict) -> Union[str, dict]:
    raw_text_kinds = [
        TemplateTypeConstants.TEXT,
        TemplateTypeConstants.DYNAMIC,
        TemplateTypeConstants.REQUEST_LOCATION
    ]

    if kind in raw_text_kinds:
        return msg.get('message')

    return msg


def doctype_as_template(frappe_dict: dict) -> dict:
    """
    Converts a Frappe doctype dictionary to a YAML-like dictionary representation of pywce template.

    Args:
        frappe_dict (dict): The Frappe doctype dictionary.

    Returns:
        dict: The YAML-like dictionary.
    """

    yaml_dict = {
            'kind': frappe_dict.get('template_type'),

            # attr
            "ack": frappe_dict.get('ack', 0) == 1,
            "authenticated": frappe_dict.get('authenticated', 0) == 1,
            "checkpoint": frappe_dict.get('checkpoint', 0) == 1,
            "prop": frappe_dict.get('prop'),
            "session": frappe_dict.get('by_pass_session', 0) == 1,
            "typing": frappe_dict.get('show_typing_indicator', 0) == 1,
            "transient": False,
            "message-id": frappe_dict.get('reply_message_id'),

            # hooks
            "template": _get_hook(frappe_dict.get('template')),
            "on-receive": _get_hook(frappe_dict.get('on_receive')),
            "on-generate": _get_hook(frappe_dict.get('on_generate')),
            "router": _get_hook(frappe_dict.get('router')),
            "middleware": _get_hook(frappe_dict.get('middleware')),

            # message
            "message": _get_message(frappe_dict.get('template_type'), json.loads(frappe_dict.get('body'))),
    
            "params": None if frappe_dict.get('params') is None else json.loads(frappe_dict.get('params'))
    }

    route_dict = {}
    for route in frappe_dict.get('routes', []):
        # TODO: handle is regex
        _input = route.get('user_input') if route.get('regex', 0) == 0 else f"{EngineConstants.REGEX_PLACEHOLDER}{route.get('user_input')}"
        route_dict[_input] = route.get('template')

    yaml_dict['routes'] = route_dict
    return yaml_dict


# @redis_cache(ttl=180)
def get_cachable_template(name) -> dict:
    db_template = frappe.get_doc("Chatbot Template", name)
    db_template_dict = doctype_as_template(db_template.as_dict())
    return db_template_dict

def frappe_recursive_renderer(template_dict: dict, hook_path: str, hook_arg: object, ext_hook_processor: object) -> dict:
    """
    It does two things:
    1. Gets the business context from the hook.
    2. Recursively renders the template using frappe.render_template, which
       adds the global Frappe context automatically.
    """
    
    # 1. Get Business Context (from the template hook)
    business_context = {}
    if hook_path:
        try:
            response = HookUtil.process_hook(
                hook=hook_path,
                arg=hook_arg,
                external=ext_hook_processor
            )
            business_context = response.template_body.render_template_payload 
        except Exception as e:
            frappe.log_error(message=f"pywce template hook failed: {hook_path}", title="Frappe Recursive Renderer Hook Error")
            business_context = {"hook_error": str(e)}

    # 2. Define the recursive rendering function
    def render_recursive(value):
        if isinstance(value, str):
            # We pass the business_context. Frappe automatically
            # merges it with the global Frappe context.
            return frappe.render_template(value, business_context)
        
        elif isinstance(value, dict):
            return {key: render_recursive(val) for key, val in value.items()}
        
        elif isinstance(value, list):
            return [render_recursive(item) for item in value]
        
        return value

    # 3. Start the recursion on the whole template dictionary
    return render_recursive(template_dict)