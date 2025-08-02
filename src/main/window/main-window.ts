import { BrowserWindow, screen } from 'electron';
import * as path from 'path';
import { isDev } from '../utils/env';

export function createMainWindow(): BrowserWindow {
  // 获取主显示器的工作区域
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;

  // 创建浏览器窗口 - 登录窗口大小
  const mainWindow = new BrowserWindow({
    width: 480,
    height: 600,
    minWidth: 480,
    minHeight: 600,
    maxWidth: 480,
    maxHeight: 600,
    center: true,
    show: false, // 先不显示，等内容加载完成后再显示
    resizable: false, // 禁止调整大小
    titleBarStyle: 'hiddenInset', // macOS 样式
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, '../preload/index.js'),
      webSecurity: !isDev,
    },
  });

  // 加载应用
  if (isDev) {
    // 开发模式下加载构建后的HTML文件
    const htmlPath = path.join(process.cwd(), 'build/renderer/index.html');
    mainWindow.loadFile(htmlPath);
    // 开发模式下打开开发者工具
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  // 窗口准备显示时显示窗口
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // 窗口关闭事件
  mainWindow.on('closed', () => {
    // 清理引用
  });

  return mainWindow;
}
