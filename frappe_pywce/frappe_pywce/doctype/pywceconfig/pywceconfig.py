# Copyright (c) 2025, donnc and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document

class PywceConfig(Document):
	def before_validate(self):
		if not self.site:
			self.site = frappe.local.site
