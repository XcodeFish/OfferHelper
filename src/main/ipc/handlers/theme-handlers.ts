import { ipcMain, BrowserWindow, nativeTheme } from 'electron';

/**
 * 注册主题相关的IPC处理器
 */
export function registerThemeHandlers(): void {
  // 设置主题
  ipcMain.handle('theme:set', async (event, theme: string) => {
    try {
      console.log('设置主题:', theme);

      // 获取当前的主窗口
      const mainWindow =
        BrowserWindow.getFocusedWindow() || BrowserWindow.getAllWindows()[0];
      if (!mainWindow) {
        throw new Error('主窗口未找到');
      }

      // 这里可以添加主题相关的逻辑
      // 比如保存主题设置到配置文件
      // 或者通知渲染进程主题已更改

      // 通知渲染进程主题已更改
      mainWindow.webContents.send('theme:changed', theme);

      return {
        success: true,
        data: { theme },
      };
    } catch (error) {
      console.error('设置主题失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '设置主题失败',
      };
    }
  });

  // 获取当前主题
  ipcMain.handle('theme:get', async () => {
    try {
      // 这里可以从配置文件或其他地方获取当前主题
      // 暂时返回默认主题
      const currentTheme = 'dark'; // 可以从设置中获取

      return {
        success: true,
        data: { theme: currentTheme },
      };
    } catch (error) {
      console.error('获取主题失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '获取主题失败',
      };
    }
  });

  // 获取系统主题
  ipcMain.handle('theme:getSystemTheme', async () => {
    try {
      // 使用 nativeTheme 获取系统主题偏好
      const systemTheme = nativeTheme.shouldUseDarkColors ? 'dark' : 'light';

      return {
        success: true,
        data: { theme: systemTheme },
      };
    } catch (error) {
      console.error('获取系统主题失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '获取系统主题失败',
      };
    }
  });

  console.log('主题处理器已注册');
}

/**
 * 清理主题处理器
 */
export function cleanupThemeHandlers(): void {
  ipcMain.removeAllListeners('theme:set');
  ipcMain.removeAllListeners('theme:get');
  console.log('主题处理器已清理');
}
