from frappe_pywce.util import get_cachable_template
from pywce import EngineConstants, ISessionManager, storage, template
import frappe
from typing import Dict, Any, List, Type, Union, TypeVar

T = TypeVar("T")

class FrappeStorageManager(storage.IStorageManager):
    def load_templates(self):
        pass

    def load_triggers(self):
        pass

    def exists(self, name) -> bool:
        val = frappe.db.exists(dt="Chatbot Template", dn=name, cache=True) is not None
        return val
    
    def triggers(self) -> List[template.EngineRoute]:
        triggers = frappe.get_all(doctype="Template Trigger", fields=['regex', 'template'], limit_page_length=100)
        routes = []

        for trigger in triggers:
            routes.append(template.EngineRoute(
                user_input=trigger.get('regex') if trigger.get('regex').startswith(EngineConstants.REGEX_PLACEHOLDER) else f"{EngineConstants.REGEX_PLACEHOLDER}{trigger.get('regex')}",
                is_regex=trigger.get('regex').startswith(EngineConstants.REGEX_PLACEHOLDER),
                next_stage=trigger.get('template')
            ))
        
        return routes

    def get(self, name) -> template.EngineTemplate:
        if self.exists(name) is True:
            return template.Template.as_model(get_cachable_template(name))


        raise ValueError(f"Template: {name}, not found!")


class FrappeRedisSessionManager(ISessionManager):
    """
    Redis-based session manager for PyWCE in Frappe.
    
    Uses Frappe's Redis cache to store user session data.

    user data has default expiry set to 10 mins
    global data has default expiry set to 30 mins
    """

    _global_key_ = "pywce_global"

    def __init__(self, val_exp=600, global_exp=1800):
        """Initialize session manager with default expiry time."""
        self.expiry = val_exp
        self.global_expiry = global_exp

    def _get_prefixed_key(self, session_id, key):
        """Helper to create prefixed cache keys."""
        return f"pywce:{session_id}:{key}"

    @staticmethod
    def set_user_auth_hook():
        """
            Helper method to flag user as authenticated
        """
        pass

    @property
    def prop_key(self) -> str:
        return "pywce_prop_key"

    def session(self, session_id: str) -> "FrappeRedisSessionManager":
        """Initialize session in Redis if it doesn't exist."""
        return self

    def save(self, session_id: str, key: str, data: Any) -> None:
        """Save a key-value pair into the session."""
        frappe.cache().set_value(
            key=self._get_prefixed_key(session_id, key), 
            val=data,
            expires_in_sec=self.expiry
        )

    def save_global(self, key: str, data: Any) -> None:
        """Save global key-value pair."""
        frappe.cache().set_value(
            key=self._get_prefixed_key(self._global_key_, key), 
            val=data,
            expires_in_sec=self.global_expiry
        )

    def get(self, session_id: str, key: str, t: Type[T] = None) -> Union[Any, T]:
        """Retrieve a specific key from session."""
        session_data = frappe.cache().get_value(
            key=self._get_prefixed_key(session_id, key),
            expires=True
        )

        if session_data is not None:
            return t(session_data) if t else session_data
        
        return None

    def get_global(self, key: str, t: Type[T] = None) -> Union[Any, T]:
        """Retrieve global data."""
        global_data = frappe.cache().get_value(
            key=self._get_prefixed_key(self._global_key_, key),
            expires=True
        )

        if global_data is not None:
            return t(global_data) if t else global_data
        
        return None

    def fetch_all(self, session_id: str, is_global: bool = False) -> Dict[str, Any]:
        """Retrieve all session data."""
        raise NotImplementedError

    def evict(self, session_id: str, key: str) -> None:
        """Remove a key from session."""
        frappe.cache().delete_value(
            keys=[self._get_prefixed_key(session_id, key)],
            make_keys=True
        )

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
        self.evict(self._global_key_, key)

    def clear(self, session_id: str) -> None:
        """Clear the entire session."""
        frappe.cache().delete_keys(session_id)

    def clear_global(self) -> None:
        """Clear all global data."""
        frappe.cache().delete_keys(self._global_key_)

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
        
        del current_props[prop_key]
        self.save(session_id, self.prop_key, current_props)
        return True

    def get_from_props(self, session_id: str, prop_key: str, t: Type[T] = None) -> Union[Any, T]:
        """Retrieve a property from user props."""
        props = self.get_user_props(session_id)
        return t(props.get(prop_key)) if t and prop_key in props else props.get(prop_key)

    def save_prop(self, session_id: str, prop_key: str, data: Any) -> None:
        """Save a property in user props."""
        current_props = self.get_user_props(session_id)
        current_props[prop_key] = data
        self.save(session_id, self.prop_key, current_props)
