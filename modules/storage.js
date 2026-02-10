// modules/storage.js
import { SETTINGS_KEY, DEFAULT_STATE } from './config.js';

function getSTContext() {
    try {
        return SillyTavern.getContext();
    } catch (e) {
        console.error('[Lilith] SillyTavern context not available!', e);
        return null;
    }
}

export function getExtensionSettings() {
    const context = getSTContext();
    if (!context) return {};
    if (!context.extensionSettings[SETTINGS_KEY]) {
        context.extensionSettings[SETTINGS_KEY] = {};
    }
    return context.extensionSettings[SETTINGS_KEY];
}

export function saveExtensionSettings() {
    const context = getSTContext();
    if (context) context.saveSettingsDebounced();
}

export const userState = {};
export const panelChatHistory = [];

/**
 * Validates and completes the user state from extension settings.
 */
export function validateState() {
    const settings = getExtensionSettings();
    
    // Initialize userState if empty
    if (!settings.userState) {
        settings.userState = JSON.parse(JSON.stringify(DEFAULT_STATE));
    }
    
    // Sync shared objects (maintain references)
    Object.assign(userState, settings.userState);
    
    // Sync chat history array
    panelChatHistory.length = 0;
    if (settings.chatHistory) {
        panelChatHistory.push(...settings.chatHistory);
    }

    const fields = [
        ['fatePoints', 1000],
        ['gachaInventory', []],
        ['memoryArchive', []],
        ['activePersona', 'toxic'],
        ['hideAvatar', false],
        ['avatarSize', 150],
        ['commentMode', 'random'],
        ['ttsConfig', { pitch: 1.2, rate: 1.3 }],
        ['commentFrequency', 50],
        ['extractionEnabled', false],
        ['extractionRegex', ''],
        ['textReplacementEnabled', false],
        ['textReplacementRegex', ''],
        ['textReplacementString', '']
    ];
    fields.forEach(([key, def]) => {
        if (userState[key] === undefined) userState[key] = def;
    });
}

export function saveState(updateUICallback) { 
    getExtensionSettings().userState = userState; 
    saveExtensionSettings(); 
    if (updateUICallback) updateUICallback(); 
}

export function saveChat() {
    if (panelChatHistory.length > 100) {
        panelChatHistory.splice(0, panelChatHistory.length - 100);
    }
    getExtensionSettings().chatHistory = panelChatHistory;
    saveExtensionSettings();
}

export function updateFavor(n, updateUICallback) {
    userState.favorability = Math.max(0, Math.min(100, userState.favorability + parseInt(n)));
    saveState(updateUICallback);
    return parseInt(n);
}

export function updateSanity(n, updateUICallback) {
    userState.sanity = Math.max(0, Math.min(100, userState.sanity + parseInt(n)));
    saveState(updateUICallback);
    return parseInt(n);
}

export function migrateData() {
    const settings = getExtensionSettings();
    const legacyKey = 'lilith_data_v23_fix';
    
    if (Object.keys(settings).length === 0 && localStorage.getItem(legacyKey)) {
        console.log('[Lilith] Migrating data from LocalStorage to ExtensionSettings...');
        try {
            const legacyState = JSON.parse(localStorage.getItem(legacyKey));
            if (legacyState) settings.userState = legacyState;

            const legacyChat = JSON.parse(localStorage.getItem(legacyKey + '_chat'));
            if (legacyChat) settings.chatHistory = legacyChat;

            settings.muted = localStorage.getItem('lilith_muted') === 'true';

            settings.apiConfig = {
                apiType: localStorage.getItem('lilith_api_type'),
                baseUrl: localStorage.getItem('lilith_api_url'),
                apiKey: localStorage.getItem('lilith_api_key'),
                model: localStorage.getItem('lilith_api_model')
            };

            saveExtensionSettings();
            console.log('[Lilith] Migration complete.');
            // Reload userState after migration (maintain references)
            if (settings.userState) Object.assign(userState, settings.userState);
            if (settings.chatHistory) {
                panelChatHistory.length = 0;
                panelChatHistory.push(...settings.chatHistory);
            }
        } catch (e) {
            console.error('[Lilith] Migration failed:', e);
        }
    }
}
