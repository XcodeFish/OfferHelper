import { app, BrowserWindow } from 'electron';
import * as path from 'path';
import { isDev } from './utils/env';
import { createMainWindow } from './window/main-window';
import { setupIpcHandlers } from './ipc/setup';
import { initializeServices } from './services';

// 确保只有一个应用实例
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  let mainWindow: BrowserWindow | null = null;

  // 当第二个实例启动时，聚焦到主窗口
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  // 应用准备就绪
  app.whenReady().then(async () => {
    // 初始化服务
    await initializeServices();
    
    // 设置IPC处理器
    setupIpcHandlers();
    
    // 创建主窗口
    mainWindow = createMainWindow();
    
    // macOS 特殊处理
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        mainWindow = createMainWindow();
      }
    });
  });

  // 所有窗口关闭时退出应用（macOS除外）
  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  // 应用即将退出
  app.on('before-quit', () => {
    // 清理资源
  });
}