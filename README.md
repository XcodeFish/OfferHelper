# OfferHelper Desktop

> 程序员面试AI辅助助手 - 桌面端应用

## 📋 项目简介

OfferHelper Desktop 是一款专为程序员面试设计的AI辅助工具，提供实时语音识别、智能回答建议、知识库查询等功能，同时具备强大的隐私保护机制，确保在屏幕共享时完全隐藏。

## ✨ 核心功能

### 🎯 面试辅助

- **实时语音识别**: 监听面试官提问并转录为文字
- **AI 智能分析**: 基于 OpenAI API 生成专业回答建议
- **知识库查询**: 快速检索相关技术知识点
- **历史记录**: 面试问答历史管理和回顾

### 🔒 隐私保护

- **屏幕共享检测**: 自动识别屏幕共享状态
- **智能隐藏**: 毫秒级窗口隐藏响应
- **手动控制**: 快捷键和手势控制
- **安全模式**: 紧急隐藏和恢复

### 🎨 界面体验

- **悬浮设计**: 小巧的悬浮助手窗口
- **透明效果**: 可调节的窗口透明度
- **主题切换**: 暗色/亮色主题支持
- **响应式**: 适配不同屏幕尺寸

## 🛠️ 技术栈

- **Electron 25+**: 跨平台桌面应用框架
- **React 18**: 用户界面构建
- **TypeScript**: 类型安全的开发体验
- **Zustand**: 轻量级状态管理
- **Tailwind CSS**: 实用优先的 CSS 框架
- **Framer Motion**: 流畅的动画效果
- **SQLite + Prisma**: 本地数据库
- **OpenAI API**: AI 分析服务
- **Vite**: 快速的构建工具
- **Electron Builder**: 应用打包和分发

## 🚀 快速开始

### 环境要求

```bash
Node.js >= 18.0.0
npm >= 8.0.0
Python >= 3.8 (用于 native 模块编译)
```

### 安装依赖

```bash
# 克隆项目
git clone https://github.com/offerhelper/desktop.git
cd desktop

# 安装依赖
npm install
```

### 配置环境变量

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑 .env 文件，配置 OpenAI API Key
OPENAI_API_KEY=your_openai_api_key_here
```

### 开发模式

```bash
# 启动开发环境
npm run dev

# 或分别启动主进程和渲染进程
npm run dev:main    # 启动主进程开发
npm run dev:renderer # 启动渲染进程开发
```

### 构建和打包

```bash
# 构建应用
npm run build

# 打包所有平台
npm run dist

# 打包特定平台
npm run dist:mac     # macOS
npm run dist:win     # Windows
npm run dist:linux   # Linux
```

## 📁 项目结构

```
OfferHelper-Desktop/
├── src/
│   ├── main/              # 主进程代码
│   │   ├── main.ts       # 应用入口
│   │   ├── window/       # 窗口管理
│   │   ├── privacy/      # 隐私保护
│   │   └── security/     # 安全模块
│   ├── renderer/         # 渲染进程代码
│   │   ├── components/   # UI 组件
│   │   ├── store/        # 状态管理
│   │   └── styles/       # 样式文件
│   ├── shared/           # 共享代码
│   │   ├── types/        # 类型定义
│   │   ├── utils/        # 工具函数
│   │   └── constants/    # 常量定义
│   └── preload/          # 预加载脚本
├── config/               # 构建配置
├── scripts/              # 构建脚本
├── build/                # 构建资源
└── docs/                 # 项目文档
```

## 🎮 使用指南

### 基本操作

1. **启动应用**: 双击桌面图标或从开始菜单启动
2. **开始监听**: 点击"开始监听"按钮开始语音识别
3. **查看建议**: AI 分析完成后会显示回答建议
4. **手动隐藏**: 使用快捷键 `Ctrl+Shift+H` 手动隐藏窗口

### 快捷键

- `Ctrl+Shift+H`: 切换窗口显示/隐藏
- `Ctrl+Shift+L`: 开始/停止语音监听
- `Ctrl+Shift+S`: 打开设置面板
- `Ctrl+Shift+K`: 打开知识库
- `Esc`: 关闭当前面板

### 隐私保护

应用会自动检测以下情况并隐藏窗口：

- 屏幕共享软件运行（Zoom、Teams、Skype等）
- 屏幕录制软件运行
- 远程桌面连接
- 浏览器进入全屏模式

## ⚙️ 配置说明

### AI 配置

在设置面板中可以配置：

- OpenAI API Key
- 模型选择（GPT-3.5-turbo、GPT-4等）
- 回答风格和长度
- 语言偏好

### 隐私设置

- 自动隐藏开关
- 检测敏感度调节
- 紧急隐藏快捷键
- 数据本地化选项

## 🧪 开发指南

### 代码规范

- 使用 TypeScript 进行类型安全开发
- 遵循 ESLint 和 Prettier 配置
- 组件使用 PascalCase 命名
- 函数使用 camelCase 命名
- 常量使用 SCREAMING_SNAKE_CASE 命名

### 测试

```bash
# 运行单元测试
npm test

# 运行测试并生成覆盖率报告
npm run test:coverage

# 运行 E2E 测试
npm run test:e2e
```

### 代码检查

```bash
# ESLint 检查
npm run lint

# 自动修复代码格式
npm run lint:fix

# Prettier 格式化
npm run format

# TypeScript 类型检查
npm run type-check
```

## 🔧 故障排除

### 常见问题

**Q: 应用启动失败**
A: 检查 Node.js 版本是否 >= 18.0.0，确保所有依赖已正确安装

**Q: 语音识别不工作**
A: 检查麦克风权限，确保浏览器允许访问麦克风

**Q: AI 分析失败**
A: 检查 OpenAI API Key 是否正确配置，网络连接是否正常

**Q: 窗口无法隐藏**
A: 检查隐私保护功能是否启用，尝试手动使用快捷键隐藏

### 调试模式

```bash
# 启动调试模式
npm run dev -- --debug

# 查看详细日志
npm run dev -- --verbose
```

## 🤝 贡献指南

1. Fork 项目到个人仓库
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 📞 联系我们

- **项目主页**: <https://github.com/offerhelper/desktop>
- **问题反馈**: <https://github.com/offerhelper/desktop/issues>
- **邮箱**: <support@offerhelper.com>

## ⚠️ 免责声明

本工具仅供学习和研究使用，请在合法合规的范围内使用。使用者应承担相应的法律和道德责任。

---

**OfferHelper Desktop Team**
*让每一次面试都充满信心* 💪
