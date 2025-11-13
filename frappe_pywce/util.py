import frappe
from pywce import HookUtil


def frappe_recursive_renderer(template_dict: dict, hook_path: str, hook_arg: object, ext_hook_processor: object) -> dict:
    """
    It does two things:
    1. Gets the business context from the hook.
    2. Recursively renders the template using frappe.render_template, which
       adds the global Frappe context automatically.
    """
    
    # 1. Get Business Context (from the template hook)
    business_context = {}
    if hook_path:
        try:
            response = HookUtil.process_hook(
                hook=hook_path,
                arg=hook_arg,
                external=ext_hook_processor
            )
            business_context = response.template_body.render_template_payload 
        except Exception as e:
            frappe.log_error(message=f"pywce template hook failed: {hook_path}", title="Frappe Recursive Renderer Hook Error")
            business_context = {"hook_error": str(e)}

    # 2. Define the recursive rendering function
    def render_recursive(value):
        if isinstance(value, str):
            # We pass the business_context. Frappe automatically
            # merges it with the global Frappe context.
            return frappe.render_template(value, business_context)
        
        elif isinstance(value, dict):
            return {key: render_recursive(val) for key, val in value.items()}
        
        elif isinstance(value, list):
            return [render_recursive(item) for item in value]
        
        return value

    # 3. Start the recursion on the whole template dictionary
    return render_recursive(template_dict)