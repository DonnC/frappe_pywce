import frappe
import logging

def setup_pywce_logging_for_frappe():
    """
    Integrates pywce's logging into Frappe's logging system.
    This function should be called once when your Frappe app starts up.
    """
    pywce_root_logger = logging.getLogger('pywce')
    frappe_logger = frappe.logger()
    pywce_root_logger.setLevel(logging.DEBUG)

    has_console_handler = any(isinstance(h, logging.StreamHandler) and h.stream.name == '<stderr>' for h in pywce_root_logger.handlers)
    if not has_console_handler:
        frappe_console_handler = logging.StreamHandler()
        formatter = logging.Formatter('%(asctime)s %(levelname)s %(name)s: %(message)s')
        frappe_console_handler.setFormatter(formatter)
        pywce_root_logger.addHandler(frappe_console_handler)

        for handler in frappe_logger.handlers:
            pywce_root_logger.addHandler(handler)

    frappe_logger.addHandler(pywce_root_logger.handlers[0])
    frappe_logger.debug("Pywce logging has been integrated with Frappe's logging system.")