import {
    getFrappeBenchDir,
    getCommonSiteConfig,
    getCurrentSite
} from "./utils.js";

/**
 * @typedef {object} FrappeVitePluginOptions
 * @property {number} [port]
 */

/**
 * 
 * @param {FrappeVitePluginOptions} pluginOptions
 * @returns {import("vite").Plugin}
 */
export default function frappeVitePlugin(pluginOptions = {}) {
    const benchDir = getFrappeBenchDir();

    const commonConfig = getCommonSiteConfig(benchDir);
    const site_name = getCurrentSite(benchDir, commonConfig);

    const backendPort =
        process.env.FRAPPE_WEB_SERVER_PORT ||
        commonConfig?.webserver_port ||
        8000;

    const vite_port = pluginOptions.port || 8080;

    const target = `http://${site_name}:${backendPort}`;
    const finalUrl = `http://${site_name}:${vite_port}`;

    console.log(``);
    console.log(`🔗 Frappe Vite Auto-Proxy`);
    console.log(`➡ Backend: ${target}`);
    console.log(`➡ Dev UI:  ${finalUrl}`);
    console.log(``);

    const proxy = {};
    const routes = [
        "/api",
        "/assets",
        "/files",
        "/private",
        "/socket.io",
        "/login",
        "/app"
    ];

    for (const route of routes) {
        proxy[route] = {
            target,
            changeOrigin: true,
            ws: route === "/socket.io",
            headers: {
                "X-Frappe-Site-Name": site_name
            },

        };
    }

    return {
        name: "frappe-vite-plugin",
        config: () => ({
            server: {
                host: site_name,
                port: vite_port,
                cors: false,
                proxy
            }
        })
    };
}
