import json
from frappe_pywce.util import get_cachable_template
from pywce import EngineConstants, ISessionManager, storage, template
import frappe
from typing import Dict, Any, List, Type, TypeVar

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
    _global_expiry = 86400
    _global_key_ = "fpw:global"

    def __init__(self, ttl=1800):
        """Initialize session manager with default expiry time.
        TODO: take the configured ttl in app settings
        """
        self.ttl = ttl

    def _get_prefixed_key(self, session_id, key=None):
        """Helper to create prefixed cache keys."""
        k = f"fpw:{session_id}"

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
        return "fpw:props"

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
