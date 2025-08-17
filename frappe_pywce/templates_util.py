import frappe
import frappe.utils

import yaml
import json
import os
import glob


from pywce import EngineConstants


frappe.utils.logger.set_log_level("DEBUG")
logger = frappe.logger("frappe_pywce", allow_site=True)

TEMPLATE_DOCTYPE = "Chatbot Template"
ROUTE_CHILD_DOCTYPE = "Chatbot Route"
DEFAULT_MISSING_STAGE = "STAGE-NOT-FOUND"

def _get_or_create_default_stage():
    """
    Return the Chatbot Template doc for default_name.
    If not found, attempt to create a minimal template with that name.
    If creation fails (because required fields are missing), raise a helpful error.
    """
    try:
        return frappe.get_doc(TEMPLATE_DOCTYPE, DEFAULT_MISSING_STAGE)
    except frappe.DoesNotExistError:
        # TODO: create CD of routes that points to Retry route
        try:
            doc = frappe.get_doc({
                'doctype': TEMPLATE_DOCTYPE,
                'name': DEFAULT_MISSING_STAGE,
                'kind': 'text',
                'message': '{"body": "Stage not found. Please contact admin.", "title": "Not Found"}'
            })
            doc.insert(ignore_permissions=True)
            frappe.db.commit()
            return doc
        except Exception as e:
            frappe.db.rollback()
            frappe.throw(frappe._(
                'Default template "{0}" does not exist and could not be created automatically. '
                'Please create a Chatbot Template named "{0}" manually. Error: {1}'
            ).format(DEFAULT_MISSING_STAGE, frappe.get_traceback()))

def _upsert_template_hook(hook_path:str):
    """
    Ensures a Template Hook DocType exists for the given hook_path.
    Creates it if it doesn't exist, with hook_name = server_script_path.
    Returns the hook_path (which is also the hook_name).
    """
    if not hook_path:
        return None

    # proj.proj.path.file.fx
    # name -> file.fx
    l2 = hook_path.split(".")[-2:]
    hook_name = f"{l2[0]}.{l2[1]}"

    if not frappe.db.exists("Template Hook", hook_name):
        logger.debug(f"Creating new Template Hook: {hook_name}")
        try:
            hook_doc = frappe.get_doc({
                "doctype": "Template Hook",
                "hook_name": hook_name,
                "hook_type": "Server Script",
                "server_script_path": hook_path
            })
            hook_doc.insert(ignore_permissions=True)
            frappe.db.commit()
        except Exception as e:
            return None

    return hook_name

def _parse_file(path):
    with open(path, "r", encoding="utf-8") as f:
        text = f.read()
    try:
        return json.loads(text)
    except Exception:
        try:
            return yaml.safe_load(text)
        except Exception as e:
            frappe.throw(frappe._("Could not parse file {0}: {1}").format(path, str(e)))

def _create_template_doc(template_name: str, template_def:dict):
    msg = template_def.get("message")
    if msg is None:
        frappe.throw(frappe._("Template message is missing"))

    doc_data = {
        "doctype": TEMPLATE_DOCTYPE,
        "template_name": template_name,
        "template_type": template_def.get("type"),
        "prop": template_def.get("prop"),
        "checkpoint": 1 if bool(template_def.get("checkpoint", False)) else 0, 
        "ack": 1 if bool(template_def.get("ack", False)) else 0,
        "authenticated": 1 if bool(template_def.get("authenticated", False)) else 0,
        "by_pass_session": 1 if bool(template_def.get("session", False)) else 0,
        "show_typing_indicator": 1 if bool(template_def.get("typing", False)) else 0,
        "reply_message_id": template_def.get("reply_message_id")
    }

    doc_data["on_receive"] = _upsert_template_hook(template_def.get("on-receive"))
    doc_data["on_generate"] = _upsert_template_hook(template_def.get("on-generate"))
    doc_data["router"] = _upsert_template_hook(template_def.get("router"))
    doc_data["template"] = _upsert_template_hook(template_def.get("template"))
    doc_data["middleware"] = _upsert_template_hook(template_def.get("middleware"))

    if template_def.get('params'):
        doc_data["params"] = json.dumps(template_def.get('params'))

    if isinstance(msg, str):
        doc_data["body"] = json.dumps({"message": msg}, ensure_ascii=False, indent=4)
    
    else:
        doc_data["body"] = json.dumps(msg, ensure_ascii=False, indent=4)

    frappe.get_doc(doc_data).insert(
        ignore_permissions=True, 
        # ignore_mandatory=True
    )


def bg_template_importer(directory_path:str, update_existing, job_id=None):
    frappe.set_user("Administrator")

    template_files = []
    template_files.extend(glob.glob(os.path.join(directory_path, "*.yaml")))
    template_files.extend(glob.glob(os.path.join(directory_path, "*.yml")))
    template_files.extend(glob.glob(os.path.join(directory_path, "*.json")))

    total_files = len(template_files)
    if total_files == 0:
        return "No templates found to import."

    templates_map = {}
    parse_errors = []

    # 1. parse files -> in-memory
    logger.info(f"[1] Parsing {total_files} template files in-memory from {directory_path}")
    for i, file_path in enumerate(template_files):
        file_name = os.path.basename(file_path)
        
        try:
            current_file_templates = _parse_file(file_path)

            if not isinstance(current_file_templates, dict):
                frappe.throw(frappe._("Content of '{0}' is not a dictionary of templates.").format(file_name))
            
            if isinstance(current_file_templates, dict) and any(isinstance(v, dict) for v in current_file_templates.values()):
                # assume mapping: { "START-MENU": { ... }, ... }
                for k, v in current_file_templates.items():
                    templates_map[str(k)] = v or {}
            else:
                name = current_file_templates.get("name") if isinstance(current_file_templates, dict) else None
                if not name:
                    # fallback: use filename as name
                    name = os.path.splitext(file_name)[0]
                templates_map[str(name)] = current_file_templates or {}

        except Exception as e:
            parse_errors.append((file_name, str(e)))

    if not templates_map:
        frappe.throw(frappe._("No templates found in {0}").format(directory_path)) 
    

    # 2) Create stubs for all templates so links can be resolved (first pass)
    logger.info(f"[2] Creating stubs for {len(templates_map)} templates from {directory_path}")

    created_stubs = []
    existing = frappe.db.sql_list("SELECT name FROM `tab{0}`".format(TEMPLATE_DOCTYPE))
    for tname in templates_map.keys():
        # if exists already, skip (or TODO: optionally update later)
        if tname in existing:
            continue
        try:
            _create_template_doc(tname, templates_map[tname])
            created_stubs.append(tname)
        except Exception as e:
            logger.error(f"Failed to create stub for {tname}: {e}")
            parse_errors.append((tname, str(e)))

    frappe.db.commit()

    default_doc = _get_or_create_default_stage()

    # 3) Second pass: update each template doc with full data incl. routes
    logger.info(f"[4] Updating {len(created_stubs)} templates with full data")

    missing_references = {}  # tname -> [missing_targets...]
    updated = []
    for tname, data in templates_map.items():
        try:
            doc = frappe.get_doc(TEMPLATE_DOCTYPE, tname)
            doc.set('routes', [])

            routes_map = data.get("routes") or {}
            missing_for_doc = []
            for user_input, target in routes_map.items():
                target_name = (target or "").strip() if target is not None else ""
                if not target_name:
                    target_name = default_doc.name
            
                exists = frappe.db.exists(TEMPLATE_DOCTYPE, target_name, cache=True)
                if not exists:
                    missing_for_doc.append(target_name)
                    assigned_target = default_doc.name
                else:
                    assigned_target = target_name

                doc.append('routes', {
                    'user_input': str(user_input).replace(EngineConstants.REGEX_PLACEHOLDER, "").strip(),
                    'regex': 1 if str(user_input).startswith(EngineConstants.REGEX_PLACEHOLDER) else 0,
                    'template': assigned_target
                })

            doc.save(ignore_permissions=True)
            updated.append(tname)
            if missing_for_doc:
                missing_references[tname] = missing_for_doc

        except Exception as e:
            logger.error(f"Failed to update template {tname}: {e}")
            parse_errors.append((tname, str(e)))
            continue

    frappe.db.commit()

    report = {
        "parsed_count": len(templates_map),
        "stubs_created": created_stubs,
        "templates_updated": updated,
        "missing_references": missing_references,
        "parse_errors": parse_errors,
        "default_stage_used": default_doc.name
    }

    logger.info(f"Template import report: {report}")

    return report

def reassign_routes_and_delete(template_name):
    """
    Reassign all Chatbot Route.template == template_name -> default_name,
    then delete the Chatbot Template template_name.

    Returns a dict with info about affected parents and counts.
    """
    try:
        frappe.get_doc(TEMPLATE_DOCTYPE, template_name)
    except frappe.DoesNotExistError:
        frappe.throw(frappe._('Chatbot Template {0} not found.').format(template_name))

    default_doc = _get_or_create_default_stage()

    # find distinct parents that currently reference this template (for report)
    parents = frappe.db.sql_list("""
                SELECT DISTINCT `parent` 
                FROM `tabChatbot Route` 
                WHERE `template` = %s
            """, template_name)

    count_rows = frappe.db.sql("""
                    SELECT COUNT(*) 
                    FROM `tabChatbot Route` 
                    WHERE `template` = %s
            """, template_name, as_dict=True)[0]['COUNT(*)']

    # run update + delete in a transaction
    try:
        frappe.db.sql("""
            UPDATE `tabChatbot Route`
            SET `template` = %s
            WHERE `template` = %s
        """, (default_doc.name, template_name))

        frappe.delete_doc(TEMPLATE_DOCTYPE, template_name, force=True, ignore_permissions=True)

        frappe.db.commit()
    except Exception:
        frappe.db.rollback()
        raise

    return {
        'deleted_template': template_name,
        'reassigned_to': default_doc.name,
        'affected_parents': parents,
        'routes_reassigned_count': count_rows
    }

@frappe.whitelist()
def import_templates(directory_path:str, update_existing=True):
    """
    Initiates a background job to import PyWCE chatbot templates from a directory.
    This function is callable from the Frappe UI.
    """
    job_id = frappe.generate_hash(length=10)

    if not directory_path:
        frappe.throw("Directory path cannot be empty.")

    if not os.path.isdir(directory_path):
        frappe.throw(f"Provided path is not a valid directory: {directory_path}")

    frappe.enqueue(
        bg_template_importer,
        queue='long',
        directory_path=directory_path,
        update_existing=update_existing,
        job_id=job_id
    )

    return {"job_id": job_id, "message": "Templates import started. Check Job Queue for progress."}

@frappe.whitelist()
def bulk_delete(templates):
    """
    Deletes a list of Chatbot Templates, handling all interdependencies
    and incoming references from outside the list.
    """
    if isinstance(templates, str):
        templates = json.loads(templates)

    if not isinstance(templates, list):
        frappe.throw("Templates must be a list of names.")

    error = 0
    for template_name in templates:
        try:
            result = reassign_routes_and_delete(template_name)
            logger.info("Template delete result of: %s, %s", template_name, result)
        except Exception as e:
            frappe.log_error(title="Template Deletion Error")
            error += 1

    return f"Delete successful with {error} errors"