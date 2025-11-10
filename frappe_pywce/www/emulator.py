import frappe

def get_context(context):
    # This is for production.
    # It tells Frappe to serve the built index.html file.
    # We point to 'emulator_build/index.html' which we will configure in Phase 6.
    
    # In development (bench start), this file is not used, 
    # as you'll be on localhost:8080.
    
    context.no_cache = 1
    context.no_sitemap = 1
    context.title = "WCE WhatsApp Emulator"

    # In production, Frappe will look for this file:
    # .../public/emulator_build/index.html
    context.template = "emulator_build/index.html"