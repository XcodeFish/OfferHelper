# offerHelper

基于Electron、智谱AI和腾讯云语音识别的桌面应用程序。

## 项目结构

```
├── src/
│   ├── main/                 # 主进程代码
│   │   ├── index.ts         # 主进程入口
│   │   ├── window/          # 窗口管理
│   │   ├── services/        # 业务服务
│   │   ├── ipc/            # IPC通信处理
│   │   ├── utils/          # 工具函数
│   │   └── preload/        # 预加载脚本
│   ├── renderer/           # 渲染进程代码
│   │   ├── components/     # React组件
│   │   ├── pages/         # 页面组件
│   │   ├── hooks/         # 自定义Hook
│   │   ├── store/         # 状态管理
│   │   ├── services/      # 前端服务
│   │   ├── utils/         # 前端工具
│   │   ├── styles/        # 样式文件
│   │   └── types/         # 类型定义
│   └── shared/            # 共享代码
│       ├── types/         # 共享类型
│       ├── constants/     # 常量定义
│       └── utils/         # 共享工具
├── assets/               # 静态资源
│   ├── icons/           # 图标文件
│   ├── images/          # 图片文件
│   ├── sounds/          # 音频文件
│   └── fonts/           # 字体文件
├── build/               # 构建输出
├── dist/                # 打包输出
├── test/                # 测试文件
├── scripts/             # 构建脚本
├── logs/                # 日志文件
└── docs/                # 文档

```

## 功能特性

- 🎤 实时语音录制和识别
- 🤖 智谱AI对话功能
- 🎨 现代化UI界面
- ⚙️ 丰富的设置选项
- 🔐 用户认证系统
- 📱 响应式设计
- 🌙 深色/浅色主题切换

## 技术栈

- **框架**: Electron + React + TypeScript
- **状态管理**: Redux Toolkit
- **UI组件**: 自定义组件库
- **构建工具**: Webpack + TypeScript
- **代码规范**: ESLint + Prettier
- **测试框架**: Jest
- **语音识别**: 腾讯云实时语音识别
- **AI对话**: 智谱AI GLM模型

## 开发环境设置

### 环境要求

- Node.js >= 16.0.0
- npm >= 8.0.0

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

### 构建项目

```bash
npm run build
```

### 打包应用

```bash
npm run dist
```

## 配置说明

### 环境变量

项目使用环境变量来配置不同的运行环境：

- `.env.development` - 开发环境配置
- `.env.production` - 生产环境配置

主要配置项：

```env
NODE_ENV=development
ELECTRON_IS_DEV=true
AI_API_BASE_URL=https://api.zhipuai.cn
TENCENT_CLOUD_ASR_URL=wss://asr.tencentcloudapi.com
LOG_LEVEL=debug
```

### API密钥配置

在使用前需要配置相关API密钥：

1. 智谱AI API密钥
2. 腾讯云语音识别密钥

## 项目脚本

- `npm run dev` - 启动开发服务器
- `npm run build` - 构建项目
- `npm run dist` - 打包应用
- `npm run test` - 运行测试
- `npm run lint` - 代码检查
- `npm run format` - 代码格式化

## 目录说明

### 主进程 (src/main/)

- `index.ts` - 应用入口，负责创建窗口和初始化服务
- `window/` - 窗口管理相关代码
- `services/` - 业务服务层，包含AI、语音、设置等服务
- `ipc/` - IPC通信处理器
- `utils/` - 主进程工具函数
- `preload/` - 预加载脚本，暴露安全的API给渲染进程

### 渲染进程 (src/renderer/)

- `components/` - React组件
- `pages/` - 页面级组件
- `hooks/` - 自定义React Hook
- `store/` - Redux状态管理
- `services/` - 前端服务层
- `utils/` - 前端工具函数
- `styles/` - 样式文件
- `types/` - 前端类型定义

### 共享代码 (src/shared/)

- `types/` - 前后端共享的类型定义
- `constants/` - 常量定义
- `utils/` - 共享工具函数

## 开发指南

### 添加新功能

1. 在 `src/main/services/` 中添加业务逻辑
2. 在 `src/main/ipc/handlers/` 中添加IPC处理器
3. 在 `src/renderer/` 中添加前端组件
4. 更新类型定义和常量

### 代码规范

项目使用ESLint和Prettier来保证代码质量：

```bash
npm run lint    # 检查代码规范
npm run format  # 格式化代码
```

### 测试

```bash
npm run test           # 运行所有测试
npm run test:watch     # 监听模式运行测试
npm run test:coverage  # 生成覆盖率报告
```

## 部署

### 构建生产版本

```bash
npm run build
npm run dist
```

构建完成后，可执行文件将在 `dist/` 目录中生成。

## 许可证

MIT License

## 贡献

欢迎提交Issue和Pull Request来改进项目。

## 联系方式

如有问题，请通过以下方式联系：

- 邮箱: <your-email@example.com>
- GitHub: <https://github.com/your-username/ai-voice-assistant>
