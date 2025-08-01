@echo off
chcp 65001 >nul
title OfferHelper 开发模式启动器

echo 🛠️  正在启动 OfferHelper 开发模式...

REM 检查 Node.js 是否安装
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ 错误: 未找到 Node.js，请先安装 Node.js
    echo    下载地址: https://nodejs.org/
    pause
    exit /b 1
)

REM 检查 npm 是否安装
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ 错误: 未找到 npm，请先安装 npm
    pause
    exit /b 1
)

REM 检查是否在项目根目录
if not exist "package.json" (
    echo ❌ 错误: 请在项目根目录下运行此脚本
    pause
    exit /b 1
)

REM 检查依赖是否已安装
if not exist "node_modules" (
    echo 📦 正在安装依赖...
    npm install
    if %errorlevel% neq 0 (
        echo ❌ 依赖安装失败
        pause
        exit /b 1
    )
)

REM 启动开发模式
echo 🚀 正在启动开发模式...
echo    - 支持热重载
echo    - 开发者工具已启用
echo    - 实时代码更新

npm run dev

echo 🎉 开发模式启动完成！
pause