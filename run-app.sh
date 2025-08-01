#!/bin/bash

# OfferHelper 桌面应用启动脚本
# 作者: CodeBuddy
# 描述: 用于启动 OfferHelper Electron 桌面应用

echo "🚀 正在启动 OfferHelper 桌面应用..."

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

# 清理之前的构建文件
echo "🧹 清理构建文件..."
rm -rf dist/

# 构建应用
echo "🔨 正在构建应用..."
npm run build
if [ $? -ne 0 ]; then
    echo "❌ 构建失败"
    exit 1
fi

# 启动应用
echo "✅ 构建完成，正在启动应用..."
npm run start

echo "🎉 应用启动完成！"