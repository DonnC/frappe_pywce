import frappe
from pywce import storage, HookArg

logger = frappe.logger(module="frappe_pywce", file_count=5)


def log_incoming_hook_message(arg: HookArg) -> None:
    """
    initiate(arg: HookArg)

    A global pre-hook called everytime & before any other hooks are processed.

    Args:
        arg (HookArg): pass hook argument from engine

    Returns:
        None: global hooks have no need to return anything
    """
    logger.debug(f"{'*' * 10} New incoming request arg {'*' * 10}")
    logger.warning(arg)
    logger.debug(f"{'*' * 30}")


class FrappeStorageManager(storage.IStorageManager):
    def load_templates(self):
        raise NotImplementedError

    def load_triggers(self):
        raise NotImplementedError

    def exists(self, name):
        raise NotImplementedError

    def triggers(self):
        raise NotImplementedError

    def get(self, name):
        raise NotImplementedError
