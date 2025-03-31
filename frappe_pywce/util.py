import json
from typing import Optional, Union
import frappe
from pywce import EngineConstants, HookArg, TemplateTypeConstants

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


def log_incoming_hook_message(arg: HookArg) -> None:
    """
    initiate(arg: HookArg)

    A global pre-hook called everytime & before any other hooks are processed.

    Args:
        arg (HookArg): pass hook argument from engine

    Returns:
        None: global hooks have no need to return anything
    """
    frappe.log(f"{'*' * 10} New incoming request arg {'*' * 10}")
    frappe.log(arg)
    frappe.log(f"{'*' * 30}")


def frappe_hook_processor(arg: HookArg) -> HookArg:
    """
    initiate(arg: HookArg)

    An external hook processor, runs frappe server scripts as hooks

    Args:
        arg (HookArg): pass hook argument from engine

    Returns:
        arg: updated hook arg
    """

    script_name = arg.hook.replace(EngineConstants.EXT_HOOK_PROCESSOR_PLACEHOLDER, "").strip()

    frappe.log(f"Running server script: {script_name}")

    # response is a dict which can be serialized to HookArg
    response = frappe.call(script_name, arg.model_dump())

    frappe.log(f"Server script response: {response}")

    return arg

def frappe_to_yaml_dict(frappe_dict: dict) -> dict:
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
        _input = route.get('user_input') if route.get('regex', 0) == 0 else f"{EngineConstants.REGEX_PLACEHOLDER}{route.get('user_input')}"
        route_dict[_input] = route.get('template')

    yaml_dict['routes'] = route_dict
    return yaml_dict


@redis_cache(ttl=180)
def get_cachable_template(name) -> dict:
    db_template = frappe.get_doc("Chatbot Template", name)
    db_template_dict = frappe_to_yaml_dict(db_template.as_dict())
    return db_template_dict