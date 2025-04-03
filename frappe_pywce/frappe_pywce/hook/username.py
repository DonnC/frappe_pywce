from pywce import HookArg, TemplateDynamicBody

def get_name(arg: HookArg) -> HookArg:
    print('>>>>>>> received get_name hook: ', arg)
    arg.session_manager.save(session_id=arg.user.wa_id, key="username", data=arg.user.name)
    arg.template_body = TemplateDynamicBody(render_template_payload={"name": arg.user.name})
    
    return arg