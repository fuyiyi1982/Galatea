// modules/audio.js
import { getExtensionSettings, saveExtensionSettings, userState } from './storage.js';
import { PERSONA_DB } from './config.js';

export const AudioSys = {
    get muted() { return getExtensionSettings().muted === true; },
    set muted(val) { getExtensionSettings().muted = val; saveExtensionSettings(); },
    toggleMute() {
        this.muted = !this.muted;
        window.speechSynthesis.cancel();
        return this.muted;
    },
    
    stop() {
         window.speechSynthesis.cancel();
    },

    getVoice(targetName) {
        const voices = window.speechSynthesis.getVoices();
        let voice = voices.find(v => v.name.includes(targetName) && v.name.includes("Neural"));
        if (!voice) voice = voices.find(v => v.name.includes(targetName));
        if (!voice) voice = voices.find(v => (v.lang === "zh-CN" || v.lang === "zh_CN") && v.name.includes("Neural"));
        if (!voice) voice = voices.find(v => v.lang && v.lang.startsWith("zh"));
        return voice;
    },
    
    speak(text) {
        if (this.muted || !text) return;
        const cleanText = text.replace(/\[.*?\]/g, '').replace(/\(.*?\)/g, '').replace(/（.*?）/g, '').replace(/[*#`~]/g, '').trim();
        if (!cleanText) return;

        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(cleanText);
        
        let currentPersonaKey = userState.activePersona || 'toxic';
        const dbConfig = (PERSONA_DB[currentPersonaKey]) ? PERSONA_DB[currentPersonaKey].voice : { pitch: 1.0, rate: 1.0, base: 'Xiaoyi' };
        const ttsConfig = userState.ttsConfig || { pitch: 1.2, rate: 1.3 };
        
        const targetBase = dbConfig.base || 'Xiaoyi'; 
        const v = this.getVoice(targetBase);
        if (v) u.voice = v;

        u.pitch = ttsConfig.pitch || 1.0;
        u.rate = ttsConfig.rate || 1.0;
        
        window.speechSynthesis.speak(u);
    }
};

window.speechSynthesis.onvoiceschanged = () => { window.speechSynthesis.getVoices(); };
