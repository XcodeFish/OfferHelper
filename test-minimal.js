#!/usr/bin/env node

// 最小Electron启动脚本，仅用于测试崩溃问题
const { app, BrowserWindow } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
  console.log('🚀 创建测试窗口...');
  
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  const isDev = process.env.NODE_ENV !== 'production';
  
  if (isDev) {
    console.log('开发模式：加载开发服务器');
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    console.log('生产模式：加载本地文件');
    mainWindow.loadFile(path.join(__dirname, 'dist', 'renderer', 'index.html'));
    // 也打开开发者工具以便调试
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // 监听所有可能的崩溃事件
  mainWindow.webContents.on('crashed', () => {
    console.error('❌ 渲染进程崩溃');
  });

  mainWindow.on('unresponsive', () => {
    console.error('❌ 窗口无响应');
  });

  mainWindow.webContents.on('unresponsive', () => {
    console.error('❌ WebContents无响应');
  });

  console.log('✅ 测试窗口创建完成');
}

app.whenReady().then(() => {
  console.log('🎯 Electron应用准备就绪');
  createWindow();
});

app.on('window-all-closed', () => {
  console.log('🔚 所有窗口关闭');
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// 全局异常处理
process.on('uncaughtException', (error) => {
  console.error('❌ 未捕获的异常:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ 未处理的Promise拒绝:', reason);
});

console.log('🧪 最小测试启动脚本加载完成');