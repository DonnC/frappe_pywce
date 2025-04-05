import frappe
from frappe.utils.safe_exec import safe_exec, is_safe_exec_enabled

from frappe_pywce.managers import FrappeRedisSessionManager, FrappeStorageManager

import pywce
from pywce import Engine, EngineConstants, HookService, client, EngineConfig, pywce_logger, HookArg


def get_safe_globals():
    if is_safe_exec_enabled() is False:
        raise ValueError("Safe exec is not enabled. Please enable it in your configuration.")

    # Add custom library and function references to the globals
    ALLOWED_BUILTINS = {
        'print': print,
        'len': len,
        'str': str,
        'bool': bool,
        'None': None,
        'True': True,
        'False': False,
        'type': type,        # Explicitly allow type if needed
        'getattr': getattr,  # Explicitly allow getattr if needed
        'setattr': setattr,  # Explicitly allow setattr if needed
    }

    pywce_globals = {name: getattr(pywce, name) for name in pywce.__all__}
    
    return {
        **pywce_globals,
        "__builtins__": ALLOWED_BUILTINS
    }


def log_incoming_hook_message(arg: HookArg) -> None:
    """
    initiate(arg: HookArg)

    A global pre-hook called everytime & before any other hooks are processed.

    Args:
        arg (HookArg): pass hook argument from engine

    Returns:
        None: global hooks have no need to return anything
    """
    print(f"{'*' * 10} New incoming request arg {'*' * 10}")
    print(arg)
    print(f"{'*' * 30}")


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
        app_secret=docSettings.get_password('app_secret'),
        enforce_security=False
    )

    return client.WhatsApp(_wa_config)


def get_engine_config() -> Engine:
    docSettings = frappe.get_single("PywceConfig")

    _eng_config = EngineConfig(
        whatsapp=get_wa_config(),
        storage_manager=FrappeStorageManager(),
        start_template_stage=docSettings.initial_stage,
        session_manager=FrappeRedisSessionManager(),
        logger=pywce_logger.DefaultPywceLogger(use_print=True),
        session_ttl_min=10,
        
        # optional fields, depends on the example project being run
        ext_hook_processor=frappe_hook_processor,
        global_pre_hooks=[log_incoming_hook_message]
    )

    return Engine(config=_eng_config)