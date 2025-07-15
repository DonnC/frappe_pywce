frappe.listview_settings['Chatbot Template'] = {
    refresh: function(listview) {
        listview.page.add_inner_button(__('Delete'), function() {
            const selected_templates = listview.get_checked_items().map(item => item.name);

            console.log("Selected templates for deletion:", selected_templates);

            if (selected_templates.length === 0) {
                frappe.msgprint(__('Please select at least one template to delete.'));
                return;
            }

            frappe.call({
                method: "frappe_pywce.templates_util.bulk_delete",
                args: {
                    templates: selected_templates
                },
                freeze: true,
                callback: function(r) {
                    if (r.message) {
                        frappe.msgprint(r.message);
                        listview.refresh();
                    }
                }
            });
        });
    }
};