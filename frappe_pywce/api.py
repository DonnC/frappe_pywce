import frappe

from frappe_pywce.session import FrappeRedisSessionManager
from frappe_pywce.util import FrappeStorageManager, log_incoming_hook_message
from pywce import Engine, client, EngineConfig


def get_wa_config() -> client.WhatsApp:
    docSettings = frappe.get_single("PywceConfig")

    _wa_config = client.WhatsAppConfig(
        token=docSettings.get_password('access_token'),
        phone_number_id=docSettings.phone_id,
        hub_verification_token=docSettings.webhook_token,
        app_secret=docSettings.get_password('app_secret')
    )

    return client.WhatsApp(_wa_config)


def get_engine_config() -> Engine:
    docSettings = frappe.get_single("PywceConfig")

    _eng_config = EngineConfig(
        whatsapp=get_wa_config(),
        storage_manager=FrappeStorageManager(),
        start_template_stage=docSettings.initial_stage,
        session_manager=FrappeRedisSessionManager(),
        session_ttl_min=10,

        # optional fields, depends on the example project being run
        global_pre_hooks=[log_incoming_hook_message]
    )

    return Engine(config=_eng_config)