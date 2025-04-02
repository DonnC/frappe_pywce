import frappe
from frappe.utils.safe_exec import safe_exec

from frappe_pywce.managers import FrappeRedisSessionManager, FrappeStorageManager

import pywce
from pywce import Engine, EngineConstants, client, EngineConfig, pywce_logger, HookArg

def _get_safe_globals():
    # Add custom library and function references to the globals
    ALLOWED_BUILTINS = {
        'print': print,
        'len': len,
        'dict': dict,
        'list': list,
        'str': str,
        'int': int,
        'float': float,
        'bool': bool,
        'None': None,
        'True': True,
        'False': False,
        'type': type,        # Explicitly allow type if needed
        'getattr': getattr,  # Explicitly allow getattr if needed
        'setattr': setattr,  # Explicitly allow setattr if needed
        'isinstance': isinstance,
        # --- DO NOT ADD 'open', 'eval', 'exec', '__import__', 'compile', etc. ---
        # --- Be extremely careful about adding anything else --- 
    }
    
    return {
        'pywce': pywce,
        'TemplateDynamicBody': pywce.TemplateDynamicBody,
        'get_engine_config': get_engine_config,
        'HookArg': HookArg,
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
    script_name = arg.hook.replace(EngineConstants.EXT_HOOK_PROCESSOR_PLACEHOLDER, "").strip()

    custom_safe_globals = _get_safe_globals()

    server_script = frappe.get_doc("Server Script", script_name)

    if not server_script.script:
        raise ValueError("Server script content is empty")

    local_scope = {}
    exec_globals, _locals = safe_exec(server_script.script, custom_safe_globals, local_scope)

    if 'hook' in _locals:
        fx = _locals.get('hook')

        if fx is None:
            raise ValueError("Hook function is None") 
        
        return fx(arg)
    
    raise ValueError("No hook function defined")

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