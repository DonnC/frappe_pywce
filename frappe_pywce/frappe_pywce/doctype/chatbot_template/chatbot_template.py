# Copyright (c) 2025, donnc and contributors
# For license information, please see license.txt

import re
import frappe
from frappe import _
from frappe.model.document import Document


class ChatbotTemplate(Document):
    def validate(self):
        if self.prop:
            invalid_chars_regex = r'[ -]'

            if re.search(invalid_chars_regex, self.prop):
                frappe.throw(
                    _("Field 'prop' cannot contain spaces or hyphens. Please use underscores (_) instead."),
                    title=_("Invalid Input")
                )

        if not self.body:
            frappe.throw(
                    _("Template message body is required"),
                    title=_("Template message")
                )
