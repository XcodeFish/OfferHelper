#!/bin/bash

echo "========================================"
echo "OfferHelper 语音测试调试脚本"
echo "========================================"

# 检查Node.js版本
echo "检查Node.js版本..."
node --version

# 检查npm版本  
echo "检查npm版本..."
npm --version

# 安装依赖（如果需要）
echo "检查并安装依赖..."
if [ ! -d "node_modules" ]; then
    echo "安装项目依赖..."
    npm install
else
    echo "依赖已存在，跳过安装"
fi

# 构建项目
echo "构建项目..."
npm run build

# 启动应用（调试模式）
echo "启动应用（调试模式）..."
echo "注意：如果应用闪退，请检查控制台输出和日志文件"
echo "========================================"

# 设置调试环境变量
export NODE_ENV=development
export DEBUG=true

# 启动应用
npm run app

echo "========================================"
echo "应用已退出"
echo "如果遇到问题，请检查："
echo "1. 控制台输出"
echo "2. 应用内的调试日志"
echo "3. 网络连接"
echo "4. 腾讯云配置"
echo "========================================"