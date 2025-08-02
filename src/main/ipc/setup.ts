import { ipcMain } from 'electron';
import { voiceHandlers } from './handlers/voice-handlers';
import { aiHandlers } from './handlers/ai-handlers';
import { authHandlers } from './handlers/auth-handlers';
import { setupSettingsHandlers } from './handlers/settings-handlers';

export function setupIpcHandlers(): void {
  // 语音相关处理器
  Object.entries(voiceHandlers).forEach(([channel, handler]) => {
    ipcMain.handle(channel, handler);
  });

  // AI相关处理器
  Object.entries(aiHandlers).forEach(([channel, handler]) => {
    ipcMain.handle(channel, handler);
  });

  // 认证相关处理器
  Object.entries(authHandlers).forEach(([channel, handler]) => {
    ipcMain.handle(channel, handler);
  });

  // 设置和窗口控制处理器（包含透明度功能）
  setupSettingsHandlers();

  // 通用处理器
  ipcMain.handle('app:get-version', () => {
    return process.env.npm_package_version || '1.0.0';
  });

  ipcMain.handle('app:get-platform', () => {
    return process.platform;
  });
}
