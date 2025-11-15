import frappe

from frappe_pywce.managers import FrappeRedisSessionManager, FrappeStorageManager
from frappe_pywce.util import bot_settings, frappe_recursive_renderer
from frappe_pywce.pywce_logger import app_logger

from pywce import Engine, client, EngineConfig, HookArg


LOCAL_EMULATOR_URL = "http://localhost:3001/send-to-emulator"

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

def get_wa_config(settings) -> client.WhatsApp:
    _wa_config = client.WhatsAppConfig(
        token=settings.access_token,
        phone_number_id=settings.phone_id,
        hub_verification_token=settings.webhook_token,
        app_secret=settings.get_password('app_secret', raise_exception=False),
        use_emulator=settings.env == "local",
        emulator_url=LOCAL_EMULATOR_URL
    )

    return client.WhatsApp(_wa_config, on_send_listener=on_client_send_listener)


def get_engine_config() -> Engine:

    try:
        settings = bot_settings()
        storage_manager = FrappeStorageManager(settings.flow_json)
        wa = get_wa_config(settings)

        _eng_config = EngineConfig(
            whatsapp=wa,
            storage_manager=storage_manager,
            start_template_stage=storage_manager.START_MENU,
            report_template_stage=storage_manager.REPORT_MENU,
            session_manager=FrappeRedisSessionManager(),
            external_renderer=frappe_recursive_renderer,
            on_hook_arg=on_hook_listener
        )

        return Engine(config=_eng_config)

    except Exception as e:
        app_logger.error("Failed to load engine config", exc_info=True)
        frappe.throw("Failed to load engine config", exc=e)