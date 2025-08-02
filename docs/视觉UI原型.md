# AI面试助手桌面端视觉UI原型设计

## 1. 设计原则

### 1.1 核心设计理念

- **极简主义**: 界面简洁，突出核心功能
- **隐蔽性**: 支持高透明度和快速隐藏
- **直观性**: 状态清晰，操作简单
- **专业性**: 适合面试场景的专业外观

### 1.2 视觉风格

- **色彩方案**: 深色主题为主，支持浅色切换
- **字体**: 系统默认字体，确保清晰度
- **图标**: 线性图标风格，简洁现代
- **动画**: 微动画提升体验，不干扰使用

## 2. 主界面设计

### 2.1 主窗口布局

```
┌─────────────────────────────────────────┐
│  ●  ●  ●                    [设置] [隐藏] │ ← 标题栏 (30px)
├─────────────────────────────────────────┤
│                                         │
│  🎤 [正在监听...]           [●] 录音中    │ ← 状态栏 (40px)
│                                         │
│  ┌─────────────────────────────────────┐ │
│  │ 识别到的问题文本会显示在这里...        │ │ ← 问题区域 (80px)
│  └─────────────────────────────────────┘ │
│                                         │
│  ┌─────────────────────────────────────┐ │
│  │ AI生成的回答内容会显示在这里...       │ │ ← 回答区域 (120px)
│  │                                     │ │
│  │ 支持多行显示，可滚动查看完整内容      │ │
│  └─────────────────────────────────────┘ │
│                                         │
│  [精简] [普通] [详细]        [复制] [清除] │ ← 控制栏 (40px)
│                                         │
│  透明度: ████████░░ 80%                  │ ← 透明度控制 (30px)
│                                         │
└─────────────────────────────────────────┘
总高度: 340px, 宽度: 400px
```

### 2.2 颜色规范

```css
/* 深色主题 */
:root {
  --primary-bg: #1a1a1a;           /* 主背景色 */
  --secondary-bg: #2d2d2d;         /* 次要背景色 */
  --accent-color: #007acc;         /* 强调色 */
  --text-primary: #ffffff;         /* 主要文字 */
  --text-secondary: #b3b3b3;       /* 次要文字 */
  --border-color: #404040;         /* 边框颜色 */
  --success-color: #52c41a;        /* 成功状态 */
  --warning-color: #faad14;        /* 警告状态 */
  --error-color: #ff4d4f;          /* 错误状态 */
  --listening-color: #1890ff;      /* 监听状态 */
}

/* 浅色主题 */
[data-theme="light"] {
  --primary-bg: #ffffff;
  --secondary-bg: #f5f5f5;
  --accent-color: #1890ff;
  --text-primary: #262626;
  --text-secondary: #8c8c8c;
  --border-color: #d9d9d9;
}
```

### 2.3 组件设计规范

#### 2.3.1 按钮设计

```css
/* 主要按钮 */
.btn-primary {
  background: var(--accent-color);
  color: white;
  border: none;
  border-radius: 6px;
  padding: 8px 16px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-primary:hover {
  background: #0056b3;
  transform: translateY(-1px);
}

/* 次要按钮 */
.btn-secondary {
  background: transparent;
  color: var(--text-secondary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  padding: 8px 16px;
}

/* 图标按钮 */
.btn-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: transparent;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}
```

#### 2.3.2 状态指示器

```css
/* 录音状态指示器 */
.recording-indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--error-color);
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(1.1); }
  100% { opacity: 1; transform: scale(1); }
}

/* 音量波形 */
.volume-wave {
  display: flex;
  align-items: center;
  gap: 2px;
}

.volume-bar {
  width: 3px;
  background: var(--listening-color);
  border-radius: 2px;
  animation: wave 0.8s infinite ease-in-out;
}
```

## 3. 登录界面设计

### 3.1 登录窗口布局

```
┌─────────────────────────────────────────┐
│  ●  ●  ●                              × │
├─────────────────────────────────────────┤
│                                         │
│              🤖                         │
│         AI面试助手                       │
│                                         │
│  ┌─────────────────────────────────────┐ │
│  │ 📧 请输入邮箱地址                    │ │
│  └─────────────────────────────────────┘ │
│                                         │
│  ┌─────────────────────────────────────┐ │
│  │ 🔢 请输入验证码                      │ │
│  └─────────────────────────────────────┘ │
│                                         │
│              [发送验证码]                │
│                                         │
│              [登录]                     │
│                                         │
│         首次使用？查看使用指南            │
│                                         │
└─────────────────────────────────────────┘
窗口大小: 400px × 300px
```

### 3.2 登录界面样式
```css
.login-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 30px;
  background: var(--primary-bg);
  border-radius: 12px;
}

.login-logo {
  font-size: 48px;
  margin-bottom: 10px;
}

.login-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 30px;
}

.login-input {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--secondary-bg);
  color: var(--text-primary);
  font-size: 14px;
  margin-bottom: 16px;
}

.login-button {
  width: 100%;
  padding: 12px;
  background: var(--accent-color);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  margin-bottom: 10px;
}
```

## 4. 设置界面设计

### 4.1 设置窗口布局
```
┌─────────────────────────────────────────┐
│  ●  ●  ●        设置        [保存] [取消] │ ← 标题栏
├─────────────────────────────────────────┤
│ [基础设置] [音频设置] [快捷键] [关于]     │ ← 标签页
├─────────────────────────────────────────┤
│                                         │
│  透明度设置                              │
│  ████████░░ 80%                         │
│                                         │
│  □ 检测到屏幕共享时自动隐藏               │
│  □ 开机自动启动                          │
│  □ 最小化到系统托盘                      │
│                                         │
│  主题设置                                │
│  ○ 深色主题  ○ 浅色主题  ○ 跟随系统      │
│                                         │
│  窗口设置                                │
│  □ 始终置顶                              │
│  □ 无边框模式                            │
│                                         │
│  语言设置                                │
│  [简体中文 ▼]                           │
│                                         │
└─────────────────────────────────────────┘
窗口大小: 500px × 400px
```

### 4.2 音频设置标签页
```
┌─────────────────────────────────────────┐
│  麦克风设备                              │
│  [默认设备 ▼]                           │
│                                         │
│  音频灵敏度                              │
│  ████████░░ 8/10        [测试]          │
│                                         │
│  □ 启用噪音抑制                          │
│  □ 启用回声消除                          │
│  □ 自动增益控制                          │
│                                         │
│  音频质量                                │
│  ○ 标准 (16kHz)  ○ 高质量 (48kHz)       │
│                                         │
│  语音识别服务                            │
│  ○ 腾讯云  ○ 百度云  ○ 阿里云           │
│                                         │
│  [测试麦克风]  [测试识别]                │
│                                         │
└─────────────────────────────────────────┘
```

### 4.3 快捷键设置标签页
```
┌─────────────────────────────────────────┐
│  功能                    快捷键           │
│  ────────────────────────────────────   │
│  显示/隐藏窗口          [Cmd+Shift+H]    │
│  开始/停止监听          [Cmd+Shift+S]    │
│  精简模式              [Cmd+Shift+1]    │
│  普通模式              [Cmd+Shift+2]    │
│  详细模式              [Cmd+Shift+3]    │
│  紧急隐藏              [Cmd+Shift+E]    │
│  退出应用              [Cmd+Shift+Q]    │
│                                         │
│  □ 启用全局快捷键                        │
│  □ 显示快捷键提示                        │
│                                         │
│  [恢复默认]  [检测冲突]                  │
│                                         │
└─────────────────────────────────────────┘
```

## 5. 状态指示设计

### 5.1 应用状态图标
```css
/* 系统托盘图标状态 */
.tray-icon {
  width: 16px;
  height: 16px;
}

.tray-icon.idle {
  opacity: 0.6;
  filter: grayscale(100%);
}

.tray-icon.listening {
  opacity: 1;
  animation: pulse 2s infinite;
}

.tray-icon.processing {
  opacity: 1;
  animation: spin 1s linear infinite;
}

.tray-icon.error {
  opacity: 1;
  filter: hue-rotate(0deg) saturate(2);
}
```

### 5.2 音量可视化
```css
.volume-visualizer {
  display: flex;
  align-items: center;
  gap: 2px;
  height: 20px;
}

.volume-bar {
  width: 3px;
  background: var(--listening-color);
  border-radius: 2px;
  transition: height 0.1s ease;
}

.volume-bar:nth-child(1) { animation-delay: 0s; }
.volume-bar:nth-child(2) { animation-delay: 0.1s; }
.volume-bar:nth-child(3) { animation-delay: 0.2s; }
.volume-bar:nth-child(4) { animation-delay: 0.3s; }
.volume-bar:nth-child(5) { animation-delay: 0.4s; }

@keyframes wave {
  0%, 100% { height: 4px; }
  50% { height: 16px; }
}
```

## 6. 响应式设计

### 6.1 窗口尺寸适配
```css
/* 最小窗口尺寸 */
.main-window {
  min-width: 320px;
  min-height: 240px;
  max-width: 600px;
  max-height: 500px;
}

/* 紧凑模式 */
.main-window.compact {
  width: 300px;
  height: 200px;
}

.main-window.compact .question-area,
.main-window.compact .answer-area {
  height: 60px;
  font-size: 12px;
}

/* 扩展模式 */
.main-window.expanded {
  width: 500px;
  height: 400px;
}

.main-window.expanded .answer-area {
  height: 180px;
}
```

### 6.2 字体缩放适配
```css
/* 系统字体缩放适配 */
@media (min-resolution: 144dpi) {
  .main-window {
    font-size: 13px;
  }
}

@media (min-resolution: 192dpi) {
  .main-window {
    font-size: 12px;
  }
}

/* 用户自定义字体大小 */
.font-small { font-size: 12px; }
.font-normal { font-size: 14px; }
.font-large { font-size: 16px; }
.font-xlarge { font-size: 18px; }
```

## 7. 动画效果设计

### 7.1 窗口动画
```css
/* 窗口显示/隐藏动画 */
.window-enter {
  opacity: 0;
  transform: scale(0.9) translateY(-10px);
}

.window-enter-active {
  opacity: 1;
  transform: scale(1) translateY(0);
  transition: all 0.2s ease-out;
}

.window-exit {
  opacity: 1;
  transform: scale(1) translateY(0);
}

.window-exit-active {
  opacity: 0;
  transform: scale(0.9) translateY(-10px);
  transition: all 0.15s ease-in;
}
```

### 7.2 状态切换动画
```css
/* 监听状态切换 */
.listening-indicator {
  position: relative;
  overflow: hidden;
}

.listening-indicator::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(24, 144, 255, 0.3),
    transparent
  );
  animation: shimmer 2s infinite;
}

@keyframes shimmer {
  0% { left: -100%; }
  100% { left: 100%; }
}
```

## 8. 无障碍设计

### 8.1 高对比度支持
```css
@media (prefers-contrast: high) {
  :root {
    --primary-bg: #000000;
    --secondary-bg: #1a1a1a;
    --text-primary: #ffffff;
    --border-color: #ffffff;
    --accent-color: #00ff00;
  }
}
```

### 8.2 减少动画支持
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

## 9. 主题切换设计

### 9.1 主题变量定义
```css
/* 深色主题 */
[data-theme="dark"] {
  --primary-bg: #1a1a1a;
  --secondary-bg: #2d2d2d;
  --accent-color: #007acc;
  --text-primary: #ffffff;
  --text-secondary: #b3b3b3;
}

/* 浅色主题 */
[data-theme="light"] {
  --primary-bg: #ffffff;
  --secondary-bg: #f5f5f5;
  --accent-color: #1890ff;
  --text-primary: #262626;
  --text-secondary: #8c8c8c;
}

/* 自动主题 */
[data-theme="auto"] {
  --primary-bg: light-dark(#ffffff, #1a1a1a);
  --secondary-bg: light-dark(#f5f5f5, #2d2d2d);
  --accent-color: light-dark(#1890ff, #007acc);
  --text-primary: light-dark(#262626, #ffffff);
  --text-secondary: light-dark(#8c8c8c, #b3b3b3);
}
```

### 9.2 主题切换动画
```css
.theme-transition {
  transition: background-color 0.3s ease,
              color 0.3s ease,
              border-color 0.3s ease;
}
```

## 10. 移动端适配（未来扩展）

### 10.1 触摸友好设计
```css
/* 触摸目标最小尺寸 */
.touch-target {
  min-width: 44px;
  min-height: 44px;
  padding: 8px;
}

/* 手势支持 */
.swipe-area {
  touch-action: pan-x pan-y;
}
```

这个视觉UI原型设计文档涵盖了AI面试助手桌面端的完整界面设计，包括主界面、登录界面、设置界面等各个部分的详细布局和样式规范。
