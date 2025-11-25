// Copyright (c) 2025, donnc and contributors
// For license information, please see license.txt

frappe.ui.form.on("ChatBot Config", {
  setup: function (frm) {
    frm.trigger("setup_help");
  },
  refresh: function (frm) {
    frm.trigger("render_bridge_controls");

    if (!frm.bridge_interval) {
      frm.bridge_interval = setInterval(() => {
        if (frm.bridge_status === "running") {
          frm.trigger("refresh_logs");
        }
      }, 10000);
    }

    frm.add_custom_button(__("View Webhook Url"), function () {
      frm.call({
        method: "frappe_pywce.webhook.get_webhook",
        callback: function (r) {
          frappe.msgprint(r.message);
        },
      });
    });

    frm.add_custom_button(__("Clear Cache"), function () {
      frm.call({
        method: "frappe_pywce.webhook.clear_session",
        callback: function (r) {
          frappe.show_alert("Cache Cleared");
        },
      });
    });

    frm.add_custom_button(__("Open Studio"), function () {
      window.open(`/bot/studio`, "_blank");
    });
  },

  btn_launch_emulator: function (frm) {
    if (frm.bridge_status !== "running") {
      frappe.show_alert({
        message:
          "Emulator Bridge is not running. Please start the bridge first.",
        indicator: "red",
      });
    } else {
      window.open("/bot/emulator", "_blank");
    }
  },

  render_bridge_controls: function (frm) {
    frappe.call({
      method: "frappe_pywce.frappe_pywce.bridge_manager.get_status",
      callback: function (r) {
        const status = r.message.status;
        frm.bridge_status = status;

        let color = status === "running" ? "green" : "red";
        let status_text =
          status === "running" ? `Running (PID: ${r.message.pid})` : "Stopped";

        const icon_play = frappe.utils.icon("play", "sm");
        const icon_stop = frappe.utils.icon("primitive-square", "sm");
        const icon_refresh = frappe.utils.icon("refresh", "sm");

        let html = `
                <div style="display: flex; align-items: center; justify-content: space-between; padding: 15px; border: 1px solid var(--border-color); border-radius: var(--border-radius); background-color: var(--card-bg);">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <span class="indicator ${color}"></span>
                        <span style="font-weight: 600; font-size: 1.1em;">${status_text}</span>
                    </div>
                    <div style="display: flex; gap: 10px;">
                        ${
                          status === "stopped"
                            ? `<button class="btn btn-primary btn-sm" onclick="cur_frm.trigger('start_bridge')">
                                 ${icon_play} Start Bridge
                               </button>`
                            : `<button class="btn btn-danger btn-sm" onclick="cur_frm.trigger('stop_bridge')">
                                 ${icon_stop} Stop
                               </button>`
                        }
                        <button class="btn btn-default btn-sm" onclick="cur_frm.trigger('refresh_logs')">
                            ${icon_refresh} Logs
                        </button>
                    </div>
                </div>
            `;

        frm.set_df_property("bridge_controls", "options", html);
        frm.refresh_field("bridge_controls");

        if (status === "running") {
          frm.trigger("refresh_logs");
        } else {
          frm.trigger("clear_logs_display");
        }
      },
    });
  },

  refresh_logs: function (frm) {
    frappe.call({
      method: "frappe_pywce.frappe_pywce.bridge_manager.get_logs",
      callback: function (r) {
        if (r.message) {
          let logHtml = `
                    <div style="
                        background: #1e1e1e; 
                        color: #00ff00; 
                        padding: 15px; 
                        border-radius: var(--border-radius); 
                        font-family: 'Fira Code', monospace; 
                        height: 400px; 
                        max-height: 50vh;
                        overflow-y: auto; 
                        margin-top: 0px; 
                        font-size: 12px; 
                        line-height: 1.5;
                        box-shadow: inset 0 0 10px #000000;
                    ">
                        <div style="margin-bottom: 10px; border-bottom: 1px solid #333; padding-bottom: 5px; color: #888; display: flex; justify-content: space-between;">
                            <span>Bridge Server Logs</span>
                            <span>tail -50</span>
                        </div>
                        <pre style="margin: 0; white-space: pre-wrap;">${r.message}</pre>
                    </div>
                `;
          frm.set_df_property("bridge_logs", "options", logHtml);
          frm.refresh_field("bridge_logs");
        }
      },
    });
  },
  start_bridge: function (frm) {
    frappe.call({
      method: "frappe_pywce.frappe_pywce.bridge_manager.start_server",
      freeze: true,
      freeze_message: "Starting Emulator Bridge...",
      callback: function (r) {
        if (r.message === "started" || r.message === "running") {
          frappe.show_alert({
            message: "Bridge Server Started",
            indicator: "green",
          });
          frm.trigger("render_bridge_controls");
        } else {
          frappe.msgprint({
            title: "Error",
            message: r.message,
            indicator: "red",
          });
        }
      },
    });
  },

  stop_bridge: function (frm) {
    frappe.call({
      method: "frappe_pywce.frappe_pywce.bridge_manager.stop_server",
      freeze: true,
      freeze_message: "Stopping Server...",
      callback: function (r) {
        if (r.message === "stopped" || r.message === "not_running") {
          frappe.show_alert({
            message: "Bridge Server Stopped",
            indicator: "orange",
          });

          frm.trigger("render_bridge_controls");
          frm.trigger("clear_logs_display");
        } else {
          frappe.msgprint(r.message);
        }
      },
    });
  },

  clear_logs_display: function (frm) {
    let stoppedHtml = `
        <div style="margin-top: 10px; padding: 20px; text-align: center; color: #777; border: 1px dashed var(--border-color); border-radius: 8px; background: var(--bg-light-gray);">
            <span style="font-size: 0.9em;">Server is stopped. Logs cleared.</span>
        </div>
      `;
    frm.set_df_property("bridge_logs", "options", stoppedHtml);
    frm.refresh_field("bridge_logs");
  },

  setup_help(frm) {
    frm.get_field("help").html(`
<div style="padding: 15px; max-width: 800px; color: var(--text-color);">
    
    <!-- 1. WELCOME -->
    <div style="margin-bottom: 30px;">
        <h3 style="margin-top: 0;">👋 Welcome to Frappe Pywce</h3>
        <p>Build powerful, data-driven WhatsApp chatbots visually, right inside your Frappe Desk.</p>
        
        <div style="background-color: var(--bg-light-gray); padding: 15px; border-radius: 8px; border: 1px solid var(--border-color);">
            <h5 style="margin-top: 0;">🚀 Quick Start (5 Minutes)</h5>
            <ol style="padding-left: 20px; margin-bottom: 0; line-height: 1.6;">
                <li>Fill out the required fields above (dummy values work for local testing).</li>
                <li>Open the <b>Visual Builder</b> (Studio).</li>
                <li>Import the <b>Example Flow JSON</b> from the app's <u><a href="https://github.com/DonnC/frappe_pywce/tree/main/example" target="_blank">examples folder</a></u>.</li>
                <li>Save the flow.</li>
                <li>Open the <b>Emulator</b> to chat with your bot immediately—no phone required!</li>
            </ol>
        </div>
    </div>

    <hr style="margin: 25px 0; border-color: var(--border-color);">

    <!-- 2. TESTING & LIVE SETUP -->
    <div style="margin-bottom: 30px;">
        <h4>🛠️ Testing & Going Live</h4>
        <p>
            <b>1. Local Emulator:</b> Use the built-in Emulator for instant testing. It simulates WhatsApp perfectly without needing a Meta account.
            <br>
            <span style="font-size: 0.9em; color: var(--text-muted);">Ensure your <b>Environment</b> is set to <code>local</code> and start the bridge.</span>
        </p>
        <p>
            <b>2. Live Testing (Phone):</b> To test on a real device from your local machine:
            <ul style="margin-top: 5px;">
                <li>Use <u><a href="https://ngrok.com/" target="_blank">ngrok</a></u> to tunnel your local port (e.g., 8000) to the internet.</li>
                <li>Copy your <b>Webhook URL</b> (button above), replace the localhost base url with your ngrok url, and paste it into the Meta Developer Console.</li>
                <li>Configure the Verify Token to match your settings.</li>
            </ul>
        </p>
    </div>

    <!-- 3. ADVANCED FEATURES -->
    <div style="margin-bottom: 30px;">
        <h4>🔌 Power Features</h4>
        
        <div style="display: grid; grid-template-columns: 1fr; gap: 20px;">
            
            <!-- Authentication -->
            <div>
                <h5>🔐 Authentication</h5>
                <p style="font-size: 0.9em;">
                    Seamlessly link a WhatsApp number to a Frappe User session.
                </p>
                <ul style="font-size: 0.9em; padding-left: 20px;">
                    <li><b>Link Login:</b> Send a secure link that logs the user in via the browser and redirects back to WhatsApp.</li>
                    <li><b>WA Flows:</b> Use native WhatsApp screens for zero-friction login.</li>
                </ul>
            </div>

            <!-- Hooks -->
            <div>
                <h5>🪝 Hooks</h5>
                <p style="font-size: 0.9em;">
                    Connect nodes to Python logic using dotted paths (e.g., <code>my_app.tasks.create_task</code>).
                </p>
                
                <!-- CODE BLOCK START -->
                <div style="background: #1e1e1e; color: #d4d4d4; padding: 15px; border-radius: 6px; font-family: 'Fira Code', monospace; font-size: 0.85em; overflow-x: auto;">
<pre style="margin: 0;">
  <code class="language-python">
    # Hook function signature
    # Must accept one argument: arg (HookArg)
    # Must return: HookArg (or modified arg)

    # my_app/tasks/create_task.py
    import frappe
    from pywce import HookArg

    def my_hook(arg: HookArg) -> HookArg:
        # Access user input
        user_text = arg.user_input
        
        # Perform logic
        doc = frappe.new_doc("Task")
        doc.subject = f"New Request: {user_text}"
        doc.insert()
        
        # Return argument to continue flow
        return arg
  </code>
</pre>
</div>
 <!-- CODE BLOCK END -->
            </div>
        </div>
    </div>

    <!-- 4. FOOTER -->
    <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid var(--border-color);">
        <a href="https://docs.page/donnc/wce" target="_blank" class="btn btn-default btn-sm">
            📚 Read the Full Documentation
        </a>
    </div>

</div>
    `);
  },
});
