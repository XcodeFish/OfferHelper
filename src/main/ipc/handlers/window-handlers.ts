import { ipcMain, BrowserWindow } from 'electron';
import { isDev } from '../../utils/env';

// 简单的日志工具
const logger = {
  info: (message: string, data?: any) => {
    if (isDev) {
      console.log(`[Window Handlers] ${message}`, data || '');
    }
  },
  error: (message: string, error?: any) => {
    console.error(`[Window Handlers] ${message}`, error || '');
  },
  warn: (message: string, data?: any) => {
    console.warn(`[Window Handlers] ${message}`, data || '');
  },
};

// 注册窗口相关的IPC处理器
export function registerWindowHandlers(): void {
  logger.info('注册窗口处理器...');

  // 设置窗口透明度
  ipcMain.handle('window:setOpacity', async (event, opacity: number) => {
    try {
      logger.info('设置窗口透明度', { opacity });

      const window = BrowserWindow.fromWebContents(event.sender);
      if (!window) {
        throw new Error('无法获取窗口实例');
      }

      // 确保透明度值在有效范围内
      const validOpacity = Math.max(0.1, Math.min(1, opacity));

      // 设置窗口透明度
      window.setOpacity(validOpacity);

      logger.info('窗口透明度设置成功', { opacity: validOpacity });

      return {
        success: true,
        data: { opacity: validOpacity },
      };
    } catch (error) {
      logger.error('设置窗口透明度失败', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '设置透明度失败',
      };
    }
  });

  // 获取窗口透明度
  ipcMain.handle('window:getOpacity', async event => {
    try {
      const window = BrowserWindow.fromWebContents(event.sender);
      if (!window) {
        throw new Error('无法获取窗口实例');
      }

      const opacity = window.getOpacity();

      return {
        success: true,
        data: { opacity },
      };
    } catch (error) {
      logger.error('获取窗口透明度失败', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '获取透明度失败',
      };
    }
  });

  // 设置窗口置顶
  ipcMain.handle(
    'window:setAlwaysOnTop',
    async (event, alwaysOnTop: boolean) => {
      try {
        logger.info('设置窗口置顶', { alwaysOnTop });

        const window = BrowserWindow.fromWebContents(event.sender);
        if (!window) {
          throw new Error('无法获取窗口实例');
        }

        window.setAlwaysOnTop(alwaysOnTop);

        logger.info('窗口置顶设置成功', { alwaysOnTop });

        return {
          success: true,
          data: { alwaysOnTop },
        };
      } catch (error) {
        logger.error('设置窗口置顶失败', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : '设置置顶失败',
        };
      }
    }
  );

  // 最小化窗口
  ipcMain.handle('window:minimize', async event => {
    try {
      const window = BrowserWindow.fromWebContents(event.sender);
      if (!window) {
        throw new Error('无法获取窗口实例');
      }

      window.minimize();

      return {
        success: true,
      };
    } catch (error) {
      logger.error('最小化窗口失败', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '最小化失败',
      };
    }
  });

  // 最大化/还原窗口
  ipcMain.handle('window:toggleMaximize', async event => {
    try {
      const window = BrowserWindow.fromWebContents(event.sender);
      if (!window) {
        throw new Error('无法获取窗口实例');
      }

      if (window.isMaximized()) {
        window.unmaximize();
      } else {
        window.maximize();
      }

      return {
        success: true,
        data: { isMaximized: window.isMaximized() },
      };
    } catch (error) {
      logger.error('切换窗口最大化状态失败', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '切换最大化失败',
      };
    }
  });

  // 关闭窗口
  ipcMain.handle('window:close', async event => {
    try {
      const window = BrowserWindow.fromWebContents(event.sender);
      if (!window) {
        throw new Error('无法获取窗口实例');
      }

      window.close();

      return {
        success: true,
      };
    } catch (error) {
      logger.error('关闭窗口失败', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '关闭窗口失败',
      };
    }
  });

  // 调整窗口大小
  ipcMain.handle(
    'window:resize',
    async (event, width: number, height: number) => {
      try {
        logger.info('调整窗口大小', { width, height });

        const window = BrowserWindow.fromWebContents(event.sender);
        if (!window) {
          throw new Error('无法获取窗口实例');
        }

        // 确保尺寸值在合理范围内
        const validWidth = Math.max(200, Math.min(2000, width));
        const validHeight = Math.max(150, Math.min(1500, height));

        // 调整窗口大小
        window.setSize(validWidth, validHeight);

        logger.info('窗口大小调整成功', {
          width: validWidth,
          height: validHeight,
        });

        return {
          success: true,
          data: { width: validWidth, height: validHeight },
        };
      } catch (error) {
        logger.error('调整窗口大小失败', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : '调整窗口大小失败',
        };
      }
    }
  );

  logger.info('窗口处理器注册完成');
}

// 清理窗口处理器
export function cleanupWindowHandlers(): void {
  logger.info('清理窗口处理器...');

  // 移除所有窗口相关的IPC处理器
  ipcMain.removeHandler('window:setOpacity');
  ipcMain.removeHandler('window:getOpacity');
  ipcMain.removeHandler('window:setAlwaysOnTop');
  ipcMain.removeHandler('window:minimize');
  ipcMain.removeHandler('window:toggleMaximize');
  ipcMain.removeHandler('window:close');
  ipcMain.removeHandler('window:resize');

  logger.info('窗口处理器清理完成');
}
