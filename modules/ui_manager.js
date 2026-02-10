// modules/ui_manager.js
import { containerId, avatarId, panelId, bubbleId, PERSONA_DB, AvatarPacks, extensionName } from './config.js';
import { userState, saveState, saveChat, panelChatHistory, updateFavor, updateSanity, getExtensionSettings, saveExtensionSettings } from './storage.js';
import { AudioSys } from './audio.js';
import { createSmartRegExp } from './utils.js';

export const UIManager = {
    assistant: null, // To be set in index.js to avoid circular dependency

    // --- 立绘与外观 ---
    setAvatar(emotionCmd = null) {
        const av = document.getElementById(avatarId);
        if (!av) return;

        if (emotionCmd) { userState.currentFace = emotionCmd; saveState(); }
        const currentEmotionState = userState.currentFace || 'normal';
        const currentPersona = userState.activePersona || 'meme';
        const pack = AvatarPacks[currentPersona] || AvatarPacks['meme'];

        let faceKey = 'normal';
        if (currentEmotionState.includes('angry') || currentEmotionState.includes('S:-')) {
            faceKey = 'angry';
        } else if (currentEmotionState.includes('speechless') || currentEmotionState.includes('...')) {
            faceKey = 'speechless';
        } else if (currentEmotionState.includes('mockery') || currentEmotionState.includes('蠢')) {
            faceKey = 'mockery';
        } else if (currentEmotionState.includes('horny') || currentEmotionState.includes('❤')) {
            faceKey = 'horny';
        } else if (currentEmotionState.includes('happy') || currentEmotionState.includes('F:+')) {
            faceKey = 'happy';
        } else if (currentEmotionState.includes('disgust') || currentEmotionState.includes('恶心') || currentEmotionState.includes('变态')) {
            faceKey = 'disgust';
        } else {
            if (userState.favorability >= 80) faceKey = 'love';
            else faceKey = 'normal';
        }

        let finalUrl = pack[faceKey] || pack['normal'] || AvatarPacks['meme']['normal'];
        av.style.backgroundImage = `url('${finalUrl}')`;
        this.updateAvatarStyle();
    },

    updateAvatarStyle() {
        const av = document.getElementById(avatarId);
        if (!av) return;
        av.style.display = userState.hideAvatar ? 'none' : 'block';
        av.style.width = userState.avatarSize + 'px';
        av.style.height = userState.avatarSize + 'px';
    },

    updateAvatarExpression(reply) {
        if (!reply) return;
        if (reply.includes('❤') || reply.includes('想要') || reply.includes('好热')) this.setAvatar('horny');
        else if (reply.includes('杂鱼') || reply.includes('弱') || reply.includes('笑死')) this.setAvatar('mockery');
        else if (reply.includes('恶心') || reply.includes('变态') || reply.includes('垃圾')) this.setAvatar('disgust');
        else if (reply.includes('[S:-') || reply.includes('滚') || reply.includes('死') || reply.includes('怒')) this.setAvatar('angry');
        else if (reply.includes('...') || reply.includes('……') || reply.includes('无语')) this.setAvatar('speechless');
        else if (reply.includes('[F:+') || reply.includes('哼哼') || reply.includes('不错') || reply.includes('笑')) this.setAvatar('happy');
        else this.setAvatar('normal');
    },

    // --- UI 构造 ---
    initStruct() {
        if (document.getElementById(containerId)) return;
        
        const glitchLayer = document.createElement('div'); 
        glitchLayer.id = 'lilith-glitch-layer'; 
        glitchLayer.className = 'screen-glitch-layer'; 
        document.body.appendChild(glitchLayer);
        
        const wrapper = document.createElement('div'); 
        wrapper.id = containerId; 
        wrapper.style.left = '100px'; 
        wrapper.style.top = '100px';
        
        const avatar = document.createElement('div'); 
        avatar.id = avatarId;
        const ring = document.createElement('div');
        ring.className = 'lilith-avatar-ring';
        avatar.appendChild(ring);
        const verTag = document.createElement('div');
        verTag.className = 'lilith-version-tag';
        verTag.textContent = 'v2.0.0 PRO';
        avatar.appendChild(verTag);
        
        const panel = document.createElement('div'); 
        panel.id = panelId; 
        panel.style.display = 'none';
        
        ['mousedown', 'touchstart', 'click'].forEach(evt => panel.addEventListener(evt, e => e.stopPropagation()));
        
        const muteIcon = AudioSys.muted ? '🔇' : '🔊';
        panel.innerHTML = `
            <div class="lilith-panel-header">
                <span class="lilith-title">莉莉丝 <span style="font-size:10px; color:var(--l-cyan);">v2.0.0 Final</span></span>
                <div style="display:flex; align-items:center; gap:10px;">
                    <span id="lilith-mute-btn" title="语音开关" style="cursor:pointer; font-size:14px;">${muteIcon}</span>
                    <div style="text-align:right; line-height:1;">
                        <div class="stat-row" style="color:#ff0055">好感 <span id="favor-val">${userState.favorability}</span></div>
                        <div class="stat-row" style="color:#00e5ff">理智 <span id="sanity-val">${userState.sanity}</span></div>
                    </div>
                </div>
            </div>
            <div class="scan-line-bg"></div>
            <div class="lilith-tabs">
                <div class="lilith-tab active" data-target="chat">😈 互动</div>
                <div class="lilith-tab" data-target="tools">🔪 功能</div>
                <div class="lilith-tab" data-target="memory" style="color:#bd00ff;">🧠 记忆</div>
                <div class="lilith-tab" data-target="gacha" style="color:var(--l-gold);">🎲 赌狗</div>
                <div class="lilith-tab" data-target="config">⚙️ 设置</div>
            </div>
            <div class="lilith-content-area">
                <div id="page-chat" class="lilith-page active">
                    <div id="lilith-chat-history"></div>
                    <div class="lilith-input-row">
                        <button id="lilith-polish-btn" title="润色">🔞</button>
                        <input type="text" id="lilith-chat-input" placeholder="和${PERSONA_DB[userState.activePersona || 'toxic'].name.split(' ')[1]}说话...">
                        <button id="lilith-chat-send">▶</button>
                    </div>
                </div>
                <div id="page-tools" class="lilith-page">
                    <div class="tools-grid">
                        <button class="tool-btn" id="tool-analyze">🧠 局势嘲讽</button>
                        <button class="tool-btn" id="tool-audit">⚖️ 找茬模式</button>
                        <button class="tool-btn" id="tool-branch" style="grid-column: span 2; border-color:#ffd700;">🔮 恶作剧推演 (我)</button>
                        <button class="tool-btn" id="tool-kink">💖 性癖羞辱</button>
                        <button class="tool-btn" id="tool-event" style="border-color:#ff0055">💥 强制福利事件 (我)</button>
                        <button class="tool-btn" id="tool-hack" style="border-color:#bd00ff;">💉 催眠洗脑 (纯指令)</button>
                        <button class="tool-btn" id="tool-profile" style="border-color:#ff0055;">📋 废物体检报告</button>
                        <button class="tool-btn" id="tool-ghost" style="grid-column: span 2; border-color:#00f3ff;">👻 替你回复 (计费)</button>
                    </div>
                    <div id="tool-output-area"></div>
                </div>
                <div id="page-memory" class="lilith-page">
                    <div style="font-size:12px; color:#888; margin-bottom:10px; border-bottom:1px solid #333; padding-bottom:5px;">
                        这里存放着我们过去的肮脏回忆。<br>
                        <span style="font-size:10px; color:var(--l-cyan);">*每20条对话自动总结归档，旧对话将被压缩。*</span>
                    </div>
                    <div id="memory-container" style="flex:1; overflow-y:auto; display:flex; flex-direction:column; gap:8px;"></div>
                    <button id="btn-force-memory" class="tool-btn" style="width:100%; margin-top:10px; border-color:#bd00ff;">⚡ 强制现在总结记忆</button>
                </div>
                <div id="page-gacha" class="lilith-page">
                    <div class="gacha-header">
                        <span>命运红线 (赌狗区)</span>
                        <div class="fp-display">FP: <span id="gacha-fp-val" class="fp-box">${userState.fatePoints}</span></div>
                    </div>
                    <div style="background:rgba(255,255,255,0.05); padding:8px; margin:5px 0; border:1px dashed #444; display:flex; align-items:center; justify-content:space-between;">
                        <span style="font-size:10px; color:#aaa;">点数作弊:</span>
                        <div style="display:flex; gap:5px;">
                            <input type="number" id="manual-fp-input" value="${userState.fatePoints}" style="background:#000; border:1px solid #333; color:var(--l-gold); width:70px; font-size:12px; text-align:center;">
                            <button id="btn-sync-fp" style="background:#333; color:#fff; border:none; font-size:10px; cursor:pointer; padding:2px 8px;">强制修改</button>
                        </div>
                    </div>
                    <div id="gacha-visual-area" class="gacha-stage">
                        <div style="color:#444; margin-top:50px;">[ 准备好你的灵魂了吗？ ]</div>
                    </div>
                    <div class="inventory-area">
                        <div style="font-size:10px; color:var(--l-cyan);">📦 垃圾堆 (待清理)</div>
                        <div id="gacha-inv-list" class="inventory-list"></div>
                    </div>
                    <div class="gacha-controls">
                        <button id="btn-pull-1" class="tool-btn" style="flex:1;">单抽 (50)</button>
                        <button id="btn-pull-10" class="tool-btn" style="flex:1; border-color:var(--l-gold); color:var(--l-gold);">十连 (500)</button>
                        <button id="btn-claim" class="btn-main" style="flex:1;">打包带走</button>
                    </div>
                </div>

                <div id="page-config" class="lilith-page">
                    <div class="cfg-group">
                        <label style="color:#bd00ff; font-weight:bold;">🎭 人格覆写 (Persona)</label>
                        <select id="cfg-persona-select" class="lilith-select" style="background:#111; color:#fff; border:1px solid #bd00ff;">
                            ${Object.keys(PERSONA_DB).map(k => `<option value="${k}" ${userState.activePersona===k?'selected':''}>${PERSONA_DB[k].name}</option>`).join('')}
                        </select>
                    </div>
                    <div class="cfg-group">
                        <label style="color:#ff0055; font-weight:bold;">💬 吐槽设定 (Interjection)</label>
                        <div style="font-size:10px; color:#888;">吐槽概率: <span id="cfg-freq-val">${userState.commentFrequency || 30}</span>%</div>
                        <input type="range" id="cfg-freq" min="0" max="100" step="5" value="${userState.commentFrequency || 30}" style="accent-color:#ff0055;" oninput="document.getElementById('cfg-freq-val').textContent = this.value">
                        
                        <div style="margin-top:8px;">
                            <label style="font-size:12px; color:#ccc;">插入模式:</label>
                            <select id="cfg-comment-mode" style="background:#111; color:#fff; border:1px solid #444; font-size:12px; height:24px;">
                                <option value="random" ${userState.commentMode === 'random' ? 'selected' : ''}>🤖 AI 自动定位 (智能注入)</option>
                                <option value="bottom" ${userState.commentMode === 'bottom' ? 'selected' : ''}>⬇️ 始终追加在末尾</option>
                                <option value="top" ${userState.commentMode === 'top' ? 'selected' : ''}>⬆️ 始终置于顶端</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="cfg-group">
                        <label style="color:#00f3ff;">🎛️ 语音调校 (TTS)</label>
                        <div style="font-size:10px; color:#888;">音调 (Pitch): <span id="tts-pitch-val">${userState.ttsConfig ? userState.ttsConfig.pitch : 1.2}</span></div>
                        <input type="range" id="tts-pitch" min="0.1" max="2.0" step="0.1" value="${userState.ttsConfig ? userState.ttsConfig.pitch : 1.2}">
                        
                        <div style="font-size:10px; color:#888; margin-top:5px;">语速 (Speed): <span id="tts-rate-val">${userState.ttsConfig ? userState.ttsConfig.rate : 1.3}</span></div>
                        <input type="range" id="tts-rate" min="0.5" max="2.0" step="0.1" value="${userState.ttsConfig ? userState.ttsConfig.rate : 1.3}">
                        
                        <button id="tts-test-btn" style="width:100%; margin-top:5px; background:#333; color:#fff; border:none; padding:3px; cursor:pointer; font-size:10px;">🔊 试听</button>
                    </div>

                    <div class="cfg-group">
                        <label>大脑皮层 (Model)</label>
                        <div style="display:flex; gap:5px;">
                            <input type="text" id="cfg-model" value="${(userState.apiConfig && userState.apiConfig.model) || 'gemini-1.5-flash'}" style="flex:1;">
                            <button id="cfg-get-models" class="tool-btn" style="width:30px;">↻</button>
                        </div>
                        <select id="cfg-model-select" style="display:none; margin-top:5px;"></select>
                    </div>
                    
                    <div class="cfg-group"><label>神经密钥 (API Key)</label><input type="password" id="cfg-key" value="${(userState.apiConfig && userState.apiConfig.apiKey) || ''}"></div>
                    <div class="cfg-group"><label>接口地址 (Endpoint)</label><input type="text" id="cfg-url" value="${(userState.apiConfig && userState.apiConfig.baseUrl) || 'https://generativelanguage.googleapis.com'}"></div>
                    <div class="cfg-group">
                        <label>连接协议</label>
                        <select id="cfg-type">
                            <option value="native" ${(!userState.apiConfig || userState.apiConfig.apiType==='native')?'selected':''}>Google Native</option>
                            <option value="openai" ${(userState.apiConfig && userState.apiConfig.apiType==='openai')?'selected':''}>OpenAI/Proxy</option>
                        </select>
                    </div>
                    
                    <div class="cfg-group" style="border-top:1px dashed #444; margin-top:10px; padding-top:10px;">
                        <label style="color:var(--l-cyan); font-weight:bold; margin-bottom:5px;">外观设定</label>
                        <div style="display:flex; align-items:center; margin-bottom:5px;">
                            <input type="checkbox" id="cfg-hide-avatar" ${userState.hideAvatar ? 'checked' : ''} style="width:auto; margin-right:5px;"> 
                            <span style="font-size:12px; color:#ccc;">隐藏悬浮球 (仅保留面板)</span>
                        </div>
                        <div style="display:flex; align-items:center; gap:10px;">
                            <span style="font-size:12px; color:#ccc; white-space:nowrap;">球体大小: <span id="cfg-size-val">${userState.avatarSize}</span>px</span>
                            <input type="range" id="cfg-avatar-size" min="50" max="300" step="10" value="${userState.avatarSize}" style="flex:1; accent-color:var(--l-main);" oninput="document.getElementById('cfg-size-val').textContent = this.value">
                        </div>
                    </div>

                    <div class="cfg-btns" style="display:flex; gap:5px; margin-top:10px;">
                        <button id="cfg-test" class="tool-btn" style="flex:1; border-color:#00f3ff;">戳一下</button>
                        <button id="cfg-clear-mem" class="tool-btn" style="flex:1; border-color:#ff0055;">格式化我</button>
                        <button id="cfg-save" class="tool-btn" style="flex:1; border-color:#0f0;">记住痛楚</button>
                    </div>
                    <div id="cfg-msg" style="font-size:10px; color:#aaa; margin-top:5px;"></div>
                </div>
            </div>
        `;
        
        wrapper.appendChild(panel);
        wrapper.appendChild(avatar);
        document.body.appendChild(wrapper);

        this.bindInternalEvents();
        this.bindDrag();
        this.updatePos();
    },

    bindInternalEvents() {
        const p = document.getElementById(panelId);
        if (!p) return;

        // Tabs
        p.querySelectorAll('.lilith-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                p.querySelectorAll('.lilith-tab').forEach(t => t.classList.remove('active'));
                p.querySelectorAll('.lilith-page').forEach(pg => pg.classList.remove('active'));
                tab.classList.add('active');
                const target = document.getElementById(`page-${tab.dataset.target}`);
                if (target) {
                    target.classList.add('active');
                    target.scrollTop = 0; 
                }
            });
        });

        // Mute
        const muteBtn = document.getElementById('lilith-mute-btn');
        if (muteBtn) {
            muteBtn.addEventListener('click', () => {
                AudioSys.muted = !AudioSys.muted;
                muteBtn.textContent = AudioSys.muted ? '🔇' : '🔊';
            });
        }
    },

    bindDrag() {
        const wrapper = document.getElementById(containerId);
        const avatar = document.getElementById(avatarId);
        if (!wrapper || !avatar) return;

        let isDragging = false, startX, startY, initialLeft, initialTop;
        
        const onDown = (e) => {
            isDragging = false; 
            startX = e.clientX || e.touches[0].clientX; 
            startY = e.clientY || e.touches[0].clientY;
            const rect = wrapper.getBoundingClientRect(); 
            initialLeft = rect.left; 
            initialTop = rect.top; 
            
            avatar.style.cursor = 'grabbing';
            avatar.style.transition = 'none';

            const onMove = (me) => {
                const cx = me.clientX || (me.touches ? me.touches[0].clientX : 0); 
                const cy = me.clientY || (me.touches ? me.touches[0].clientY : 0);
                
                if (!isDragging && (Math.abs(cx - startX) > 5 || Math.abs(cy - startY) > 5)) {
                    isDragging = true;
                }
                
                if (isDragging) { 
                    let newLeft = initialLeft + (cx - startX);
                    let newTop = initialTop + (cy - startY);
                    
                    // 限制在视口内
                    newLeft = Math.max(0, Math.min(window.innerWidth - wrapper.offsetWidth, newLeft));
                    newTop = Math.max(0, Math.min(window.innerHeight - 50, newTop));

                    wrapper.style.left = newLeft + 'px'; 
                    wrapper.style.top = newTop + 'px'; 
                    this.updatePos(); 
                }
            };

            const onUp = () => {
                document.removeEventListener('mousemove', onMove); 
                document.removeEventListener('mouseup', onUp); 
                document.removeEventListener('touchmove', onMove); 
                document.removeEventListener('touchend', onUp);
                
                avatar.style.cursor = 'move'; 
                avatar.style.transition = '0.4s';
                
                if (!isDragging) {
                    this.togglePanel(); 
                } else {
                    saveState();
                }
                isDragging = false;
            };

            document.addEventListener('mousemove', onMove); 
            document.addEventListener('mouseup', onUp); 
            document.addEventListener('touchmove', onMove, { passive: false }); 
            document.addEventListener('touchend', onUp);
        };

        avatar.addEventListener('mousedown', onDown); 
        avatar.addEventListener('touchstart', (e) => {
            e.preventDefault(); 
            onDown(e);
        }, { passive: false });
    },

    updatePos() {
        const wrapper = document.getElementById(containerId);
        const panel = document.getElementById(panelId);
        if (!wrapper || !panel) return;

        const rect = wrapper.getBoundingClientRect();
        const centerY = rect.top + rect.height / 2;

        if (rect.left + rect.width / 2 < window.innerWidth / 2) {
            wrapper.classList.remove('pos-right');
            wrapper.classList.add('pos-left');
        } else {
            wrapper.classList.remove('pos-left');
            wrapper.classList.add('pos-right');
        }

        if (centerY > window.innerHeight * 0.6) {
            wrapper.classList.add('pos-top-align');
        } else {
            wrapper.classList.remove('pos-top-align');
        }
    },

    bindEvents(assistant) {
        // Chat Logic
        const sendBtn = document.getElementById('lilith-chat-send');
        const input = document.getElementById('lilith-chat-input');
        const doSend = async () => {
            const txt = input.value.trim(); if(!txt) return;
            
            // 1. 发送用户消息
            this.addChatMsg('user', txt); 
            input.value = '';

            // 2. 显示思考中的动画
            const loadingId = 'lilith-loading-' + Date.now();
            const h = document.getElementById('lilith-chat-history');
            const loadingDiv = document.createElement('div');
            loadingDiv.id = loadingId;
            loadingDiv.className = 'msg lilith loading';
            loadingDiv.innerHTML = '<span class="dot">.</span><span class="dot">.</span><span class="dot">.</span>';
            h.appendChild(loadingDiv);
            h.scrollTop = h.scrollHeight;
            
            // 3. 调用 API
            const rawReply = await assistant.callUniversalAPI(window, txt, { isChat: true });
            
            const loader = document.getElementById(loadingId);
            if(loader) loader.remove();

            if (!rawReply) return;

            // --- 使用统一方法添加并解析消息 ---
            this.addChatMsg('lilith', rawReply);

            // --- 触发表情与语音联动 ---
            const { speech } = this.parseLilithMsg(rawReply.replace(/\[[SF]:[+\-]?\d+\]/gi, ''));
            this.updateAvatarExpression(rawReply);
            AudioSys.speak(speech || rawReply);
        };
        sendBtn?.addEventListener('click', doSend);
        input?.addEventListener('keydown', (e) => { if(e.key === 'Enter') { e.stopPropagation(); doSend(); } });

        // Polish
        document.getElementById('lilith-polish-btn')?.addEventListener('click', async () => {
            const raw = input.value.trim(); if(!raw) return;
            input.value = '';
            this.addChatMsg('user', `[魔改] ${raw}`);
            this.addChatMsg('lilith', '✍️ 改写中...', false); // [修复] 改写提示不保存
            const refined = await assistant.callUniversalAPI(window, `[Original]: ${raw}\n[Task]: Rewrite this to be more erotic.`, { isChat: true });
            const h = document.getElementById('lilith-chat-history');
            if(h.lastChild && h.lastChild.textContent.includes('改写中')) h.lastChild.remove();
            this.addChatMsg('lilith', refined || 'Error');
        });

        // Tools
        document.getElementById('tool-analyze')?.addEventListener('click', () => assistant.runTool(window, "局势嘲讽"));
        document.getElementById('tool-audit')?.addEventListener('click', () => assistant.runTool(window, "找茬模式"));
        document.getElementById('tool-branch')?.addEventListener('click', () => assistant.runTool(window, "恶作剧推演"));
        document.getElementById('tool-kink')?.addEventListener('click', () => assistant.runTool(window, "性癖羞辱"));
        document.getElementById('tool-event')?.addEventListener('click', () => assistant.runTool(window, "强制福利事件"));
        document.getElementById('tool-hack')?.addEventListener('click', () => assistant.runTool(window, "催眠洗脑"));
        document.getElementById('tool-profile')?.addEventListener('click', () => assistant.runTool(window, "废物体检报告"));
        document.getElementById('tool-ghost')?.addEventListener('click', () => assistant.runTool(window, "替你回复"));

        // Gacha
        document.getElementById('btn-pull-1')?.addEventListener('click', () => { 
            console.log("Pull 1 Clicked"); 
            assistant.gachaSystem.doPull(window, 1); 
        });
        document.getElementById('btn-pull-10')?.addEventListener('click', () => { 
            console.log("Pull 10 Clicked"); 
            assistant.gachaSystem.doPull(window, 10); 
        });
        document.getElementById('btn-claim')?.addEventListener('click', () => {
             console.log("Claim Clicked");
             assistant.gachaSystem.claimRewards(window);
        });

        document.getElementById('btn-sync-fp')?.addEventListener('click', () => {
             const manualInput = document.getElementById('manual-fp-input');
             if (manualInput) {
                 const newVal = parseInt(manualInput.value);
                 if (!isNaN(newVal)) {
                     this.updateFP(window, newVal);
                     this.showBubble("作弊可耻，但有用。", "#ffd700");
                 }
             }
        });
        
        // Force Memory
        document.getElementById('btn-force-memory')?.addEventListener('click', () => {
            if(confirm("确定要强制压缩当前对话为记忆吗？")) assistant.checkAndSummarize(window, true);
        });

        // Config Page - Floating Panel Logic
        // These events apply to the elements inside the Floating Panel (#page-config)
        const bindSharedConfigEvents = () => {
            // Persona Select
            const personaSelect = document.getElementById('cfg-persona-select');
            if (personaSelect) {
                personaSelect.addEventListener('change', () => {
                    userState.activePersona = personaSelect.value;
                    if (PERSONA_DB[userState.activePersona]) {
                         userState.ttsConfig = { ...PERSONA_DB[userState.activePersona].voice };
                         // Update UI sliders
                         const pSlider = document.getElementById('tts-pitch');
                         const rSlider = document.getElementById('tts-rate');
                         const pVal = document.getElementById('tts-pitch-val');
                         const rVal = document.getElementById('tts-rate-val');
                         if(pSlider) pSlider.value = userState.ttsConfig.pitch;
                         if(rSlider) rSlider.value = userState.ttsConfig.rate;
                         if(pVal) pVal.textContent = userState.ttsConfig.pitch;
                         if(rVal) rVal.textContent = userState.ttsConfig.rate;
                    }
                    saveState();
                    this.updateUI();
                });
            }

            // Buttons - Test
            document.getElementById('cfg-test')?.addEventListener('click', () => {
                assistant.triggerAvatarGlitch();
                AudioSys.speak("别戳了，烦不烦？");
            });

            // Buttons - Clear Mem
            document.getElementById('cfg-clear-mem')?.addEventListener('click', () => {
                if(confirm("警告：这将清除所有长期记忆和好感度数据！")) {
                    userState.memoryArchive = [];
                    userState.favorability = 20;
                    userState.sanity = 80;
                    userState.fatePoints = 1000;
                    
                    // Clear Chat History
                    panelChatHistory.length = 0;
                    saveChat();
                    const chatHistoryDiv = document.getElementById('lilith-chat-history');
                    if (chatHistoryDiv) chatHistoryDiv.innerHTML = '';

                    saveState();
                    this.updateUI();
                    this.renderMemoryUI();
                    alert("记忆核心已格式化。");
                }
            });

            // Buttons - Save
            document.getElementById('cfg-save')?.addEventListener('click', () => {
                 const newConfig = {
                    apiType: document.getElementById('cfg-type')?.value || 'native',
                    baseUrl: document.getElementById('cfg-url')?.value || '',
                    apiKey: document.getElementById('cfg-key')?.value || '',
                    model: document.getElementById('cfg-model')?.value || ''
                 };
                 userState.apiConfig = newConfig;
                 saveState();
                 assistant.config = { ...assistant.config, ...newConfig };
                 this.showBubble("配置已覆盖由神经中枢...", "#0f0");
            });

             // Buttons - Get Models
             document.getElementById('cfg-get-models')?.addEventListener('click', () => assistant.fetchModels());
        };

        bindSharedConfigEvents();

        
        // Switch Persona
        const cfgPersona = document.getElementById('cfg-persona-select');
        if (cfgPersona) {
            cfgPersona.addEventListener('change', () => {
                userState.activePersona = cfgPersona.value; // Sync with userState
                saveState(); // Persist
                this.updateUI(); // Refresh UI (Avatar look, etc)
                // Also sync with the Sidebar settings if open
                const extSelect = document.getElementById('lilith-persona-select');
                if(extSelect) extSelect.value = cfgPersona.value;
            });
        }

        // Change Frequency
        const cfgFreq = document.getElementById('cfg-freq');
        if (cfgFreq) {
            cfgFreq.addEventListener('input', () => {
                const val = parseInt(cfgFreq.value);
                userState.commentFrequency = val;
                const valDisplay = document.getElementById('cfg-freq-val');
                if(valDisplay) valDisplay.textContent = val;
                saveExtensionSettings(); // Sync to storage
            });
        }

        // Comment Mode
        const cfgMode = document.getElementById('cfg-comment-mode');
        if (cfgMode) {
             cfgMode.addEventListener('change', () => {
                  userState.commentMode = cfgMode.value;
                  saveExtensionSettings();
             });
        }

        // --- TTS Settings ---
        const ttsPitch = document.getElementById('tts-pitch');
        if (ttsPitch) {
            ttsPitch.addEventListener('input', () => {
                if (!userState.ttsConfig) userState.ttsConfig = { pitch: 1.0, rate: 1.0 };
                userState.ttsConfig.pitch = parseFloat(ttsPitch.value);
                document.getElementById('tts-pitch-val').textContent = userState.ttsConfig.pitch;
                saveExtensionSettings();
            });
        }
        const ttsRate = document.getElementById('tts-rate');
        if (ttsRate) {
            ttsRate.addEventListener('input', () => {
                if (!userState.ttsConfig) userState.ttsConfig = { pitch: 1.0, rate: 1.0 };
                userState.ttsConfig.rate = parseFloat(ttsRate.value);
                document.getElementById('tts-rate-val').textContent = userState.ttsConfig.rate;
                saveExtensionSettings();
            });
        }
        document.getElementById('tts-test-btn')?.addEventListener('click', () => {
             AudioSys.speak("这就是现在的语音效果。");
        });

        // Change Avatar Size
        const cfgSize = document.getElementById('cfg-avatar-size');
        if (cfgSize) {
            cfgSize.addEventListener('input', () => {
                const val = parseInt(cfgSize.value);
                userState.avatarSize = val;
                const valDisplay = document.getElementById('cfg-size-val');
                if(valDisplay) valDisplay.textContent = val;
                this.updateAvatarStyle();
                saveExtensionSettings();
            });
        }

        // Toggle Hide Avatar
        const cfgHide = document.getElementById('cfg-hide-avatar');
        if (cfgHide) {
            cfgHide.addEventListener('change', () => {
                userState.hideAvatar = cfgHide.checked;
                this.updateAvatarStyle();
                saveExtensionSettings();
            });
        }
        
        // Buttons
        // (Removed duplicate bindings here as they are now handled in bindSharedConfigEvents called above)
        
        // Legacy listener for sidebar settings (keep this if settings.html is loaded elsewhere)
        const personaSelectSidebar = document.getElementById('lilith-persona-select');
        if (personaSelectSidebar) {
            personaSelectSidebar.addEventListener('change', () => {
                userState.activePersona = personaSelectSidebar.value;
                saveState();
                this.updateUI();
            });
        }
    },

    // --- UI 交互 ---
    showBubble(msg, color = null) {
        let b = document.getElementById(bubbleId); if (b) b.remove();
        b = document.createElement('div'); b.id = bubbleId; if (color) b.style.borderColor = color;
        b.innerHTML = `<span style="color:var(--l-cyan)">[莉莉丝]</span> ${msg.length > 200 ? msg.substring(0, 198) + "..." : msg}`;
        if (userState.sanity < 30) b.style.borderColor = '#ff0000';
        b.onclick = () => b.remove();
        const container = document.getElementById(containerId);
        if (container) container.appendChild(b);
        const duration = Math.max(5000, msg.length * 350);
        setTimeout(() => { if (b.parentNode) b.remove(); }, duration);
    },

    togglePanel() {
        const p = document.getElementById(panelId);
        if (!p) return;
        const isOpening = !p.classList.contains('active');
        if (isOpening) {
            p.style.display = 'flex'; // 确保在 DOM 中参与布局
            setTimeout(() => p.classList.add('active'), 10);
            this.updateUI(); 
            this.updatePos();
        } else {
            p.classList.remove('active');
            setTimeout(() => p.style.display = 'none', 300); // 等待动画结束
        }
    },

    updateUI() {
        const elVal = document.getElementById('favor-val');
        const elSan = document.getElementById('sanity-val');
        if (elVal) elVal.textContent = userState.favorability + '%';
        if (elSan) elSan.textContent = userState.sanity + '%';
        this.setAvatar();
        this.updateTheme();
    },

    updateTheme() {
        const wrapper = document.getElementById(containerId);
        if (!wrapper) return;

        // 1. 移除旧主题
        wrapper.classList.remove('theme-toxic', 'theme-wife', 'theme-brat', 'theme-imouto', 'theme-meme');

        // 2. 获取当前人格
        const current = userState.activePersona || 'toxic';

        // 3. 添加新主题
        wrapper.classList.add(`theme-${current}`);
        
        // 4. 输入框提示跟随变化
        const input = document.getElementById('lilith-chat-input');
        if (input && PERSONA_DB[current]) {
            const name = PERSONA_DB[current].name.split(' ')[1] || '莉莉丝';
            input.placeholder = `和${name}说话...`;
        }
    },

    parseLilithMsg(text) {
        let inner = "", status = "", action = "", speech = text;

        const innerMatch = speech.match(/\(💭.*?\)|（💭.*?）|\(Inner.*?\)|（潜意识.*?）/is);
        if (innerMatch) {
            inner = innerMatch[0].replace(/[\(（]💭?|Inner:?|潜意识:?|[\)）]/gi, '').trim();
            speech = speech.replace(innerMatch[0], '');
        }

        const statusMatch = speech.match(/\[🩸.*?\].*?\]|\[Status:.*?\]|\[状态:.*?\]/i);
        if (statusMatch) {
            status = statusMatch[0].replace(/[\[\]]|🩸|Status:|状态:/gi, '').trim();
            speech = speech.replace(statusMatch[0], '');
        }

        const actionMatches = speech.match(/\*.*?\*/g);
        if (actionMatches) {
            action = actionMatches.map(a => a.replace(/\*/g, '')).join(' ');
            speech = speech.replace(/\*.*?\*/g, '');
        }

        speech = speech.trim();

        return { inner, status, action, speech };
    },

    addChatMsg(role, text, save = true) {
        const div = document.getElementById('lilith-chat-history');
        if (!div) return;

        // 1. 如果是 lilith，先处理数值变动
        let displayTagName = text;
        if (role === 'lilith') {
            const sMatch = text.match(/\[S:([+\-]?\d+)\]/i);
            const fMatch = text.match(/\[F:([+\-]?\d+)\]/i);
            
            if (sMatch) {
                const val = parseInt(sMatch[1]);
                updateSanity(val);
                if (save && val !== 0) this.showBubble(`理智 ${val > 0 ? '+' : ''}${val}`, "#00e5ff");
            }
            if (fMatch) {
                const val = parseInt(fMatch[1]);
                updateFavor(val);
                if (save && val !== 0) this.showBubble(`好感 ${val > 0 ? '+' : ''}${val}`, "#ff0055");
            }
            // 清理数值标签用于显示和解析
            displayTagName = text.replace(/\[[SF]:[+\-]?\d+\]/gi, '').trim();
        }

        const msgNode = document.createElement('div');
        msgNode.className = `msg ${role}`;
        
        if (role === 'lilith') {
            const { inner, status, action, speech } = this.parseLilithMsg(displayTagName);
            if (inner || status || (action && action.length > 0)) {
                msgNode.className += ' complex-msg';
                let html = '';
                if (status) html += `<div class="l-status-bar">🩸 ${status}</div>`;
                if (inner) html += `<div class="l-inner-thought">💭 ${inner}</div>`;
                if (action) html += `<div class="l-action-text">* ${action} *</div>`;
                if (speech || (!inner && !action)) {
                    html += `<div class="l-speech-text">${speech || displayTagName}</div>`;
                }
                msgNode.innerHTML = html;
            } else {
                msgNode.textContent = displayTagName;
            }
        } else {
            msgNode.textContent = text;
        }

        div.appendChild(msgNode);
        div.scrollTop = div.scrollHeight;

        if (save) {
            panelChatHistory.push({ role: role, content: text });
            saveChat();
        }
    },

    async initSettingsUI() {
        try {
            const htmlPath = `/scripts/extensions/third-party/${extensionName}/settings.html`;
            const settingsHtml = await $.get(htmlPath);
            $('#extensions_settings').append(settingsHtml);

            // 绑定数据
            const $freq = $('#lilith-comment-frequency');
            const $freqVal = $('#lilith-freq-value');
            const $mode = $('#lilith-comment-mode');
            const $hideAvatar = $('#lilith-hide-avatar');
            const $avatarSize = $('#lilith-avatar-size');

            $freq.val(userState.commentFrequency || 0);
            $freqVal.text(`${userState.commentFrequency || 0}%`);
            $mode.val(userState.commentMode || 'random');
            $hideAvatar.prop('checked', userState.hideAvatar);
            $avatarSize.val(userState.avatarSize || 150);

            // [新增] 正文提取 UI 绑定
            const $extractEnable = $('#lilith-extraction-enabled');
            const $extractRegex = $('#lilith-extraction-regex');

            // [新增] 文字替换 UI 绑定
            const $replEnable = $('#lilith-text-replacement-enabled');
            const $replRegex = $('#lilith-text-replacement-regex');
            const $replString = $('#lilith-text-replacement-string');

            $extractEnable.prop('checked', userState.extractionEnabled);
            $extractRegex.val(userState.extractionRegex);

            $replEnable.prop('checked', userState.textReplacementEnabled);
            $replRegex.val(userState.textReplacementRegex);
            $replString.val(userState.textReplacementString);

            $extractEnable.on('change', (e) => {
                userState.extractionEnabled = $(e.target).prop('checked');
                saveExtensionSettings();
            });

            $extractRegex.on('change', (e) => {
                userState.extractionRegex = $(e.target).val();
                saveExtensionSettings();
            });

            $replEnable.on('change', (e) => {
                userState.textReplacementEnabled = $(e.target).prop('checked');
                saveExtensionSettings();
            });
            
            $replRegex.on('change', (e) => {
                userState.textReplacementRegex = $(e.target).val();
                saveExtensionSettings();
            });
            
            $replString.on('change', (e) => {
                userState.textReplacementString = $(e.target).val();
                saveExtensionSettings();
            });

            $('#lilith-extraction-test-btn').on('click', () => {
                const input = $('#lilith-extraction-test-input').val();
                const extractRegexStr = $extractRegex.val();
                const replRegexStr = $replRegex.val();
                const replStr = $replString.val();
                
                const useExtract = $extractEnable.prop('checked');
                const useRepl = $replEnable.prop('checked');

                let result = input;
                let log = [];

                // 1. Extraction Test
                if (useExtract && extractRegexStr) {
                    try {
                        const pattern = createSmartRegExp(extractRegexStr, 's');
                        const match = pattern.exec(result);
                        if (match) {
                            result = match[1] !== undefined ? match[1] : match[0];
                            log.push("Extraction: OK");
                        } else {
                            log.push("Extraction: No Match");
                        }
                    } catch (err) {
                        log.push("Extraction Error: " + err.message);
                    }
                }

                // 2. Replacement Test
                if (useRepl && replRegexStr) {
                    try {
                        const pattern = createSmartRegExp(replRegexStr, 'g');
                        const before = result;
                        result = result.replace(pattern, replStr || "");
                        if (result !== before) {
                             log.push("Replace: OK");
                        } else {
                             log.push("Replace: No Match");
                        }
                    } catch (err) {
                        log.push("Replace Error: " + err.message);
                    }
                }

                const $display = $('#lilith-extraction-test-result');
                $display.text(`[Logs: ${log.join(' | ')}]\n---\n${result}`);
                
                // Visual feedback
                $display.css('color', '#aaffaa');
                setTimeout(() => $display.css('color', 'var(--SmartThemeBodyColor)'), 500);
            });

            // 绑定事件
            $freq.on('input', (e) => {
                const val = parseInt($(e.target).val());
                userState.commentFrequency = val;
                $freqVal.text(`${val}%`);
                
                // [Sync] Update Floating Panel
                const cfgFreq = document.getElementById('cfg-freq');
                const cfgFreqVal = document.getElementById('cfg-freq-val');
                if(cfgFreq) cfgFreq.value = val;
                if(cfgFreqVal) cfgFreqVal.textContent = val;

                saveExtensionSettings();
            });

            $mode.on('change', (e) => {
                userState.commentMode = $(e.target).val();
                
                // [Sync] Update Floating Panel
                const cfgMode = document.getElementById('cfg-comment-mode');
                if(cfgMode) cfgMode.value = userState.commentMode;

                saveExtensionSettings();
            });

            $hideAvatar.on('change', (e) => {
                userState.hideAvatar = $(e.target).prop('checked');
                this.setAvatar();
                this.updateAvatarStyle();
                
                // [Sync] Update Floating Panel
                const cfgHide = document.getElementById('cfg-hide-avatar');
                if(cfgHide) cfgHide.checked = userState.hideAvatar;

                saveExtensionSettings();
            });

            $avatarSize.on('input', (e) => { 
                userState.avatarSize = parseInt($(e.target).val());
                this.updateAvatarStyle();
                
                // [Sync] Update Floating Panel
                const cfgSize = document.getElementById('cfg-avatar-size');
                const cfgSizeVal = document.getElementById('cfg-size-val');
                if(cfgSize) cfgSize.value = userState.avatarSize;
                if(cfgSizeVal) cfgSizeVal.textContent = userState.avatarSize;

                saveExtensionSettings();
            });

            $('#lilith-toggle-panel').on('click', () => {
                this.togglePanel();
            });

            $('#lilith-reset-state').on('click', () => {
                if (confirm('确定要重置莉莉丝的状态吗？这会清空好感度与记忆。')) {
                    userState.favorability = 20;
                    userState.sanity = 80;
                    userState.fatePoints = 1000;
                    userState.gachaInventory = [];
                    this.updateUI();
                    saveExtensionSettings();
                    alert('状态已重置');
                }
            });

            console.log('[Lilith] Settings UI initialized');
        } catch (err) {
            console.error('[Lilith] Failed to load settings UI:', err);
        }
    },

    restoreChatHistory(panelChatHistory) {
        const div = document.getElementById('lilith-chat-history');
        if (!div) return;
        div.innerHTML = '';
        if (!Array.isArray(panelChatHistory)) return;

        // [优化] 去重逻辑：如果检测到连续两条内容一模一样的，只渲染第一条
        let lastText = "";
        panelChatHistory.forEach(msg => {
            const content = msg.content || msg.text || '';
            const clean = content.replace(/\[[SF]:[+\-]?\d+\]/g, '').trim();
            if (clean && clean !== lastText) {
                this.addChatMsg(msg.role === 'lilith' || msg.role === 'assistant' ? 'lilith' : 'user', clean, false);
                lastText = clean;
            }
        });
        div.scrollTop = div.scrollHeight;
    },

    renderMemoryUI() {
        const container = document.getElementById('memory-container');
        if (!container) return;
        container.innerHTML = '';
        if (userState.memoryArchive.length === 0) {
            container.innerHTML = '<div style="text-align:center; margin-top:50px; color:#444;">[ 还没有产生值得铭记的回忆 ]</div>';
            return;
        }
        [...userState.memoryArchive].reverse().forEach((mem, idx) => {
            const card = document.createElement('div');
            card.style.cssText = 'background:rgba(255,255,255,0.05); padding:10px; border-left:3px solid #bd00ff; font-size:11px; color:#ccc; line-height:1.4;';
            card.innerHTML = `<div style="color:#bd00ff; font-weight:bold; margin-bottom:4px;">🔑 记忆碎片 #${userState.memoryArchive.length - idx}</div><div>${mem}</div>`;
            container.appendChild(card);
        });
    },

    updateFP(parentWin, newVal) {
        userState.fatePoints = newVal;
        saveState();
        const fpEl = document.getElementById('gacha-fp-val');
        if (fpEl) {
            fpEl.textContent = userState.fatePoints;
            fpEl.style.color = '#00ff00';
            setTimeout(() => { fpEl.style.color = 'var(--l-gold)'; }, 800);
        }
    },

    // --- 消息美化 (Formatting) ---
    applyLilithFormatting(element) {
        if (!element) return;
        const $el = $(element);
        const mesText = $el.find('.mes_text').length ? $el.find('.mes_text') : ($el.hasClass('mes_text') ? $el : null);
        if (!mesText || mesText.length === 0) return;
        if (mesText.find('.lilith-chat-ui-wrapper').length > 0) return;

        let hasModified = false;
        let commentText = null;
        let insertAfterNode = null;

        const walk = (node) => {
            if (!node || commentText !== null) return;
            const children = Array.from(node.childNodes);
            for (const child of children) {
                if (commentText !== null) break;
                if (child.nodeType === 3) {
                    const text = child.nodeValue;
                    const marker = '[莉莉丝]';
                    if (text && text.includes(marker)) {
                        const idx = text.indexOf(marker);
                        const before = text.slice(0, idx);
                        const after = text.slice(idx + marker.length);
                        child.nodeValue = before;
                        let collected = after;
                        let next = child.nextSibling;
                        while (next) {
                            let nextToProcess = next.nextSibling;
                            if (next.nodeType === 3) collected += next.nodeValue;
                            else if (next.nodeType === 1) {
                                if (next.tagName === 'BR') collected += '\n';
                                else collected += next.innerText || next.textContent;
                            }
                            next.remove();
                            next = nextToProcess;
                        }
                        commentText = collected.trim();
                        insertAfterNode = child;
                        hasModified = true;
                    }
                } else if (child.nodeType === 1) {
                    if (!child.classList.contains('lilith-chat-ui-wrapper') && !['SCRIPT', 'STYLE', 'TEXTAREA', 'INPUT'].includes(child.tagName)) walk(child);
                }
            }
        };
        walk(mesText[0]);

        if (hasModified && commentText) {
            // --- 使用复用的解析逻辑 ---
            const { inner, status, action, speech } = this.parseLilithMsg(commentText);

            // 构建新版 UI
            const currentPersona = userState.activePersona || 'toxic';
            const pack = AvatarPacks[currentPersona] || AvatarPacks['meme'];
            
            // 简单的表情选择逻辑 (基于 speech)
            let faceKey = 'normal';
            if (speech.includes('❤') || speech.includes('想要')) faceKey = 'horny';
            else if (speech.includes('杂鱼') || speech.includes('弱')) faceKey = 'mockery';
            else if (speech.includes('不') || speech.includes('哼')) faceKey = 'angry';
            
            const avatarUrl = pack[faceKey] || pack['normal'];

            let html = '<div class="lilith-chat-ui-wrapper"><div class="lilith-chat-ui">';
            if (status) html += `<div class="l-status-bar">🩸 ${status}</div>`;
            if (inner) html += `<div class="l-inner-thought">💭 ${inner}</div>`;
            if (action) html += `<div class="l-action-text">* ${action} *</div>`;
            
            html += `<div class="l-speech-wrapper">
                        <div class="lilith-chat-avatar" style="background-image: url('${avatarUrl}')"></div>
                        <div class="l-speech-text">${speech || commentText}</div>
                     </div>`;
            html += '</div></div>';

            if (insertAfterNode) $(insertAfterNode).after(html);
            else mesText.append(html);
        }
    }
};
