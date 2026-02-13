/**
 * Galatea Assistant Bootstrapper
 * This file acts as a non-module entry point to load the actual ES6 module.
 */
(async function() {
    console.log('[Galatea] Bootstrapper starting...');

    try {
        // Find the absolute script path more robustly
        let scriptUrl = null;
        if (document.currentScript) {
            scriptUrl = document.currentScript.src;
        } else {
            // Fallback: Search through all scripts for our unique index.js path
            const scripts = document.getElementsByTagName('script');
            for (let i = 0; i < scripts.length; i++) {
                const src = scripts[i].src;
                if (src && (src.indexOf('Galatea/index.js') !== -1 || src.indexOf('lilith-assistant/index.js') !== -1)) {
                    scriptUrl = src;
                    break;
                }
            }
        }

        if (!scriptUrl) {
            console.warn('[Galatea] Could not detect script URL via currentScript or script search. Using SillyTavern default paths.');
            // Last resort: Standard ST path
            scriptUrl = window.location.origin + '/scripts/extensions/third-party/Galatea/index.js';
        }
        
        const baseFolder = scriptUrl.substring(0, scriptUrl.lastIndexOf('/') + 1);
        const mainPath = baseFolder + 'main.js';
        
        console.log(`[Galatea] Loading main module from: ${mainPath}`);
        await import(mainPath);
        console.log('[Galatea] Module loaded successfully.');
    } catch (e) {
        console.error('[Galatea] Critical error during boot:', e);
    }
})();
