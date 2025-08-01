# OfferHelper 桌面应用启动脚本

本项目提供了多个启动脚本，方便在不同操作系统和模式下运行 OfferHelper 桌面应用。

## 脚本列表

### 生产模式启动脚本

#### macOS/Linux

```bash
./run-app.sh
```

#### Windows

```cmd
run-app.bat
```

**功能说明：**

- 自动检查 Node.js 和 npm 环境
- 自动安装依赖（如果未安装）
- 清理之前的构建文件
- 构建生产版本
- 启动桌面应用

### 开发模式启动脚本

#### macOS/Linux

```bash
./run-dev.sh
```

#### Windows

```cmd
run-dev.bat
```

**功能说明：**

- 自动检查开发环境
- 自动安装依赖（如果未安装）
- 启动开发模式（支持热重载）
- 开启开发者工具
- 实时代码更新

## 使用方法

### 首次运行

1. 确保已安装 Node.js (推荐版本 16+)
2. 在项目根目录下运行对应的脚本
3. 脚本会自动处理依赖安装和环境配置

### 日常开发

- 开发时使用 `run-dev` 脚本，支持热重载
- 测试生产版本时使用 `run-app` 脚本

### 环境要求

- **Node.js**: 16.0.0 或更高版本
- **npm**: 7.0.0 或更高版本
- **操作系统**: Windows 10+, macOS 10.15+, Ubuntu 18.04+

## 故障排除

### 常见问题

1. **权限错误 (macOS/Linux)**

   ```bash
   chmod +x run-app.sh run-dev.sh
   ```

2. **依赖安装失败**
   - 清理 node_modules: `rm -rf node_modules`
   - 重新安装: `npm install`

3. **构建失败**
   - 检查 TypeScript 错误
   - 确保所有依赖已正确安装

4. **应用启动失败**
   - 检查端口是否被占用
   - 查看控制台错误信息

### 手动命令

如果脚本无法正常工作，可以手动执行以下命令：

```bash
# 安装依赖
npm install

# 开发模式
npm run dev

# 生产模式
npm run build
npm run electron
```

## 脚本特性

- ✅ 自动环境检查
- ✅ 依赖管理
- ✅ 错误处理
- ✅ 跨平台支持
- ✅ 中文友好提示
- ✅ 构建优化

## 更新日志

- **v1.0.0**: 初始版本，支持基本的启动功能
- 支持 macOS、Linux、Windows 三大平台
- 提供开发和生产两种模式
