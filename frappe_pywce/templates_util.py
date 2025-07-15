import frappe
from pywce import EngineConstants
import yaml
import json
import os
import glob

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
        print(f"Creating new Template Hook: {hook_name}")
        try:
            hook_doc = frappe.get_doc({
                "doctype": "Template Hook",
                "hook_name": hook_name,
                "hook_type": "Server Script", # Assuming all imported hooks are server scripts
                "server_script_path": hook_path
            })
            hook_doc.insert(ignore_permissions=True)
            frappe.db.commit()
        except Exception as e:
            print(f"ERROR: Failed to create Template Hook '{hook_name}': {e}")
            return None
    else:
        print(f"Template Hook '{hook_name}' already exists.")

    return hook_name


def bg_template_importer(directory_path, update_existing, job_id=None):
    imported_total_count = 0
    updated_total_count = 0
    file_errors = []
    template_errors = []
    
    frappe.set_user("Administrator")

    template_files = []
    template_files.extend(glob.glob(os.path.join(directory_path, "*.yaml")))
    template_files.extend(glob.glob(os.path.join(directory_path, "*.yml")))
    template_files.extend(glob.glob(os.path.join(directory_path, "*.json")))

    total_files = len(template_files)
    if total_files == 0:
        frappe.publish_progress(
            percent=100, 
            title="Import Complete", 
            description=f"No .yaml, .yml, or .json files found in '{directory_path}'.", 
            task_id=job_id
        )
        return "No templates found to import."

    all_templates_data = {} # Store parsed data for the second pass

    # --- PASS 1: Create/Update main Chatbot Template documents (without routes) ---
    frappe.publish_progress(
        percent=0, 
        title="1/2: Creating Stubs)", 
        description="Scanning files and creating template stubs...", 
        task_id=job_id
    )

    for i, file_path in enumerate(template_files):
        file_name = os.path.basename(file_path)
        
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                file_content = f.read()

            if not file_content.strip():
                continue

            try:
                current_file_templates = yaml.safe_load(file_content)
            except yaml.YAMLError as e:
                file_errors.append(f"Error parsing YAML/JSON in '{file_name}': {e}")
                frappe.log_error(message=f"Error parsing YAML/JSON in '{file_name}': {e}", title="TemplateImporter Error")
                continue

            if not isinstance(current_file_templates, dict):
                file_errors.append(f"Content of '{file_name}' is not a dictionary of templates. Skipping.")
                frappe.log_error(message=f"Content of '{file_name}' is not a dictionary of templates. Skipping.", title="TemplateImporter Error")
                continue

            for template_name, template_def in current_file_templates.items():
                if not isinstance(template_def, dict):
                    template_errors.append(f"File '{file_name}', Template '{template_name}': Definition is not a dictionary. Skipping.")
                    frappe.log_error(message=f"File '{file_name}', Template '{template_name}': Definition is not a dictionary. Skipping.", title="TemplateImporter Error")
                    continue
                
                all_templates_data[template_name] = template_def 

                try:
                    existing_doc = None
                    if frappe.db.exists("Chatbot Template", template_name):
                        if update_existing:
                            existing_doc = frappe.get_doc("Chatbot Template", template_name)
                        else:
                            template_errors.append(f"File '{file_name}', Template '{template_name}': Already exists and update_existing is False. Skipping in Phase 1.")
                            continue

                    doc_data = {
                        "doctype": "Chatbot Template",
                        "template_name": template_name,
                        "template_type": template_def.get("kind"),
                        "prop": template_def.get("prop"),
                        "checkpoint": 1 if bool(template_def.get("checkpoint", False)) else 0, 
                        "ack": 1 if bool(template_def.get("ack", False)) else 0,
                        "authenticated": 1 if bool(template_def.get("authenticated", False)) else 0,
                        "by_pass_session": 1 if bool(template_def.get("session", False)) else 0,
                        "show_typing_indicator": 1 if bool(template_def.get("typing", False)) else 0,
                        "reply_message_id": template_def.get("reply_message_id")
                    }

                    # Handle JSON fields 'body' (from 'message') and 'params'
                    message_data = template_def.get("message")
                    if message_data is not None:
                        try:
                            if isinstance(message_data, (str, int, float, bool)):
                                doc_data["body"] = json.dumps({"message": message_data}, ensure_ascii=False, indent=4)
                            else:
                                doc_data["body"] = json.dumps(message_data, ensure_ascii=False, indent=4)
                        except TypeError as e:
                            template_errors.append(f"File '{file_name}', Template '{template_name}': Failed to JSON serialize 'message': {e}")
                            frappe.log_error(message=f"File '{file_name}', Template '{template_name}': Failed to JSON serialize 'message': {e}", title="TemplateImporter Error")
                            doc_data["body"] = None
             
                    params_data = template_def.get("params")
                    if params_data is not None:
                        try:
                            doc_data["params"] = json.dumps(params_data)
                        except TypeError as e:
                            template_errors.append(f"File '{file_name}', Template '{template_name}': Failed to JSON serialize 'params': {e}")
                            frappe.log_error(message=f"File '{file_name}', Template '{template_name}': Failed to JSON serialize 'params': {e}", title="TemplateImporter Error")
                            doc_data["params"] = None

                    doc_data["on_receive"] = _upsert_template_hook(template_def.get("on-receive"))
                    doc_data["on_generate"] = _upsert_template_hook(template_def.get("on-generate"))
                    doc_data["router"] = _upsert_template_hook(template_def.get("router"))
                    doc_data["template"] = _upsert_template_hook(template_def.get("template"))
                    doc_data["middleware"] = _upsert_template_hook(template_def.get("middleware"))

                    # DO NOT process routes in Phase 1
                    if existing_doc:
                        for field, value in doc_data.items():
                            if field != 'routes': # Crucial: Don't touch routes in phase 1
                                setattr(existing_doc, field, value)

                        existing_doc.save()
                        updated_total_count += 1
                    else:
                        doc = frappe.get_doc(doc_data)
                        doc.insert()
                        imported_total_count += 1
                    frappe.db.commit()

                except Exception as e:
                    template_errors.append(f"File '{file_name}', Error processing template '{template_name}' in Phase 1: {e}")
                    frappe.log_error(message=f"File '{file_name}', Error processing template '{template_name}' in Phase 1: {e}", title="TemplateImporter Error")
                    frappe.db.rollback()

        except Exception as e:
            file_errors.append(f"Critical error processing file '{file_name}' in Phase 1: {e}")
            frappe.log_error(message=f"Critical error processing file '{file_name}' in Phase 1: {e}", title="TemplateImporter Error")

    # --- PASS 2: Update Chatbot Template documents with routes and other relationships ---
    frappe.publish_progress(
        percent=50, 
        title="Phase 2/2: Setting up Routes", 
        description="Setting up inter-template routes...", 
        task_id=job_id
    )

    current_template_num = 0
    total_templates_to_process = len(all_templates_data)

    for template_name, template_def in all_templates_data.items():
        current_template_num += 1
        current_percent = 50 + int((current_template_num / total_templates_to_process) * 50)

        frappe.publish_progress(
            percent=current_percent,
            title=f"Importing Chatbot Templates ({current_percent}%)",
            description=f"Setting routes for {template_name} ({current_template_num} of {total_templates_to_process})",
            task_id=job_id
        )

        try:
            doc_to_update = frappe.get_doc("Chatbot Template", template_name)

            # Handle Child Table: 'routes'
            doc_to_update.routes = []
            routes_from_yaml = template_def.get("routes", {})
            for user_input, next_template_name in routes_from_yaml.items():
                doc_to_update.append("routes", {
                    "doctype": "Chatbot Route",
                    "user_input": str(user_input),
                    "regex": 1 if str(user_input).startswith(EngineConstants.REGEX_PLACEHOLDER) else 0,
                    "template": str(next_template_name)
                })
            
            doc_to_update.save()
            frappe.db.commit()

        except Exception as e:
            template_errors.append(f"Error setting routes for template '{template_name}' in Phase 2: {e}")
            frappe.log_error(message=f"Error setting routes for template '{template_name}' in Phase 2: {e}", title="TemplateImporter Error")
            frappe.db.rollback()


    # --- Final Report ---
    final_message = f"Import process finished. Total Created: {imported_total_count}, Total Updated: {updated_total_count}."
    if file_errors or template_errors:
        final_message += "\n\nCompleted with errors. Check Error Log for details."
        
    frappe.publish_progress(
        percent=100, 
        title="Import Complete", 
        description=final_message, 
        task_id=job_id
    )
    return final_message


def delete_templates(template_names_to_delete: list):
    """
        Deletes a list of Chatbot Templates, handling all interdependencies
        and incoming references from outside the list.
    """
    if not isinstance(template_names_to_delete, list) or not template_names_to_delete:
        frappe.throw("Please provide a non-empty list of template names to delete.")

    existing_templates = [
        name for name in template_names_to_delete
        if frappe.db.exists("Chatbot Template", name)
    ]

    if len(existing_templates) != len(template_names_to_delete):
        non_existent = set(template_names_to_delete) - set(existing_templates)
        frappe.throw(f"Some templates not found: {', '.join(non_existent)}. Aborting.")

    frappe.msgprint(
        msg=f"Starting bulk deletion process for {len(existing_templates)} templates.",
        title="Bulk Delete Initiated", 
        indicator="blue"
    )

    templates_to_delete_set = set(existing_templates)
    
    deleted_count = 0
    skipped_count = 0
    errors = []

    # --- Phase 1: Remove all incoming references (external and internal) ---
    frappe.msgprint(msg="Phase 1/2: Removing all references to target templates...",
                    title="Bulk Delete Progress", indicator="blue")
    
    # Get ALL Chatbot Templates in the system
    all_templates = frappe.get_list("Chatbot Template", fields=["name", "routes"], limit_page_length=200)

    for doc_data in all_templates:
        try:
            doc = frappe.get_doc("Chatbot Template", doc_data.name)
            
            # Check if this template itself is one of the ones to be deleted.
            # We still process its routes to remove links to other templates in the target set.
            is_template_to_delete = doc.name in templates_to_delete_set

            original_route_count = len(doc.routes)
            new_routes = []
            
            # Filter out routes that point to any template in the target set
            for route in doc.routes:
                if route.template not in templates_to_delete_set:
                    new_routes.append(route)
                else:
                    # Log which references are being removed
                    print(f"Removing link: '{doc.name}' route '{route.route_key}' to '{route.template}'")

            if len(new_routes) < original_route_count:
                doc.routes = new_routes
                doc.save(ignore_permissions=True)
                frappe.db.commit() # Commit each save
                print(f"Updated references in '{doc.name}'.")

        except Exception as e:
            errors.append(f"Error while cleaning up references in '{doc_data.name}': {e}")
            frappe.log_error(message=f"Error cleaning references in '{doc_data.name}': {e}", title="Bulk Template Delete Error")
            frappe.db.rollback()

    # --- Phase 2: Delete the target templates ---
    frappe.msgprint("Phase 2/2: Deleting target templates...",
                    title="Bulk Delete Progress", indicator="blue")

    for template_name in templates_to_delete_set:
        try:
            frappe.delete_doc("Chatbot Template", template_name, ignore_permissions=True, force=False)
            frappe.db.commit()
            deleted_count += 1
            print(f"Successfully deleted: {template_name}")
        except Exception as e:
            errors.append(f"Failed to delete '{template_name}': {e}")
            frappe.log_error(message=f"Failed to delete '{template_name}': {e}", title="Bulk Template Delete Error")
            frappe.db.rollback()

    final_message = f"Bulk deletion complete. Deleted: {deleted_count}, Skipped: {len(templates_to_delete_set) - deleted_count}."
    if len(errors) > 1:
        final_message += "\nSome errors occurred. Check Error Log for details."
    
    return final_message


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

    job = frappe.enqueue(
        bg_template_importer,
        queue='long',
        timeout=1800,
        directory_path=directory_path,
        update_existing=update_existing,
        job_id=job_id
    )

    # msg = bg_template_importer(directory_path, update_existing, job.id)

    return {"job_id": job_id, "message": "Templates import started. Check Job Queue for progress."}

@frappe.whitelist()
def bulk_delete(templates):
    """
        Deletes a list of Chatbot Templates, handling all interdependencies
        and incoming references from outside the list.
    """
    if isinstance(templates, str):
        templates = json.loads(templates)

    response = delete_templates(templates)
    return response