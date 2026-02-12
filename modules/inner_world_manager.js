import { userState } from './storage.js';
import { PERSONA_DB } from './config.js';

/**
 * 里世界管理器 (Inner World Manager)
 * 负责管理数据可视化矩阵，以及与酒馆数据库插件的交互
 */
export const InnerWorldManager = {
    activeTableId: 'dashboard', // 默认展示仪表盘
    
    // 映射外部表格及其用途
    tableMapping: {
        protagonist: ['主角', '玩家', 'Player', 'Protagonist'],
        global: ['系统', '全局', 'System', 'Global', '世界设定'],
        skills: ['技能', '能力', 'Skills', 'Abilities'],
        characters: ['人物', '角色', 'Characters', 'NPC'],
        tasks: ['任务', '进度', 'Tasks', 'Quests']
    },

    /**
     * 获取外部数据库数据
     */
    getExternalDB() {
        const w = window.parent || window;
        const api = w.AutoCardUpdaterAPI || window.AutoCardUpdaterAPI;
        return (api && api.exportTableAsJson) ? api.exportTableAsJson() : null;
    },

    /**
     * 根据关键字查找匹配的表格
     */
    findTableByKeywords(externalData, keywords) {
        if (!externalData) return null;
        for (const id in externalData) {
            const name = externalData[id].name || id;
            if (keywords.some(k => name.includes(k))) {
                return externalData[id];
            }
        }
        return null;
    },

    /**
     * 渲染仪表盘卡片
     */
    renderCard(title, icon, contentHtml, color = 'var(--l-cyan)') {
        return `
            <div class="inner-dashboard-card" style="background:rgba(0,0,0,0.4); border:1px solid rgba(255,255,255,0.05); border-radius:6px; padding:12px; margin-bottom:12px; border-left:3px solid ${color};">
                <div style="display:flex; align-items:center; gap:8px; margin-bottom:8px; color:${color}; font-size:12px; font-weight:bold; text-transform:uppercase;">
                    <i class="${icon}"></i> ${title}
                </div>
                <div class="card-content" style="font-size:11px; color:#ccc;">
                    ${contentHtml}
                </div>
            </div>
        `;
    },

    /**
     * 渲染里世界主容器内容
     */
    render(container, showBubbleMethod, showStatusMethod) {
        if (!container) return;

        const externalData = this.getExternalDB();
        const currentPersona = PERSONA_DB[userState.activePersona || 'toxic'];

        let html = `
            <div class="inner-world-container" style="display:flex; flex-direction:column; height:100%; font-family:var(--l-font); overflow:hidden;">
                <!-- 头部 -->
                <div class="inner-header" style="margin-bottom:12px; border-left:4px solid var(--l-main); padding-left:10px; display:flex; justify-content:space-between; align-items:flex-start;">
                    <div>
                        <h3 style="margin:0; color:var(--l-main); font-size:16px; text-transform:uppercase; letter-spacing:1px;">莉莉丝_核心监控看板</h3>
                        <small style="color:var(--l-cyan); opacity:0.8; font-family: 'Share Tech Mono', monospace;">链路状态: ${externalData ? '同步稳定' : '离线状态'}</small>
                    </div>
                </div>

                <!-- 导航标签 -->
                <div class="inner-table-tabs" style="display:flex; gap:5px; margin-bottom:12px; overflow-x:auto; padding-bottom:5px;">
                    <div class="inner-tab ${this.activeTableId === 'dashboard' ? 'active' : ''}" data-id="dashboard" style="padding:4px 12px; font-size:11px; cursor:pointer; border:1px solid ${this.activeTableId === 'dashboard' ? 'var(--l-main)' : '#333'}; border-radius:4px; white-space:nowrap;">
                        汇总看板
                    </div>
                    ${externalData ? Object.keys(externalData).map(id => `
                        <div class="inner-tab ${this.activeTableId === id ? 'active' : ''}" data-id="${id}" style="padding:4px 12px; font-size:11px; cursor:pointer; border:1px solid ${this.activeTableId === id ? 'var(--l-main)' : '#333'}; border-radius:4px; white-space:nowrap;">
                            ${externalData[id].name || id}
                        </div>
                    `).join('') : ''}
                </div>

                <!-- 内容滚动区 -->
                <div class="inner-scroll-area" style="flex:1; overflow-y:auto; padding-right:5px;">
                    ${this.activeTableId === 'dashboard' ? this.renderDashboard(externalData, currentPersona) : this.renderSingleTable(externalData[this.activeTableId])}
                </div>

                <!-- 底部 -->
                <div class="inner-footer" style="margin-top:10px; padding-top:8px; border-top:1px solid rgba(255,255,255,0.05); display:flex; gap:8px;">
                    <button class="tool-btn" id="inner-refresh-btn" style="flex:1; font-size:10px;">刷新矩阵</button>
                    <button class="tool-btn" id="inner-sync-btn" style="flex:1; font-size:10px; color:var(--l-main); border-color:var(--l-main);">同步同步</button>
                </div>
            </div>
        `;

        container.innerHTML = html;
        this.bindEvents(container, showBubbleMethod, showStatusMethod);
    },

    /**
     * 渲染汇总仪表盘
     */
    renderDashboard(externalData, currentPersona) {
        let sections = [];

        // 1. 主角信息
        const protoTable = this.findTableByKeywords(externalData, this.tableMapping.protagonist);
        if (protoTable && protoTable.content.length > 1) {
            let html = '<div style="display:grid; grid-template-columns: 1fr 1fr; gap:5px;">';
            const headers = protoTable.content[0];
            const data = protoTable.content[1];
            headers.forEach((h, i) => {
                html += `<div><span style="color:#666;">${h}:</span> <span style="color:var(--l-cyan);">${data[i] || '-'}</span></div>`;
            });
            html += '</div>';
            sections.push(this.renderCard('主角属性状态', 'fa-solid fa-user-shield', html, '#00e5ff'));
        }

        // 2. 技能信息
        const skillTable = this.findTableByKeywords(externalData, this.tableMapping.skills);
        if (skillTable && skillTable.content.length > 1) {
            let html = '<div style="display:flex; flex-direction:column; gap:4px;">';
            skillTable.content.slice(1, 5).forEach(row => {
                html += `<div style="background:rgba(255,255,255,0.02); padding:4px 8px; border-radius:3px; display:flex; justify-content:space-between;">
                            <span>${row[0]}</span><span style="color:var(--l-main);">${row[1] || ''}</span>
                         </div>`;
            });
            html += '</div>';
            sections.push(this.renderCard('当前掌握技能', 'fa-solid fa-bolt', html, 'var(--l-main)'));
        }

        // 3. 全局/系统信息
        const globalTable = this.findTableByKeywords(externalData, this.tableMapping.global);
        if (globalTable && globalTable.content.length > 1) {
            let html = '<div style="font-size:10px; line-height:1.4;">';
            globalTable.content.slice(1, 4).forEach(row => {
                html += `<div style="margin-bottom:4px; border-bottom:1px solid rgba(255,255,255,0.03); padding-bottom:2px;">• ${row.join(': ')}</div>`;
            });
            html += '</div>';
            sections.push(this.renderCard('全局/系统参量', 'fa-solid fa-globe', html, 'var(--l-gold)'));
        }

        // 4. 重要人物
        const charTable = this.findTableByKeywords(externalData, this.tableMapping.characters);
        if (charTable && charTable.content.length > 1) {
            let html = '<div style="display:flex; flex-wrap:wrap; gap:5px;">';
            charTable.content.slice(1, 6).forEach(row => {
                html += `<span style="background:rgba(0,0,0,0.3); border:1px solid #444; padding:2px 6px; border-radius:10px; font-size:10px;">${row[0]}</span>`;
            });
            html += '</div>';
            sections.push(this.renderCard('关键人物索引', 'fa-solid fa-users', html, '#a335ee'));
        }

        // 5. 任务进度
        const taskTable = this.findTableByKeywords(externalData, this.tableMapping.tasks);
        if (taskTable && taskTable.content.length > 1) {
            let html = '';
            taskTable.content.slice(1, 4).forEach(row => {
                const status = row[1] || '进行中';
                const isDone = status.includes('完') || status.includes('Done');
                html += `<div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">
                            <i class="fa-solid ${isDone ? 'fa-check-circle' : 'fa-circle-notch'}" style="color:${isDone ? '#0f0' : 'var(--l-gold)'};"></i>
                            <span style="flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${row[0]}</span>
                        </div>`;
            });
            sections.push(this.renderCard('主线/支线任务进度', 'fa-solid fa-list-check', html, '#ff9100'));
        }

        // 兜底显示：如果没有任何外部数据
        if (sections.length === 0) {
            return `
                <div style="padding:30px; text-align:center; color:#555;">
                    <i class="fa-solid fa-triangle-exclamation" style="font-size:24px; margin-bottom:10px;"></i><br>
                    未检测到适配的数据库表格<br>
                    <small>请确保 [酒馆数据库] 中存在名为 "主角"、"技能" 或 "任务" 的表格</small>
                </div>
            `;
        }

        return sections.join('');
    },

    /**
     * 渲染单个表格（详细视图）
     */
    renderSingleTable(table) {
        if (!table || !table.content || table.content.length === 0) return '';
        return `
            <div class="external-table-section" style="animation: matrix-fade-in 0.3s ease;">
                <div style="overflow-x:auto; border:1px solid #333; border-radius:4px;">
                    <table style="width:100%; border-collapse: collapse; font-size:11px; background:rgba(0,0,0,0.3);">
                        <thead style="position:sticky; top:0; background:#111; z-index:1;">
                            <tr style="color:var(--l-cyan);">
                                ${table.content[0].map(col => `<th style="padding:8px; border:1px solid #222; text-align:left;">${col}</th>`).join('')}
                            </tr>
                        </thead>
                        <tbody>
                            ${table.content.slice(1).map(row => `
                                <tr style="border-top:1px solid #222;">
                                    ${row.map(cell => `<td style="padding:8px; border:1px solid #222; color:#ccc;">${cell || '-'}</td>`).join('')}
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    },

    /**
     * 绑定事件
     */
    bindEvents(container, showBubbleMethod, showStatusMethod) {
        container.querySelectorAll('.inner-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                const id = tab.getAttribute('data-id');
                this.activeTableId = id;
                this.render(container, showBubbleMethod, showStatusMethod);
            });
        });

        container.querySelector('#inner-refresh-btn')?.addEventListener('click', () => {
             this.render(container, showBubbleMethod, showStatusMethod);
             showStatusMethod?.("矩阵感知重置完毕", "var(--l-cyan)");
        });

        container.querySelector('#inner-sync-btn')?.addEventListener('click', () => {
             const api = (window.parent || window).AutoCardUpdaterAPI || window.AutoCardUpdaterAPI;
             if (api && api.manualUpdate) {
                api.manualUpdate();
                showBubbleMethod?.("正在重新抓取实体数据...", "var(--l-main)");
                setTimeout(() => {
                    this.render(container, showBubbleMethod, showStatusMethod);
                    showStatusMethod?.("同步成功", "var(--l-main)");
                }, 800);
             }
        });
    }
};