import frappe
from pywce import HookArg, pywce_logger

logger = pywce_logger()

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


def frappe_hook_processor(arg: HookArg) -> HookArg:
    """
    initiate(arg: HookArg)

    An external hook processor, runs frappe server scripts as hooks

    Args:
        arg (HookArg): pass hook argument from engine

    Returns:
        arg: updated hook arg
    """

    script_name = arg.hook.replace("ext:", "").strip()

    logger.info(f"Running server script: {script_name}")

    response = frappe.call(
        method="frappe.client.run_server_script",
        args={
            "script_name": script_name,
            "args": arg.model_dump()
        }
    )

    logger.info(f"Server script response: {response}")

    return arg