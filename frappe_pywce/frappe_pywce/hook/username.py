from pywce import HookArg, TemplateDynamicBody

def get_name(arg: HookArg) -> HookArg:
    _name = f"GetNameWork({arg.user.name})"
    arg.session_manager.save(session_id=arg.user.wa_id, key="username", data=_name)
    arg.template_body = TemplateDynamicBody(render_template_payload={"name": _name})
    
    return arg