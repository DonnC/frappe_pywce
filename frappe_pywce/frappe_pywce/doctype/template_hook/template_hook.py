# Copyright (c) 2025, donnc and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document
import frappe.utils
import frappe.utils.safe_exec


class TemplateHook(Document):
	pass


@frappe.whitelist()
def enabled():
	return frappe.utils.safe_exec.is_safe_exec_enabled()