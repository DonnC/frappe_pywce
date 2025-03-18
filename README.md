## Frappe Pywce

A WhatsApp chatbot engine in frappe powered  by pywce

#### License

mit



import frappe
import json
from typing import Dict, Any, List, Type, Union, TypeVar

T = TypeVar("T")

class RedisSessionManager:
    """
    Redis-based session manager for PyWCE in Frappe.
    
    Uses Frappe's Redis cache to store user session data.
    """

    def __init__(self, expiry_seconds=1800):
        """Initialize session manager with default expiry time."""
        self.expiry = expiry_seconds  # Default: 30 minutes

    def _get_session_key(self, session_id: str) -> str:
        """Generate Redis key for a user's session data."""
        return f"chatbot_session:{session_id}"

    def session(self, session_id: str) -> "RedisSessionManager":
        """Initialize session in Redis if it doesn't exist."""
        session_key = self._get_session_key(session_id)
        if frappe.cache().get_value(session_key) is None:
            frappe.cache().set_value(session_key, json.dumps({}), expires_in_sec=self.expiry)
        return self

    def save(self, session_id: str, key: str, data: Any) -> None:
        """Save a key-value pair into the session."""
        session_key = self._get_session_key(session_id)
        session_data = self.get(session_id)  # Retrieve existing session
        session_data[key] = data  # Update
        frappe.cache().set_value(session_key, json.dumps(session_data), expires_in_sec=self.expiry)

    def get(self, session_id: str, key: str, t: Type[T] = None) -> Union[Any, T]:
        """Retrieve a specific key from session."""
        session_data = frappe.cache().get_value(self._get_session_key(session_id))
        if session_data:
            session_data = json.loads(session_data)
            value = session_data.get(key)
            return t(value) if t and value is not None else value
        return None

    def get_global(self, key: str, t: Type[T] = None) -> Union[Any, T]:
        """Retrieve global data."""
        global_data = frappe.cache().get_value(f"chatbot_global:{key}")
        return t(global_data) if t and global_data is not None else global_data

    def fetch_all(self, session_id: str, is_global: bool = False) -> Dict[str, Any]:
        """Retrieve all session data."""
        key = f"chatbot_global:{session_id}" if is_global else self._get_session_key(session_id)
        session_data = frappe.cache().get_value(key)
        return json.loads(session_data) if session_data else {}

    def evict(self, session_id: str, key: str) -> None:
        """Remove a key from session."""
        session_data = self.get(session_id)
        if key in session_data:
            del session_data[key]
            frappe.cache().set_value(self._get_session_key(session_id), json.dumps(session_data), expires_in_sec=self.expiry)

    def save_all(self, session_id: str, data: Dict[str, Any]) -> None:
        """Save multiple key-value pairs at once."""
        session_data = self.get(session_id)
        session_data.update(data)
        frappe.cache().set_value(self._get_session_key(session_id), json.dumps(session_data), expires_in_sec=self.expiry)

    def evict_all(self, session_id: str, keys: List[str]) -> None:
        """Remove multiple keys from session."""
        session_data = self.get(session_id)
        for key in keys:
            session_data.pop(key, None)
        frappe.cache().set_value(self._get_session_key(session_id), json.dumps(session_data), expires_in_sec=self.expiry)

    def evict_global(self, key: str) -> None:
        """Remove a key from global storage."""
        frappe.cache().delete_value(f"chatbot_global:{key}")

    def clear(self, session_id: str) -> None:
        """Clear the entire session."""
        frappe.cache().delete_value(self._get_session_key(session_id))

    def clear_global(self) -> None:
        """Clear all global data."""
        frappe.cache().delete_value("chatbot_global")

    def key_in_session(self, session_id: str, key: str, check_global: bool = True) -> bool:
        """Check if a key exists in session or global storage."""
        session_data = self.get(session_id)
        if key in session_data:
            return True
        if check_global:
            return frappe.cache().get_value(f"chatbot_global:{key}") is not None
        return False

    def get_user_props(self, session_id: str) -> Dict[str, Any]:
        """Retrieve user properties."""
        return self.get(session_id, "pywce_prop_key") or {}

    def evict_prop(self, session_id: str, prop_key: str) -> bool:
        """Remove a property from user props."""
        current_props = self.get_user_props(session_id)
        if prop_key not in current_props:
            return False
        del current_props[prop_key]
        self.save(session_id, "pywce_prop_key", current_props)
        return True

    def get_from_props(self, session_id: str, prop_key: str, t: Type[T] = None) -> Union[Any, T]:
        """Retrieve a property from user props."""
        props = self.get_user_props(session_id)
        return t(props.get(prop_key)) if t and prop_key in props else props.get(prop_key)

    def save_global(self, key: str, data: Any) -> None:
        """Save global key-value pair."""
        frappe.cache().set_value(f"chatbot_global:{key}", data)

    def save_prop(self, session_id: str, prop_key: str, data: Any) -> None:
        """Save a property in user props."""
        current_props = self.get_user_props(session_id)
        current_props[prop_key] = data
        self.save(session_id, "pywce_prop_key", current_props)
