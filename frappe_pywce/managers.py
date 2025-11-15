import json
from typing import Dict, Any, List, Optional, Type, TypeVar

import frappe

from pywce import ISessionManager, VisualTranslator, storage, template

from frappe_pywce.pywce_logger import app_logger as logger

T = TypeVar("T")

CACHE_KEY_PREFIX = "fpw:"

def create_cache_key(k:str):
    return f'{CACHE_KEY_PREFIX}{k}'

class FrappeStorageManager(storage.IStorageManager):
    """
    Implements the IStorageManager interface for a live Frappe backend.

    This class is responsible for:
    1. Fetching the "active" chatbot flow.
    2. Caching the *translated* pywce-compatible dictionary.
    3. Invalidating the cache when the bot is saved in Frappe.
    """
    _TEMPLATES: Dict = {}
    _TRIGGERS: List[template.EngineRoute] = {}

    START_MENU: Optional[str] = None
    REPORT_MENU: Optional[str] = None
    
    def __init__(self, flow_json):
        self.flow_json = flow_json
        self._ensure_templates_loaded()
    
    # might add caching
    def _load_templates_from_db(self):
        # TODO: May load direct from DocType field instead of re-fetching
        try:
            if not self.flow_json:
                raise Exception(f"No flow json found or is empty.")
            
            ui_translator = VisualTranslator()
            self._TEMPLATES, self._TRIGGERS = ui_translator.translate(self.flow_json)
            self.START_MENU = ui_translator.START_MENU
            self.REPORT_MENU = ui_translator.REPORT_MENU

        except Exception as e:
            frappe.log_error(title=f"FrappeStorageManager Load Error")
            self._TEMPLATES = {}

    def _ensure_templates_loaded(self):
        """
        Ensures self._TEMPLATES is populated,
        respecting the lazy-load approach.
        """
        if not self._TEMPLATES:
            self._load_templates_from_db()

    def load_templates(self) -> None:
        self._load_templates_from_db()

    def load_triggers(self) -> None:
        pass

    def exists(self, name: str) -> bool:
        self._ensure_templates_loaded()
        return name in self._TEMPLATES

    def get(self, name: str) -> template.EngineTemplate:    
        try:
            self._ensure_templates_loaded()
            template_data = self._TEMPLATES.get(name)
            return template.Template.as_model(template_data)
        except Exception:
            frappe.log_error(title="Get Template Error")
            logger.critical("Error fetching template: %s", name, exc_info=True)
            return None

    def triggers(self) -> List[template.EngineRoute]:
        return self._TRIGGERS
    
    def __repr__(self):
        return f"FrappeStorageManager(start_menu={self.START_MENU}, report_menu={self.REPORT_MENU}, \
            templates_count={len(self._TEMPLATES.keys())}, triggers_count={len(self._TRIGGERS)})"


class FrappeRedisSessionManager(ISessionManager):
    """
    Redis-based session manager for PyWCE in Frappe.
    
    Uses Frappe's Redis cache to store user session data.

    user data has default expiry set to 10 mins
    global data has default expiry set to 30 mins
    """
    _global_expiry = 86400
    _global_key_ = create_cache_key("global")

    def __init__(self, ttl=1800):
        """Initialize session manager with default expiry time.
        TODO: take the configured ttl in app settings
        """
        self.ttl = ttl

    def _get_prefixed_key(self, session_id, key=None):
        """Helper to create prefixed cache keys."""
        k = create_cache_key(session_id)

        if key is None:
            return k
        
        return f"{k}:{key}"
    
    def _set_data(self, session_id:str=None, session_data:dict=None, is_global=False):
        """
            set session data under 1 key for user
        """
        if session_data is None: return
        
        if is_global:
            frappe.cache.set_value(
                key=self._get_prefixed_key(self._global_key_), 
                val=json.dumps(session_data), 
                expires_in_sec=self._global_expiry
            )
            
        else:
            frappe.cache.set_value(
                key=self._get_prefixed_key(session_id), 
                val=json.dumps(session_data), 
                expires_in_sec=self.ttl
        )

    def _get_data(self, session_id:str=None, is_global=False) -> dict:
        raw = frappe.cache.get_value(
            key=self._get_prefixed_key(self._global_expiry), 
            expires=True
        ) if is_global else frappe.cache.get_value(
            key=self._get_prefixed_key(session_id), 
            expires=True
        )

        if raw is None:
            return {}
        
        return json.loads(raw)

    @property
    def prop_key(self) -> str:
        return create_cache_key("props")

    def session(self, session_id: str) -> "FrappeRedisSessionManager":
        """Initialize session in Redis if it doesn't exist."""
        return self

    def save(self, session_id: str, key: str, data: Any) -> None:
        """Save a key-value pair into the session."""
        d = self._get_data(session_id=session_id)
        d[key] = data
        self._set_data(session_id=session_id, session_data=d)

    def save_global(self, key: str, data: Any) -> None:
        """Save global key-value pair."""
        g = self._get_data(is_global=True)
        g[key] = data
        self._set_data(session_data=g, is_global=True)

    def get(self, session_id: str, key: str, t: Type[T] = None):
        """Retrieve a specific key from session."""
        d = self._get_data(session_id=session_id)
        return d.get(key)

    def get_global(self, key: str, t: Type[T] = None):
        """Retrieve global data."""
        g = self._get_data(is_global=True)
        return g.get(key)

    def fetch_all(self, session_id: str, is_global: bool = False) -> Dict[str, Any]:
        """Retrieve all session data."""
        return self._get_data(session_id=session_id, is_global=is_global)

    def evict(self, session_id: str, key: str) -> None:
        """Remove a key from session."""
        d = self._get_data(session_id=session_id)
        d.pop(key, -1)
        self._set_data(session_id= session_id, session_data=d)

    def save_all(self, session_id: str, data: Dict[str, Any]) -> None:
        """Save multiple key-value pairs at once."""
        for k, d in data.items():
            self.save(session_id, k, d)

    def evict_all(self, session_id: str, keys: List[str]) -> None:
        """Remove multiple keys from session."""
        for key in keys:
            self.evict(session_id, key)

    def evict_global(self, key: str) -> None:
        """Remove a key from global storage."""
        g = self._get_data(is_global=True)
        g.pop(key, -1)
        self._set_data(session_data=g, is_global=True)

    def clear(self, session_id: str, retain_keys: List[str] = None) -> None:
        """Clear the entire session.
        """
        if retain_keys is None or retain_keys == []:
            frappe.cache().delete_keys(self._get_prefixed_key(session_id))
            return
        
        for retain_key in retain_keys:
            data = self.fetch_all(session_id)
            for k, v in data.items():
                if retain_key in k:
                    continue

                self.evict(session_id, k)

    def clear_global(self) -> None:
        """Clear all global data."""
        frappe.cache().delete_keys(self._get_prefixed_key(self._global_key_))

    def key_in_session(self, session_id: str, key: str, check_global: bool = True) -> bool:
        """Check if a key exists in session or global storage."""
        if check_global is True:
            return self.get_global(key) is not None
        
        return self.get(session_id, key) is not None

    def get_user_props(self, session_id: str) -> Dict[str, Any]:
        """Retrieve user properties."""
        return self.get(session_id, self.prop_key) or {}

    def evict_prop(self, session_id: str, prop_key: str) -> bool:
        """Remove a property from user props."""
        current_props = self.get_user_props(session_id)
        if prop_key not in current_props:
            return False
        
        current_props.pop(prop_key, -1)
        self.save(session_id, self.prop_key, current_props)
        return True

    def get_from_props(self, session_id: str, prop_key: str, t: Type[T] = None):
        """Retrieve a property from user props."""
        props = self.get_user_props(session_id)
        return props.get(prop_key)

    def save_prop(self, session_id: str, prop_key: str, data: Any) -> None:
        """Save a property in user props."""
        current_props = self.get_user_props(session_id)
        current_props[prop_key] = data
        self.save(session_id, self.prop_key, current_props)
