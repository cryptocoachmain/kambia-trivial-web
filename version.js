/**
 * Auto-Update System - Forces cache refresh when app version changes
 */
const APP_VERSION = "1.0.3"; // Increment this when you deploy changes
const VERSION_KEY = "kambia_app_version";

(function () {
    const storedVersion = localStorage.getItem(VERSION_KEY);

    if (storedVersion !== APP_VERSION) {
        console.log(`Version update detected: ${storedVersion} -> ${APP_VERSION}`);

        // Clear all caches
        if ('caches' in window) {
            caches.keys().then(names => {
                names.forEach(name => caches.delete(name));
            });
        }

        // Update stored version
        localStorage.setItem(VERSION_KEY, APP_VERSION);

        // Force hard reload (bypass cache)
        if (storedVersion !== null) {
            console.log("Forcing cache refresh...");
            window.location.reload(true);
        }
    }
})();
