import { ipcMain, BrowserWindow } from 'electron';
import { SettingsService } from '../../services/settings-service';

// 创建设置服务实例
const settingsService = new SettingsService();

export function setupSettingsHandlers() {
  // 获取设置
  ipcMain.handle('settings:get', async (event, key?: string) => {
    try {
      const settings = await settingsService.get(key);
      return { success: true, settings };
    } catch (error) {
      console.error('获取设置失败:', error);
      return { success: false, error: (error as Error).message };
    }
  });

  // 保存设置
  ipcMain.handle('settings:set', async (event, key: string, value: any) => {
    try {
      await settingsService.set(key, value);
      console.log('设置已保存:', key, value);

      // 如果是界面设置，立即应用相关变化
      if (key === 'uiSettings' && value) {
        const focusedWindow = BrowserWindow.getFocusedWindow();
        if (focusedWindow) {
          // 应用透明度设置
          if (typeof value.opacity === 'number') {
            focusedWindow.setOpacity(value.opacity / 100);
          }

          // 应用置顶设置
          if (typeof value.alwaysOnTop === 'boolean') {
            focusedWindow.setAlwaysOnTop(value.alwaysOnTop);
          }
        }
      }

      return { success: true };
    } catch (error) {
      console.error('保存设置失败:', error);
      return { success: false, error: (error as Error).message };
    }
  });

  // 重置设置
  ipcMain.handle('settings:reset', async () => {
    try {
      await settingsService.reset();
      console.log('设置已重置');
      return { success: true };
    } catch (error) {
      console.error('重置设置失败:', error);
      return { success: false, error: (error as Error).message };
    }
  });

  // 导出设置
  ipcMain.handle('settings:export', async () => {
    try {
      const settings = await settingsService.export();
      return { success: true, settings };
    } catch (error) {
      console.error('导出设置失败:', error);
      return { success: false, error: (error as Error).message };
    }
  });

  // 导入设置
  ipcMain.handle('settings:import', async (event, settings) => {
    try {
      await settingsService.import(settings);
      console.log('设置已导入');
      return { success: true };
    } catch (error) {
      console.error('导入设置失败:', error);
      return { success: false, error: (error as Error).message };
    }
  });

  // 设置窗口透明度
  ipcMain.handle('window:setOpacity', async (event, opacity: number) => {
    try {
      const focusedWindow = BrowserWindow.getFocusedWindow();
      if (focusedWindow) {
        // 确保透明度值在有效范围内
        const validOpacity = Math.max(0.1, Math.min(1, opacity));
        focusedWindow.setOpacity(validOpacity);
        return { success: true, opacity: validOpacity };
      }
      return { success: false, error: '未找到活动窗口' };
    } catch (error) {
      console.error('设置窗口透明度失败:', error);
      return { success: false, error: (error as Error).message };
    }
  });

  // 获取当前窗口透明度
  ipcMain.handle('window:getOpacity', async () => {
    try {
      const focusedWindow = BrowserWindow.getFocusedWindow();
      if (focusedWindow) {
        const opacity = focusedWindow.getOpacity();
        return { success: true, opacity };
      }
      return { success: false, error: '未找到活动窗口' };
    } catch (error) {
      console.error('获取窗口透明度失败:', error);
      return { success: false, error: (error as Error).message };
    }
  });

  // 设置窗口置顶
  ipcMain.handle(
    'window:setAlwaysOnTop',
    async (event, alwaysOnTop: boolean) => {
      try {
        const focusedWindow = BrowserWindow.getFocusedWindow();
        if (focusedWindow) {
          focusedWindow.setAlwaysOnTop(alwaysOnTop);
          return { success: true, alwaysOnTop };
        }
        return { success: false, error: '未找到活动窗口' };
      } catch (error) {
        console.error('设置窗口置顶失败:', error);
        return { success: false, error: (error as Error).message };
      }
    }
  );

  // 设置主题
  ipcMain.handle(
    'theme:set',
    async (event, theme: 'light' | 'dark' | 'auto') => {
      try {
        // 这里可以保存主题设置到本地存储
        console.log('设置主题:', theme);

        // 通知渲染进程主题已更改
        const focusedWindow = BrowserWindow.getFocusedWindow();
        if (focusedWindow) {
          focusedWindow.webContents.send('theme:changed', theme);
        }

        return { success: true, theme };
      } catch (error) {
        console.error('设置主题失败:', error);
        return { success: false, error: (error as Error).message };
      }
    }
  );

  // 获取当前主题
  ipcMain.handle('theme:get', async () => {
    try {
      // 从本地存储获取主题，这里返回默认值
      return { success: true, theme: 'dark' };
    } catch (error) {
      console.error('获取主题失败:', error);
      return { success: false, error: (error as Error).message };
    }
  });

  // 获取系统主题
  ipcMain.handle('theme:getSystemTheme', async () => {
    try {
      const { nativeTheme } = require('electron');
      const systemTheme = nativeTheme.shouldUseDarkColors ? 'dark' : 'light';
      return { success: true, theme: systemTheme };
    } catch (error) {
      console.error('获取系统主题失败:', error);
      return { success: false, error: (error as Error).message };
    }
  });

  // 监听系统主题变化
  const { nativeTheme } = require('electron');
  nativeTheme.on('updated', () => {
    const systemTheme = nativeTheme.shouldUseDarkColors ? 'dark' : 'light';
    console.log('系统主题已变化:', systemTheme);

    // 通知所有窗口系统主题已变化
    BrowserWindow.getAllWindows().forEach(window => {
      window.webContents.send('system-theme:changed', systemTheme);
    });
  });

  // 窗口控制
  ipcMain.handle('window:minimize', async () => {
    try {
      const focusedWindow = BrowserWindow.getFocusedWindow();
      if (focusedWindow) {
        focusedWindow.minimize();
        return { success: true };
      }
      return { success: false, error: '未找到活动窗口' };
    } catch (error) {
      console.error('最小化窗口失败:', error);
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('window:hide', async () => {
    try {
      const focusedWindow = BrowserWindow.getFocusedWindow();
      if (focusedWindow) {
        focusedWindow.hide();
        return { success: true };
      }
      return { success: false, error: '未找到活动窗口' };
    } catch (error) {
      console.error('隐藏窗口失败:', error);
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('window:close', async () => {
    try {
      const focusedWindow = BrowserWindow.getFocusedWindow();
      if (focusedWindow) {
        focusedWindow.close();
        return { success: true };
      }
      return { success: false, error: '未找到活动窗口' };
    } catch (error) {
      console.error('关闭窗口失败:', error);
      return { success: false, error: (error as Error).message };
    }
  });

  // 调整窗口大小
  ipcMain.handle(
    'window:resize',
    async (event, width: number, height: number) => {
      try {
        const focusedWindow = BrowserWindow.getFocusedWindow();
        if (focusedWindow) {
          focusedWindow.setSize(width, height);
          return { success: true, width, height };
        }
        return { success: false, error: '未找到活动窗口' };
      } catch (error) {
        console.error('调整窗口大小失败:', error);
        return { success: false, error: (error as Error).message };
      }
    }
  );
}
