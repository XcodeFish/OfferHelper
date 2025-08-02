import { app } from 'electron';

// 判断是否为开发环境
export const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

// 获取应用版本
export const getAppVersion = (): string => {
  return app.getVersion();
};

// 获取应用路径
export const getAppPath = (): string => {
  return app.getAppPath();
};

// 获取用户数据路径
export const getUserDataPath = (): string => {
  return app.getPath('userData');
};

// 获取日志路径
export const getLogsPath = (): string => {
  return app.getPath('logs');
};