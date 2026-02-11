/**
 * Update Manager for Lilith Assistant
 * Checks for updates from GitHub and notifies the user in the ST sidebar.
 */

export const UpdateManager = {
    // Current version - detected from manifest.json on init
    localVersion: "2.5.9",
    // Remote manifest URL
    remoteUrl: "https://raw.githubusercontent.com/wt7141789/lilith-assistant/main/manifest.json",
    
    // State
    hasUpdate: false,
    remoteVersion: null,
    initialized: false,

    /**
     * Initialize the UpdateManager by fetching the local manifest version.
     */
    async init() {
        if (this.initialized) return;
        try {
            // Attempt to get version from local manifest.json
            // We use relative path from this module (modules/update_manager.js -> ../manifest.json)
            const modulePath = import.meta.url;
            const manifestPath = new URL('../manifest.json', modulePath).href;
            
            const response = await fetch(manifestPath + '?t=' + Date.now());
            if (response.ok) {
                const data = await response.json();
                if (data.version) {
                    this.localVersion = data.version;
                    console.log(`[Lilith] Detected local version: ${this.localVersion}`);
                }
            }
        } catch (e) {
            console.warn('[Lilith] Failed to auto-detect local version, using fallback:', e);
        }
        this.initialized = true;
    },

    /**
     * Check for updates on startup
     */
    async checkUpdate() {
        if (!this.initialized) await this.init();
        
        console.log('[Lilith] Checking for updates...');
        try {
            // Add timestamp to prevent cache
            const response = await fetch(`${this.remoteUrl}?t=${Date.now()}`);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            
            const remoteManifest = await response.json();
            this.remoteVersion = remoteManifest.version;

            if (this.isNewer(this.remoteVersion, this.localVersion)) {
                this.hasUpdate = true;
                console.log(`[Lilith] Update found! Remote: ${this.remoteVersion}, Local: ${this.localVersion}`);
                this.showUpdateBadge();
                
                // [新增] 发现更新时自动推送通知
                if (typeof toastr !== 'undefined') {
                    toastr.info(`莉莉丝助手发现新版本 v${this.remoteVersion}，请前往设置或侧边栏点击更新。`, '更新推送', {
                        onclick: () => {
                            // Optionally open settings or just update directly if clicked
                            // For now just a notification is enough to count as "push"
                        }
                    });
                }
            } else {
                this.hasUpdate = false;
                console.log('[Lilith] Up to date.');
            }
        } catch (e) {
            console.warn('[Lilith] Update check failed (likely offline or GitHub rate limit):', e.message);
        }
    },

    /**
     * Simple semantic version comparison
     */
    isNewer(remote, local) {
        const rParts = remote.split('.').map(v => parseInt(v) || 0);
        const lParts = local.split('.').map(v => parseInt(v) || 0);
        
        for (let i = 0; i < Math.max(rParts.length, lParts.length); i++) {
            const r = rParts[i] || 0;
            const l = lParts[i] || 0;
            if (r > l) return true;
            if (r < l) return false;
        }
        return false;
    },

    /**
     * Perform update and force refresh the webpage
     */
    async updateAndReload() {
        console.log('[Lilith] Starting update and reload...');
        const originalVersion = this.localVersion;
        const targetVersion = this.remoteVersion;

        try {
            const context = typeof SillyTavern !== 'undefined' ? SillyTavern.getContext() : null;
            const executeCmd = (context && context.executeSlashCommands) || window.executeSlashCommands;

            if (typeof executeCmd === 'function') {
                // 尝试多个可能的命令，确保兼容性
                // /extensions-update 是目前最标准插件更新命令
                await executeCmd('/extensions-update lilith-assistant');
                
                let toastId = null;
                if (typeof toastr !== 'undefined') {
                    toastId = toastr.info('正在请求云端同步 (第 0s)...', '莉莉丝助手', { timeOut: 0, extendedTimeOut: 0 });
                }
                
                // 轮询检测本地版本号是否已更新
                let attempts = 0;
                const maxAttempts = 60; 
                const modulePath = import.meta.url;
                const manifestPath = new URL('../manifest.json', modulePath).href;

                const checkInterval = setInterval(async () => {
                    attempts++;
                    
                    // 每 15 秒重新尝试发送一次更新指令，防止第一次指令丢失或失败
                    if (attempts % 15 === 0) {
                        executeCmd('/extensions-update lilith-assistant');
                    }

                    // 更新通知状态
                    if (toastId && typeof toastr !== 'undefined') {
                        jQuery(toastId).find('.toast-message').text(`正在同步云端代码 (检测中 ${attempts}s)...`);
                    }

                    try {
                        const response = await fetch(`${manifestPath}?t=${Date.now()}_${Math.random()}`);
                        if (response.ok) {
                            const data = await response.json();
                            const currentLocalVersion = data.version;

                            // 判定逻辑：版本号达到目标，或者版本号发生了变更
                            if (currentLocalVersion === targetVersion || (originalVersion && currentLocalVersion !== originalVersion)) {
                                clearInterval(checkInterval);
                                console.log(`[Lilith] Update confirmed: ${originalVersion} -> ${currentLocalVersion}. Reloading...`);
                                if (typeof toastr !== 'undefined') {
                                    toastr.success(`更新成功！即将刷新网页 (v${currentLocalVersion})`, '莉莉丝助手');
                                }
                                setTimeout(() => window.location.reload(), 1500);
                            }
                        }
                    } catch (e) {
                        console.warn('[Lilith] Polling update check failed:', e);
                    }

                    if (attempts >= maxAttempts) {
                        clearInterval(checkInterval);
                        console.error('[Lilith] Update poll timed out.');
                        if (typeof toastr !== 'undefined') {
                            toastr.warning('同步超时。请检查网络或手动在 Git 仓库运行 git pull，然后刷新页面。', '超时提醒', { timeOut: 10000 });
                        }
                    }
                }, 1000);
            } else {
                console.warn('[Lilith] executeSlashCommands not found, falling back to simple reload.');
                window.location.reload();
            }
        } catch (err) {
            console.error('[Lilith] Update/Reload failed:', err);
            window.location.reload();
        }
    },

    /**
     * Inject "New!" badge into the ST settings sidebar
     */
    showUpdateBadge() {
        // Use a poll to wait for the settings HTML to be injected by UIManager
        const maxAttempts = 20;
        let attempts = 0;
        
        const poll = setInterval(() => {
            attempts++;
            const $header = jQuery('#lilith-assistant-settings .inline-drawer-header b');
            
            if ($header.length) {
                // Avoid duplicate badges
                if (!$header.find('.lilith-update-badge').length) {
                    const $badge = jQuery('<span class="lilith-update-badge" style="background:#ff0055; color:#fff; font-size:10px; padding:2px 6px; border-radius:3px; margin-left:5px; vertical-align: middle; box-shadow: 0 0 5px #ff0055; cursor:pointer; font-weight:bold; transition: transform 0.2s;" title="点击执行插件更新">更新!</span>');
                    
                    // Add click handler for auto-refresh update
                    $badge.on('click', async (e) => {
                        e.stopPropagation(); // Prevents folding the drawer
                        $badge.text('更新中...').css('background', '#555');
                        await UpdateManager.updateAndReload();
                    });

                    // Hover effect
                    $badge.on('mouseenter', () => $badge.css('transform', 'scale(1.1)'));
                    $badge.on('mouseleave', () => $badge.css('transform', 'scale(1.0)'));
                    
                    $header.append($badge);
                }
                clearInterval(poll);
            }
            
            if (attempts >= maxAttempts) {
                clearInterval(poll);
                console.log('[Lilith] Update UI injection timed out (Sidebar might not be open).');
            }
        }, 1000);
    }
};
