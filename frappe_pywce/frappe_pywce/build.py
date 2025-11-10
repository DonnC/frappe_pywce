import os
import subprocess
import frappe

def build_frontend_apps():
    """
    This function is called by `bench build`.
    It finds all frontend apps and runs their build script.
    """
    app_path = frappe.get_app_path('frappe-pywce')
    frontend_apps = ['emulator', 'builder']

    for app_name in frontend_apps:
        app_dir = os.path.join(app_path, app_name)
        frappe.logger().info(f"Building {app_name} UI...")
        
        try:
            # Install dependencies
            subprocess.run(
                ['yarn', 'install'], 
                cwd=app_dir, 
                check=True, 
                shell=True
            )
            # Run the build
            subprocess.run(
                ['yarn', 'build'], 
                cwd=app_dir, 
                check=True, 
                shell=True
            )
            frappe.logger().info(f"{app_name} UI build successful.")
        except Exception as e:
            frappe.logger().error(f"{app_name} UI build failed: {e}")