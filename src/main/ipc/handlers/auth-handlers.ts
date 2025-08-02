import { IpcMainInvokeEvent } from 'electron';
import { AuthService } from '../../services/auth-service';

const authService = new AuthService();

export const authHandlers = {
  'auth:login': async (
    event: IpcMainInvokeEvent,
    credentials: { username: string; password: string }
  ) => {
    try {
      return await authService.login(credentials);
    } catch (error) {
      console.error('登录失败:', error);
      throw error;
    }
  },

  'auth:logout': async (event: IpcMainInvokeEvent) => {
    try {
      return await authService.logout();
    } catch (error) {
      console.error('登出失败:', error);
      throw error;
    }
  },

  'auth:get-user': async (event: IpcMainInvokeEvent) => {
    try {
      return await authService.getCurrentUser();
    } catch (error) {
      console.error('获取用户信息失败:', error);
      throw error;
    }
  },

  'auth:refresh-token': async (event: IpcMainInvokeEvent) => {
    try {
      return await authService.refreshToken();
    } catch (error) {
      console.error('刷新令牌失败:', error);
      throw error;
    }
  },

  'auth:validate-token': async (event: IpcMainInvokeEvent, token: string) => {
    try {
      return await authService.validateToken(token);
    } catch (error) {
      console.error('验证令牌失败:', error);
      throw error;
    }
  },
};
