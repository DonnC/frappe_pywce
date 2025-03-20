import json
from typing import Dict
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
        pass

    def load_triggers(self) -> Dict:
        pass

    def exists(self, name) -> bool:
        val = frappe.db.exists(dt="Chatbot Template", dn=name, cache=True) is not None
        return val
    
    def triggers(self) -> Dict:
        triggers = frappe.get_all(doctype="Template Trigger", fields=['regex', 'template'], limit_page_length=100)
        result = {}

        for trigger in triggers:
            result[trigger.get('template')] = trigger.get('regex') if trigger.get('regex').startswith("re:") else f"re:{trigger.get('regex')}" 
        
        return result

    def get(self, name) -> Dict:
        if self.exists(name) is True:
            template = frappe.get_doc("Chatbot Template", name)
            tpl = template.as_dict()

            routes = {}

            for route in tpl.get("routes"):
                _input = route.get('user_input')
                if route.get('regex') == 1:
                    _input = f"re:{_input}"

                routes[_input] = route.get('template')

            template_message = json.loads(template.body)

            engine_template = {
                "type": template.template_type,
                "message": template_message.get("message") if template.template_type.lower() == 'text' else template_message,
                "routes": routes
            }

            # hooks
            if template.params:
                engine_template["params"] = json.loads(template.params)

            if template.prop:
                engine_template["prop"] = template.prop

            if template.template:
                engine_template["template"] = template.template

            if template.on_receive:
                engine_template["on-receive"] = template.on_receive

            if template.middleware:
                engine_template["middleware"] = template.middleware

            if template.router:
                engine_template["router"] = template.router

            if template.on_generate:
                engine_template["on-generate"] = template.on_generate

            if template.validator:
                engine_template["validator"] = template.validator

            if template.checkpoint:
                engine_template["checkpoint"] = template.checkpoint == 1

            if template.reply_message_id:
                engine_template["message-id"] = template.reply_message_id

            if template.ack:
                engine_template["ack"] = template.ack == 1

            if template.authenticated:
                engine_template["authenticated"] = template.authenticated == 1

            print('ENGINE TEMPLATE: ', engine_template)

            return engine_template


        raise ValueError("template not found")
