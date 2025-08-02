import { app, BrowserWindow, globalShortcut, ipcMain } from 'electron';
import * as path from 'path';
import { WindowManager } from './window/WindowManager';
import { PrivacyProtector } from './privacy/PrivacyProtector';
import { SecurityManager } from './security/SecurityManager';
// 使用真实API版本 - 实现真正的腾讯云语音识别
import { tencentSpeechMainServiceRealAPI as tencentSpeechMainService } from './speech/TencentSpeechMainService_RealAPI';
import { logger } from '../shared/utils/Logger';

class Application {
  private windowManager: WindowManager | null = null;
  private privacyProtector: PrivacyProtector | null = null;
  private securityManager: SecurityManager | null = null;

  constructor() {
    logger.info('主进程Application构造函数开始执行');
    this.setupErrorHandlers();
    logger.info('错误处理器设置完成');
    this.initializeApplication();
    logger.info('应用初始化完成');
  }

  private setupErrorHandlers(): void {
    // 处理未捕获的异常
    process.on('uncaughtException', (error) => {
      logger.error('未捕获的异常:', error);
      console.error('Uncaught Exception:', error);
      
      // 对于严重错误，记录并尝试清理资源
      if (error.name === 'Error' && error.message.includes('IPC')) {
        logger.error('IPC通信错误，尝试清理资源');
        // 不退出应用，只是记录错误
      } else if (error.name === 'TypeError' || error.name === 'ReferenceError') {
        logger.error(`编程错误，继续运行: ${error.message}`);
      } else {
        logger.error(`系统级错误，应用可能不稳定: ${error.message}`);
      }
    });

    // 处理未处理的Promise拒绝
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('未处理的Promise拒绝:', reason);
      console.error('Unhandled Rejection at:', promise, 'reason:', reason);
      
      // 对特定类型的Promise拒绝进行特殊处理
      if (reason && typeof reason === 'object' && 'code' in reason) {
        const errorCode = (reason as any).code;
        if (errorCode === 'ECONNREFUSED' || errorCode === 'ETIMEDOUT') {
          logger.warn('网络连接问题，可能影响某些功能');
        }
      }
    });

    // 处理警告
    process.on('warning', (warning) => {
      logger.warn(`Node.js警告: ${warning.name} - ${warning.message}`);
      // 对于MaxListenersExceededWarning特别关注
      if (warning.name === 'MaxListenersExceededWarning') {
        logger.warn('事件监听器数量超过限制，可能存在内存泄漏');
      }
    });
  }

  private async initializeApplication(): Promise<void> {
    // 等待应用准备就绪
    await app.whenReady();

    // 初始化安全管理器
    this.securityManager = new SecurityManager();
    this.securityManager.initialize();

    // 初始化窗口管理器
    this.windowManager = new WindowManager();
    await this.windowManager.createMainWindow();

    // 设置腾讯云语音识别服务的主窗口引用（简化版）
    const mainWindow = this.windowManager.getMainWindow();
    if (mainWindow) {
      tencentSpeechMainService.setMainWindow(mainWindow);
    }

    // 初始化隐私保护
    this.privacyProtector = new PrivacyProtector(this.windowManager);
    this.privacyProtector.startMonitoring();

    // 设置事件处理器
    this.setupEventHandlers();
    this.setupIpcHandlers();

    logger.info('OfferHelper 应用启动完成');
  }

  private setupEventHandlers(): void {
    // 当所有窗口关闭时
    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        app.quit();
      }
    });

    // 当应用激活时
    app.on('activate', async () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        await this.windowManager?.createMainWindow();
      }
    });

    // 应用退出前清理
    app.on('before-quit', () => {
      this.cleanup();
    });

    // 注册全局快捷键
    this.registerGlobalShortcuts();
  }

  private registerGlobalShortcuts(): void {
    // 切换窗口显示/隐藏
    globalShortcut.register('CommandOrControl+Shift+H', () => {
      this.windowManager?.toggleVisibility();
    });

    // 紧急隐藏
    globalShortcut.register('CommandOrControl+Shift+Escape', () => {
      this.windowManager?.hide();
    });
  }

  private setupIpcHandlers(): void {
    // 应用控制
    ipcMain.handle('app:quit', () => {
      app.quit();
    });

    ipcMain.handle('app:restart', () => {
      app.relaunch();
      app.quit();
    });

    ipcMain.handle('app:get-version', () => {
      return app.getVersion();
    });

    // 窗口控制
    ipcMain.handle('window:minimize', () => {
      this.windowManager?.minimize();
    });

    ipcMain.handle('window:hide', () => {
      this.windowManager?.hide();
    });

    ipcMain.handle('window:show', () => {
      this.windowManager?.show();
    });

    ipcMain.handle('window:toggle-visibility', () => {
      this.windowManager?.toggleVisibility();
    });

    // 隐私保护控制
    // 隐私保护控制
    ipcMain.handle('privacy:start-monitoring', () => {
      this.privacyProtector?.startMonitoring();
    });

    ipcMain.handle('privacy:stop-monitoring', () => {
      this.privacyProtector?.stopMonitoring();
    });

    ipcMain.handle('privacy:set-auto-hide', (event, enabled: boolean) => {
      this.privacyProtector?.setAutoHideEnabled(enabled);
      return this.privacyProtector?.isAutoHideEnabled();
    });

    ipcMain.handle('privacy:get-auto-hide', () => {
      return this.privacyProtector?.isAutoHideEnabled();
    });



    // 腾讯云语音识别服务已在 TencentSpeechMainService 中设置了自己的 IPC 处理器

    // AI分析
    ipcMain.handle('ai:analyze', async (event, question: string) => {
      // TODO: 实现AI分析功能
      logger.info('AI分析请求:', question);
      return { result: '分析结果', confidence: 0.8 };
    });
  }

  private cleanup(): void {
    // 注销全局快捷键
    globalShortcut.unregisterAll();

    // 停止隐私保护监控
    this.privacyProtector?.stopMonitoring();

    logger.info('应用清理完成');
  }
}

// 启动应用
logger.info('主进程即将创建Application实例');
console.log('=== 主进程启动调试 ===');
console.log('主进程即将创建Application实例');

try {
  new Application();
  console.log('Application实例创建成功');
} catch (error) {
  logger.error('创建Application实例失败:', error);
  console.error('Fatal error during application startup:', error);
  // 写入文件进行调试
  require('fs').writeFileSync('/tmp/electron-crash.log', 
    `Application startup failed: ${error}\nStack: ${error instanceof Error ? error.stack : 'No stack'}`);
}