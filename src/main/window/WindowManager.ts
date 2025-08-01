import { BrowserWindow, screen } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { WindowConfig } from '../../shared/types/window';
import { logger } from '../../shared/utils/Logger';
import { EventBus } from '../../shared/utils/EventBus';

export class WindowManager {
  private mainWindow: BrowserWindow | null = null;
  private isHidden: boolean = false;

  constructor() {
    this.setupEventHandlers();
  }

  public async createMainWindow(): Promise<BrowserWindow> {
    if (this.mainWindow) {
      this.mainWindow.focus();
      return this.mainWindow;
    }

    const config: WindowConfig = this.getDefaultWindowConfig();

    // 根据环境确定 preload 脚本路径
    // 在开发模式下，检查是否有开发构建的 preload 文件
    let preloadPath = path.join(__dirname, 'preload', 'index.js');
    
    // 如果是通过 npm start 启动但加载开发服务器，说明是开发模式
    const isDevelopment = process.env.NODE_ENV === 'development' || 
                         !fs.existsSync(preloadPath);
    
    if (isDevelopment) {
      // 开发模式下，preload 文件可能在不同位置
      const devPreloadPath = path.join(__dirname, '..', '..', 'dist', 'preload', 'index.js');
      if (fs.existsSync(devPreloadPath)) {
        preloadPath = devPreloadPath;
      }
    }
    
    // 添加调试日志
    console.log('isDevelopment:', isDevelopment);
    console.log('Preload path:', preloadPath);
    console.log('Preload exists:', fs.existsSync(preloadPath));
    console.log('__dirname:', __dirname);
    console.log('NODE_ENV:', process.env.NODE_ENV);

    this.mainWindow = new BrowserWindow({
      width: config.width,
      height: config.height,
      x: config.x,
      y: config.y,
      alwaysOnTop: config.alwaysOnTop,
      skipTaskbar: config.skipTaskbar,
      transparent: config.transparent,
      frame: config.frame,
      resizable: false,
      minimizable: false,
      maximizable: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: preloadPath
      }
    });

    // 设置内容保护
    this.mainWindow.setContentProtection(true);

    // 加载应用界面
    // 检查是否有开发服务器运行
    const isDevServerRunning = await this.checkDevServer();
    
    if (process.env.NODE_ENV === 'development' && isDevServerRunning) {
      console.log('Loading development server...');
      await this.mainWindow.loadURL('http://localhost:3001');
      this.mainWindow.webContents.openDevTools();
    } else {
      console.log('Loading production build...');
      await this.mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));
    }

    this.setupWindowEventHandlers();

    logger.info('主窗口创建完成');
    return this.mainWindow;
  }

  public show(): void {
    if (this.mainWindow && !this.mainWindow.isVisible()) {
      this.mainWindow.show();
      this.isHidden = false;
      this.notifyStatusChange('visible');
      logger.debug('窗口显示');
    }
  }

  public hide(): void {
    if (this.mainWindow && this.mainWindow.isVisible()) {
      this.mainWindow.hide();
      this.isHidden = true;
      this.notifyStatusChange('hidden');
      logger.debug('窗口隐藏');
    }
  }

  public minimize(): void {
    if (this.mainWindow && !this.mainWindow.isMinimized()) {
      this.mainWindow.minimize();
      logger.debug('窗口最小化');
    }
  }

  public toggleVisibility(): void {
    if (!this.mainWindow) return;

    if (this.isHidden || !this.mainWindow.isVisible()) {
      this.show();
    } else {
      this.hide();
    }
  }

  public isVisible(): boolean {
    return this.mainWindow?.isVisible() || false;
  }

  public getMainWindow(): BrowserWindow | null {
    return this.mainWindow;
  }

  private getDefaultWindowConfig(): WindowConfig {
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;

    return {
      width: 400,
      height: 600,
      x: screenWidth - 420,
      y: 100,
      alwaysOnTop: true,
      skipTaskbar: true,
      transparent: true,
      frame: false
    };
  }

  private setupEventHandlers(): void {
    EventBus.on('window:show', () => this.show());
    EventBus.on('window:hide', () => this.hide());
    EventBus.on('window:toggle', () => this.toggleVisibility());
  }

  private setupWindowEventHandlers(): void {
    if (!this.mainWindow) return;

    this.mainWindow.on('closed', () => {
      this.mainWindow = null;
      logger.info('主窗口已关闭');
    });

    this.mainWindow.on('minimize', () => {
      logger.debug('窗口最小化事件');
    });

    this.mainWindow.on('restore', () => {
      logger.debug('窗口恢复事件');
    });

    this.mainWindow.on('focus', () => {
      logger.debug('窗口获得焦点');
    });

    this.mainWindow.on('blur', () => {
      logger.debug('窗口失去焦点');
    });
  }

  private async checkDevServer(): Promise<boolean> {
    try {
      const http = require('http');
      return new Promise((resolve) => {
        const req = http.get('http://localhost:3001', (res: any) => {
          resolve(res.statusCode === 200);
        });
        req.on('error', () => resolve(false));
        req.setTimeout(1000, () => {
          req.destroy();
          resolve(false);
        });
      });
    } catch {
      return false;
    }
  }

  private notifyStatusChange(status: 'hidden' | 'visible'): void {
    EventBus.emit('window-status-changed', status);
    
    // 通知渲染进程
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send('window-status-changed', status);
    }
  }
}