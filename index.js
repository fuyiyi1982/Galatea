/**
 * Lilith Assistant Bootstrapper
 * This file acts as a non-module entry point to load the actual ES6 module.
 */
(async function() {
    console.log('[Galatea] Bootstrapper starting...');

    try {
        // Find the absolute script path more robustly
        let scriptUrl = null;
        if (document.currentScript && document.currentScript.src) {
            scriptUrl = document.currentScript.src;
        }

        if (!scriptUrl) {
            // Fallback: search any extension script sitting under /third-party/.../index.js
            const scripts = document.getElementsByTagName('script');
            for (let i = 0; i < scripts.length; i++) {
                const src = scripts[i].src;
                if (src && src.includes('/extensions/third-party/') && src.endsWith('/index.js')) {
                    scriptUrl = src;
                    break;
                }
            }
        }

        if (!scriptUrl) {
            // Final attempt: probe common folder names to handle mismatched install paths
            const origin = window.location.origin;
            const candidates = [
                `${origin}/scripts/extensions/third-party/Galatea/index.js`,
                `${origin}/scripts/extensions/third-party/lilith-assistant/index.js`
            ];
            for (const candidate of candidates) {
                try {
                    const res = await fetch(candidate, { method: 'HEAD' });
                    if (res.ok) {
                        scriptUrl = candidate;
                        break;
                    }
                } catch (e) {
                    // ignore and try the next candidate
                }
            }
        }

        if (!scriptUrl) {
            console.warn('[Galatea] Could not detect script URL via currentScript or script search. Using SillyTavern default paths.');
            // Last resort: prefer the Galatea folder name
            scriptUrl = window.location.origin + '/scripts/extensions/third-party/Galatea/index.js';
        }
        
        const urlObj = new URL(scriptUrl, window.location.href);
        const baseFolder = scriptUrl.substring(0, scriptUrl.lastIndexOf('/') + 1);
        // 记录实际加载路径和目录名，供模块内动态引用资源（避免目录名不一致导致找不到资源）
        window.__galateaBasePath = baseFolder;
        window.__galateaExtensionFolder = urlObj.pathname.split('/').filter(Boolean).slice(-2, -1)[0] || 'Galatea';
        const mainPath = baseFolder + 'main.js';
        
        console.log(`[Galatea] Loading main module from: ${mainPath}`);
        await import(mainPath);
        console.log('[Galatea] Module loaded successfully.');
    } catch (e) {
        console.error('[Galatea] Critical error during boot:', e);
    }
})();
