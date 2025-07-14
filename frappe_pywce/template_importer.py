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


def bg_template_importer(directory_path, update_existing=True, job_id=None):
    """
    Imports PyWCE YAML/JSON chatbot templates from files within a specified directory
    into Frappe Chatbot Template DocTypes.

    Args:
        directory_path (str): The absolute path to the directory containing template files.
        update_existing (bool): If True, existing templates will be updated.
                                If False, an error will be thrown if a template exists.

    Returns:
        str: A summary message indicating the success/failure and counts.
    """
    if not directory_path:
        frappe.throw("Directory path cannot be empty.")

    if not os.path.isdir(directory_path):
        frappe.throw(f"Provided path is not a valid directory: {directory_path}")

    imported_total_count = 0
    updated_total_count = 0
    file_errors = []
    template_errors = []

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

    for i, file_path in enumerate(template_files):
        file_name = os.path.basename(file_path)
        current_percent = int(((i + 1) / total_files) * 100)

        frappe.publish_progress(
            percent=current_percent,
            title=f"Importing Chatbot Templates ({current_percent}%)",
            description=f"Processing file {i+1} of {total_files}: {file_name}",
            task_id=job_id
        )

        print(f"\n--- Processing file: {file_path} ---")

        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                file_content = f.read()

            if not file_content.strip():
                print(f"WARNING: File '{file_path}' is empty or contains only whitespace. Skipping.")
                continue

            try:
                # Try loading as YAML first (which can also parse JSON)
                templates_data = yaml.safe_load(file_content)
            except yaml.YAMLError as e:
                file_errors.append(f"Error parsing YAML/JSON in '{file_path}': {e}")
                print(f"ERROR: Error parsing YAML/JSON in '{file_path}': {e}")
                continue # Move to next file if parsing fails

            if not isinstance(templates_data, dict):
                file_errors.append(f"Content of '{file_path}' is not a dictionary of templates. Skipping.")
                print(f"ERROR: Content of '{file_path}' is not a dictionary of templates. Skipping.")
                continue

            # --- Process templates within this file ---
            for template_name, template_def in templates_data.items():
                if not isinstance(template_def, dict):
                    template_errors.append(f"File '{file_path}', Template '{template_name}': Definition is not a dictionary. Skipping.")
                    print(f"ERROR: File '{file_path}', Template '{template_name}': Definition is not a dictionary. Skipping.")
                    continue

                try:
                    existing_doc = None
                    if frappe.db.exists("Chatbot Template", template_name):
                        if update_existing:
                            existing_doc = frappe.get_doc("Chatbot Template", template_name)
                            print(f"Updating existing Chatbot Template: {template_name}")
                        else:
                            template_errors.append(f"File '{file_path}', Template '{template_name}': Already exists and update_existing is False. Skipping.")
                            print(f"WARNING: File '{file_path}', Template '{template_name}': Already exists and update_existing is False. Skipping.")
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
                            if isinstance(message_data, str):
                                doc_data["body"] = json.dumps({'message', message_data})
                            elif isinstance(message_data, dict):
                                doc_data["body"] = json.dumps(message_data)
                            
                            else: raise TypeError("Message must be a string or dictionary.")
                            
                        except Exception as e:
                            template_errors.append(f"File '{file_path}', Template '{template_name}': Failed to JSON serialize 'message': {e}")
                            print(f"ERROR: File '{file_path}', Template '{template_name}': Failed to JSON serialize 'message': {e}")
                    
                    params_data = template_def.get("params")
                    if params_data is not None:
                        try:
                            doc_data["params"] = json.dumps(params_data)
                        except Exception as e:
                            template_errors.append(f"File '{file_path}', Template '{template_name}': Failed to JSON serialize 'params': {e}")
                            print(f"ERROR: File '{file_path}', Template '{template_name}': Failed to JSON serialize 'params': {e}")


                    # Handle Hook Links
                    doc_data["on_receive"] = _upsert_template_hook(template_def.get("on-receive"))
                    doc_data["on_generate"] = _upsert_template_hook(template_def.get("on-generate"))
                    doc_data["router"] = _upsert_template_hook(template_def.get("router"))
                    doc_data["template"] = _upsert_template_hook(template_def.get("template"))
                    doc_data["middleware"] = _upsert_template_hook(template_def.get("middleware"))

                    # Prepare DocType object (using a temporary object for update to avoid side effects before save)
                    if existing_doc:
                        for field, value in doc_data.items():
                            setattr(existing_doc, field, value)
                        doc_to_save = existing_doc
                    else:
                        doc_to_save = frappe.get_doc(doc_data)

                    # Handle Child Table: 'routes'
                    doc_to_save.routes = []
                    routes_from_yaml = template_def.get("routes", {})
                    for user_input, next_template_name in routes_from_yaml.items():
                        doc_to_save.append("routes", {
                            "doctype": "Chatbot Route",
                            "user_input": str(user_input),
                            "regex": 1 if str(user_input).startswith(EngineConstants.REGEX_PLACEHOLDER) else 0,
                            "template": str(next_template_name)
                        })
                    
                    # --- Save the Doc ---
                    if existing_doc:
                        doc_to_save.save()
                        updated_total_count += 1
                    else:
                        doc_to_save.insert()
                        imported_total_count += 1

                    frappe.db.commit()

                except Exception as e:
                    template_errors.append(f"File '{file_path}', Error processing template '{template_name}': {e}")
                    print(f"ERROR: File '{file_path}', Error processing template '{template_name}': {e}")
                    frappe.db.rollback()

        except Exception as e:
            file_errors.append(f"Critical error reading or processing file '{file_path}': {e}")
            print(f"CRITICAL ERROR: Reading/processing file '{file_path}': {e}")

    # --- Final Report ---
    final_message = f"Import process finished. Total Created: {imported_total_count}, Total Updated: {updated_total_count}."
    
    if file_errors or template_errors:
        final_message += "\n\nCompleted with errors. Check console for details."
        frappe.msgprint(final_message, title="Import Warning", indicator="orange")
        print("\n--- File Level Errors ---")
        for err in file_errors:
            print(err)
        print("\n--- Template Level Errors ---")
        for err in template_errors:
            print(err)
        print("-------------------------\n")
    else:
        frappe.msgprint(final_message, title="Import Success", indicator="green")
    
    frappe.publish_progress(
        percent=100,
        title="Import Complete",
        description=final_message,
        task_id=job_id
    )
    return final_message


@frappe.whitelist()
def import_templates(directory_path:str, update_existing=True):
    """
    Initiates a background job to import PyWCE chatbot templates from a directory.
    This function is callable from the Frappe UI.
    """
    if not directory_path:
        frappe.throw("Directory path cannot be empty.")

    if not os.path.isdir(directory_path):
        frappe.throw(f"Provided path is not a valid directory: {directory_path}")

    # job = frappe.enqueue(
    #     bg_template_importer,
    #     queue='long',
    #     timeout=1800,
    #     directory_path=directory_path,
    #     update_existing=update_existing
    # )

    job_id = frappe.generate_hash(length=10)

    msg = bg_template_importer(directory_path, update_existing)

    frappe.msgprint(
        msg,
        title="Import Result",
        indicator="blue"
    )

    # frappe.msgprint(
    #     "Template import started in the background. You will be notified of the progress.",
    #     title="Import Started",
    #     indicator="blue"
    # )
    return {"job_id": job_id, "message": "Import started successfully."}