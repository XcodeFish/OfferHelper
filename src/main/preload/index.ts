import { contextBridge, ipcRenderer } from 'electron';

// 定义API接口
interface ElectronAPI {
  // 应用相关
  app: {
    getVersion: () => Promise<string>;
    getPlatform: () => Promise<string>;
  };

  // 语音相关
  voice: {
    startRecording: () => Promise<{ success: boolean; message: string }>;
    stopRecording: () => Promise<{ success: boolean; audioData?: Buffer }>;
    getRecordingStatus: () => Promise<{ isRecording: boolean }>;
    transcribe: (
      audioData: Buffer
    ) => Promise<{ text: string; confidence: number }>;
  };

  // AI相关
  ai: {
    chat: (
      message: string,
      context?: any
    ) => Promise<{ response: string; usage?: any }>;
    generateResponse: (
      prompt: string,
      options?: any
    ) => Promise<{ response: string }>;
    getModels: () => Promise<string[]>;
  };

  // 设置相关
  settings: {
    get: (key?: string) => Promise<any>;
    set: (settings: any) => Promise<{ success: boolean; error?: string }>;
    reset: () => Promise<void>;
    export: () => Promise<any>;
    import: (settings: any) => Promise<void>;
  };

  // 窗口控制相关
  window: {
    minimize: () => Promise<{ success: boolean; error?: string }>;
    hide: () => Promise<{ success: boolean; error?: string }>;
    close: () => Promise<{ success: boolean; error?: string }>;
    setOpacity: (
      opacity: number
    ) => Promise<{ success: boolean; opacity?: number; error?: string }>;
    getOpacity: () => Promise<{
      success: boolean;
      opacity?: number;
      error?: string;
    }>;
    setAlwaysOnTop: (
      alwaysOnTop: boolean
    ) => Promise<{ success: boolean; alwaysOnTop?: boolean; error?: string }>;
  };

  // 认证相关
  auth: {
    login: (credentials: {
      username: string;
      password: string;
    }) => Promise<{ user: any; token: string }>;
    logout: () => Promise<void>;
    getUser: () => Promise<any>;
    refreshToken: () => Promise<string>;
    validateToken: (token: string) => Promise<boolean>;
  };

  // 主题相关
  theme: {
    set: (
      theme: 'light' | 'dark' | 'auto'
    ) => Promise<{ success: boolean; theme?: string; error?: string }>;
    get: () => Promise<{ success: boolean; theme?: string; error?: string }>;
    getSystemTheme: () => Promise<{
      success: boolean;
      theme?: string;
      error?: string;
    }>;
    onChanged: (callback: (theme: string) => void) => void;
  };
}

// 暴露API到渲染进程
const electronAPI: ElectronAPI = {
  app: {
    getVersion: () => ipcRenderer.invoke('app:get-version'),
    getPlatform: () => ipcRenderer.invoke('app:get-platform'),
  },

  voice: {
    startRecording: () => ipcRenderer.invoke('voice:start-recording'),
    stopRecording: () => ipcRenderer.invoke('voice:stop-recording'),
    getRecordingStatus: () => ipcRenderer.invoke('voice:get-recording-status'),
    transcribe: (audioData: Buffer) =>
      ipcRenderer.invoke('voice:transcribe', audioData),
  },

  ai: {
    chat: (message: string, context?: any) =>
      ipcRenderer.invoke('ai:chat', message, context),
    generateResponse: (prompt: string, options?: any) =>
      ipcRenderer.invoke('ai:generate-response', prompt, options),
    getModels: () => ipcRenderer.invoke('ai:get-models'),
  },

  settings: {
    get: (key?: string) => ipcRenderer.invoke('settings:get', key),
    set: (settings: any) => ipcRenderer.invoke('settings:set', settings),
    reset: () => ipcRenderer.invoke('settings:reset'),
    export: () => ipcRenderer.invoke('settings:export'),
    import: (settings: any) => ipcRenderer.invoke('settings:import', settings),
  },

  window: {
    minimize: () => ipcRenderer.invoke('window:minimize'),
    hide: () => ipcRenderer.invoke('window:hide'),
    close: () => ipcRenderer.invoke('window:close'),
    setOpacity: (opacity: number) =>
      ipcRenderer.invoke('window:setOpacity', opacity),
    getOpacity: () => ipcRenderer.invoke('window:getOpacity'),
    setAlwaysOnTop: (alwaysOnTop: boolean) =>
      ipcRenderer.invoke('window:setAlwaysOnTop', alwaysOnTop),
  },

  theme: {
    set: (theme: 'light' | 'dark' | 'auto') =>
      ipcRenderer.invoke('theme:set', theme),
    get: () => ipcRenderer.invoke('theme:get'),
    getSystemTheme: () => ipcRenderer.invoke('theme:getSystemTheme'),
    onChanged: (callback: (theme: string) => void) => {
      ipcRenderer.on('theme:changed', (_, theme) => callback(theme));
    },
  },

  auth: {
    login: (credentials: { username: string; password: string }) =>
      ipcRenderer.invoke('auth:login', credentials),
    logout: () => ipcRenderer.invoke('auth:logout'),
    getUser: () => ipcRenderer.invoke('auth:get-user'),
    refreshToken: () => ipcRenderer.invoke('auth:refresh-token'),
    validateToken: (token: string) =>
      ipcRenderer.invoke('auth:validate-token', token),
  },
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);

// 类型声明
declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
