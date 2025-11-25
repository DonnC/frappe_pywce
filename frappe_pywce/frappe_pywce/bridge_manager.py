import frappe
import os
import signal
import subprocess
import psutil

def get_bridge_paths():
    """Helper to get paths securely."""
    app_path = frappe.get_app_path("frappe_pywce")
    bridge_dir = os.path.abspath(os.path.join(app_path, "..", "bridge"))
    log_file = os.path.join(bridge_dir, "bridge.log")
    return bridge_dir, log_file

def is_server_running():
    """Internal helper."""
    status = get_status()
    return status["status"] == "running"

@frappe.whitelist()
def start_server():
    """Starts the Node.js bridge server."""
    if is_server_running():
        return "running"

    bridge_dir, log_file = get_bridge_paths()
    command = ["node", "index.js"]

    try:
        if not os.path.exists(log_file):
            open(log_file, 'w').close()

        with open(log_file, "w") as out:
            out.write("--- Starting Bridge Server ---\n")
            process = subprocess.Popen(
                command,
                cwd=bridge_dir,
                stdout=out,
                stderr=out,
                start_new_session=True
            )

        frappe.db.set_value("ChatBot Config", "ChatBot Config", "bridge_pid", process.pid)
        frappe.db.commit()
        
        return "started"

    except Exception as e:
        frappe.log_error(f"Bridge Start Error: {e}")
        return f"error: {str(e)}"

@frappe.whitelist()
def stop_server():
    """Stops the bridge server using the stored PID."""
    pid = frappe.db.get_value("ChatBot Config", "ChatBot Config", "bridge_pid")
    
    if not pid:
        return "not_running"

    try:
        pid = int(pid)
        if psutil.pid_exists(pid):
            os.kill(pid, signal.SIGTERM)
            
            frappe.db.set_value("ChatBot Config", "ChatBot Config", "bridge_pid", 0)
            frappe.db.commit()
            return "stopped"
        else:
            frappe.db.set_value("ChatBot Config", "ChatBot Config", "bridge_pid", 0)
            frappe.db.commit()
            return "already_stopped"

    except Exception as e:
        return f"error: {str(e)}"

@frappe.whitelist()
def get_status():
    pid = frappe.db.get_value("ChatBot Config", "ChatBot Config", "bridge_pid")
    if pid:
        try:
            if psutil.pid_exists(int(pid)):
                return {"status": "running", "pid": pid}
        except Exception:
            pass
    
    if pid:
        frappe.db.set_value("ChatBot Config", "ChatBot Config", "bridge_pid", 0)
        frappe.db.commit()
        
    return {"status": "stopped", "pid": None}

@frappe.whitelist()
def get_logs():
    """Reads the last 50 lines of the log file."""
    _, log_file = get_bridge_paths()

    if os.path.exists(log_file):
        try:
            with open(log_file, "r") as f:
                lines = f.readlines()
                return "".join(lines[-50:])
        except Exception:
            return "Error reading logs."
    return "No log file found. Start the server to generate logs."