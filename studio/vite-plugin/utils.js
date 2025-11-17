// Use ES Module import/export
import path from "path";
import fs from "fs";

/**
 * Finds the bench directory by traversing up from the current working directory.
 * @returns {string | null}
 */
export function getFrappeBenchDir() {
    let currentDir = process.cwd();
    while (currentDir !== path.resolve(currentDir, "/")) {
        if (
            fs.existsSync(path.join(currentDir, "sites")) &&
            fs.existsSync(path.join(currentDir, "apps"))
        ) {
            return currentDir;
        }
        currentDir = path.resolve(currentDir, "..");
    }
    return null;
}

/**
 * Reads the common_site_config.json from the bench directory.
 * @param {string | null} benchDir
 * @returns {Record<string, any> | null}
 */
export function getCommonSiteConfig(benchDir) {
    if (!benchDir) return null;

    const configPath = path.join(benchDir, "sites", "common_site_config.json");
    if (fs.existsSync(configPath)) {
        try {
            return JSON.parse(fs.readFileSync(configPath));
        } catch (e) {
            console.error("Error parsing common_site_config.json:", e);
            return null;
        }
    }
    return null;
}

/**
 * Gets the current dev site.
 * @param {string | null} benchDir
 * @param {Record<string, any> | null} commonConfig
 * @returns {string}
 */
export function getCurrentSite(benchDir, commonConfig) {
    const currentSitePath = path.join(benchDir, "sites", "current_site.txt");
    if (fs.existsSync(currentSitePath)) {
        return fs.readFileSync(currentSitePath, "utf8").trim();
    }
    if (commonConfig && commonConfig.default_site) {
        return commonConfig.default_site; // This will pick up "simplex.local"
    }
    return "127.0.0.1";
}