#!/bin/bash

# OfferHelper 开发模式启动脚本
# 作者: CodeBuddy
# 描述: 用于在开发模式下启动 OfferHelper Electron 应用

echo "🛠️  正在启动 OfferHelper 开发模式..."

# 检查 Node.js 是否安装
if ! command -v node &> /dev/null; then
    echo "❌ 错误: 未找到 Node.js，请先安装 Node.js"
    echo "   下载地址: https://nodejs.org/"
    exit 1
fi

# 检查 npm 是否安装
if ! command -v npm &> /dev/null; then
    echo "❌ 错误: 未找到 npm，请先安装 npm"
    exit 1
fi

# 检查是否在项目根目录
if [ ! -f "package.json" ]; then
    echo "❌ 错误: 请在项目根目录下运行此脚本"
    exit 1
fi

# 检查依赖是否已安装
if [ ! -d "node_modules" ]; then
    echo "📦 正在安装依赖..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ 依赖安装失败"
        exit 1
    fi
fi

# 启动开发模式
echo "🚀 正在启动开发模式..."
echo "   - 支持热重载"
echo "   - 开发者工具已启用"
echo "   - 实时代码更新"

npm run dev

echo "🎉 开发模式启动完成！"