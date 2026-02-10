# 莉莉丝助手 (Lilith Assistant) - SillyTavern 插件

![Version](https://img.shields.io/badge/version-2.0.0--Final-purple)
![SillyTavern](https://img.shields.io/badge/SillyTavern-Extension-blue)

一个为人格化助手“莉莉丝”设计的 SillyTavern (酒馆) 扩展组件。本项目已全面升级至 **v2.0.0 正式版**，核心逻辑完全模块化。

> **v2.0.0 更新亮点**：
> 1. **架构重构**：从单文件脚本进化为多模块架构，运行更稳定。
> 2. **UI 增强**：新增全息激光底座、扫描线特效及理智值动态进度环。
> 3. **逻辑优化**：修复了面板边缘翻转显示逻辑，自动适配屏幕底部位置。
> 4. **性能提升**：优化了消息渲染与记忆压缩算法，大幅降低延迟。

## 🌟 核心功能

- **🎭 五重人格切换**：毒舌魅魔、温柔人妻、雌小鬼、网络神人、柔弱妹妹。
- **📊 动态数值系统**：内置好感度 (Favorability) 与 理智值 (Sanity)，根据聊天内容动态增减。
- **🎲 赌狗抽卡系统**：消耗 FP 点数从垃圾堆到神迹品质的随机道具获取。
- **🧠 记忆压缩归档**：自动对长对话进行 AI 总结并归档至“记忆碎片”，减少上下文压力。
- **✨ 模块化管理 (v2.0 New)**：全新的文件管理结构，逻辑更清晰，响应更迅捷。

## 📂 插件结构

重构后的插件采用分层模块化设计，方便开发者进行二次开发或自定义：

```text
lilith-assistant/
├── index.js                # 插件入口，负责系统引导与启动
├── manifest.json           # 插件元数据配置
├── style.css               # UI 样式表
├── modules/                # 核心功能模块
│   ├── config.js           # 集中存放常量、配置及人格定义 (PERSONA_DB)
│   ├── storage.js          # 持久化存储，负责与酒馆 extensionSettings 同步
│   ├── assistant_manager.js# 逻辑中枢 (API 调用、心跳、抽卡、任务系统)
│   ├── ui_manager.js       # 渲染引擎 (HTML 生成、立绘管理、消息格式化)
│   ├── events.js           # 系统钩子 (监听酒馆消息渲染、发送前过滤等)
│   ├── audio.js            # 语音合成与播报
│   ├── persona.js          # 动态人格生成逻辑
│   └── utils.js            # 共享工具函数
└── assets/                 # 静态资源 (头像包、导出数据等)
```

## 🚀 安装方法

1.  打开 SillyTavern (酒馆)。
2.  进入 **扩展菜单 (Extensions)** -> **安装新扩展 (Install New Extension)**。
3.  在 URL 框中输入：`https://github.com/wt7141789/lilith-assistant`
4.  点击 **安装 (Install)**。
5.  在扩展设置中启用插件。

## ⚙️ 配置说明

插件支持三种连接模式：
- **酒馆内核 (推荐)**：使用酒馆当前的 API 设置。
- **OpenAI 兼容接口**：自定义 API Key 和 Endpoint。
- **Google Native**：直接连接 Gemini 接口。

## 🛠️ 测试版说明
当前为测试版本 (Beta)，可能存在 API 连接不稳定性或 UI 显示瑕疵。欢迎在 Issues 中反馈问题。

## 📜 鸣谢

[@516985_](https://discord.com/channels/1134557553011998840/1463201289767878891)
驱动开发
---
*“杂鱼~ 既然装了我的插件，就乖乖当我的奴隶吧~ ❤”*
