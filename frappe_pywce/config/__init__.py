import frappe
import frappe.utils.logger

from frappe_pywce.managers import FrappeRedisSessionManager, FrappeStorageManager
from frappe_pywce.util import frappe_recursive_renderer

from pywce import Engine, client, EngineConfig, HookArg


frappe.utils.logger.set_log_level("DEBUG")
logger = frappe.logger("frappe_pywce", allow_site=True)

def bot_settings():
    """Fetch Bot Settings from Frappe Doctype 'ChatBot Config'"""
    try:
        settings = frappe.get_single("ChatBot Config")
        return settings
    except Exception as e:
        logger.error("Failed to fetch Bot Settings: %s", str(e))
        frappe.throw(frappe._("Failed to fetch Bot Settings: {0}").format(str(e)))

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


def get_wa_config() -> client.WhatsApp:
    settings = bot_settings()

    _wa_config = client.WhatsAppConfig(
        token=settings.access_token,
        phone_number_id=settings.phone_id,
        hub_verification_token=settings.webhook_token,
        app_secret=settings.get_password('app_secret'),

        use_emulator=settings.env == "local",
        emulator_url="http://localhost:3001/send-to-emulator"
    )

    return client.WhatsApp(_wa_config, on_send_listener=on_client_send_listener)


def get_engine_config() -> Engine:
    storage_manager = FrappeStorageManager()

    try:
        _eng_config = EngineConfig(
            whatsapp=get_wa_config(),
            storage_manager=storage_manager,
            start_template_stage=storage_manager.START_MENU,
            report_template_stage=storage_manager.REPORT_MENU,
            session_manager=FrappeRedisSessionManager(),
            external_renderer=frappe_recursive_renderer,
            
            on_hook_arg=on_hook_listener
        )

        return Engine(config=_eng_config)

    except Exception as e:
        logger.error("Failed to load engine config: %s", str(e))
        frappe.throw(frappe._("Failed to load engine config: {0}").format(str(e)))