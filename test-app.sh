#!/bin/bash

echo "🧪 启动应用进行最小组件测试"
echo "开发服务器应该已经在运行在 localhost:3002"
echo "现在启动Electron应用..."

# 设置开发环境
export NODE_ENV=development

# 启动Electron应用
./node_modules/.bin/electron dist/main.js

echo "应用已退出"