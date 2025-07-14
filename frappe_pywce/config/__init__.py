import frappe
from frappe.utils.safe_exec import safe_exec, is_safe_exec_enabled

from frappe_pywce.managers import FrappeRedisSessionManager, FrappeStorageManager

import pywce
from pywce import Engine, EngineConstants, HookService, client, EngineConfig, HookArg

def get_safe_globals():
    if is_safe_exec_enabled() is False:
        frappe.throw("Safe exec is not enabled. Please enable it in your configuration.")

    # Add custom library and function references to the globals
    ALLOWED_BUILTINS = {
        'print': print,
        'len': len,
        'str': str,
        'bool': bool,
        'None': None,
        'True': True,
        'False': False,
        'type': type,
        'getattr': getattr
    }

    pywce_globals = {name: getattr(pywce, name) for name in pywce.__all__}
    
    return {
        **pywce_globals,
        "hook_arg": getattr(frappe.local, "hook_arg", None),
        "__builtins__": ALLOWED_BUILTINS
    }


def on_hook_listener(arg: HookArg) -> None:
    """Save hook to local

    arg = getattr(frappe.local, "hook_arg", None)
    
    Args:
        arg (HookArg): Hook argument
    """
    frappe.local.hook_arg = arg
    print('[on_hook_listener] Updated hook arg in frappe > local')

def on_client_send_listener() -> None:
    """reset hook_arg to None"""
    frappe.local.hook_arg = None

def frappe_hook_processor(arg: HookArg) -> HookArg:
    """
    initiate(arg: HookArg)

    An external hook processor, runs frappe server scripts as hooks

    Args:
        arg (HookArg): pass hook argument from engine

    Returns:
        arg: updated hook arg
    """
    hook_name = arg.hook.replace(EngineConstants.EXT_HOOK_PROCESSOR_PLACEHOLDER, "").strip()
    hook_script = frappe.get_doc("Template Hook", hook_name)

    if hook_script.hook_type == 'Editor Script':
        exec_globals, _locals = safe_exec(hook_script.script, get_safe_globals(), {})

        if 'hook' in _locals:
            fx = _locals.get('hook')

            if fx is None:
                raise ValueError("Hook function is None") 
            
            return fx(arg) 
        
        raise ValueError("No hook function defined")
    
    return HookService.process_hook(hook_script.server_script_path, arg)
    

@frappe.whitelist()
def get_wa_config() -> client.WhatsApp:
    docSettings = frappe.get_single("PywceConfig")

    _wa_config = client.WhatsAppConfig(
        token=docSettings.get_password('access_token'),
        phone_number_id=docSettings.phone_id,
        hub_verification_token=docSettings.webhook_token,
        app_secret=docSettings.get_password('app_secret')
    )

    return client.WhatsApp(_wa_config, on_send_listener=on_client_send_listener)


def get_engine_config() -> Engine:
    docSettings = frappe.get_single("PywceConfig")

    _eng_config = EngineConfig(
        whatsapp=get_wa_config(),
        storage_manager=FrappeStorageManager(),
        start_template_stage=docSettings.initial_stage,
        session_manager=FrappeRedisSessionManager(),
        
        # optional fields, depends on the example project being run
        ext_hook_processor=frappe_hook_processor,
        on_hook_arg=on_hook_listener
    )

    return Engine(config=_eng_config)