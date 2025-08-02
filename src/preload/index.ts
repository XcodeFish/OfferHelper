import { contextBridge, ipcRenderer } from 'electron';

// 定义API接口
interface ElectronAPI {
  // 应用控制
  app: {
    quit: () => Promise<void>;
    restart: () => Promise<void>;
    getVersion: () => Promise<string>;
  };
  
  // 窗口控制
  window: {
    minimize: () => Promise<void>;
    hide: () => Promise<void>;
    show: () => Promise<void>;
    toggleVisibility: () => Promise<void>;
  };

  // 隐私保护
  privacy: {
    startMonitoring: () => Promise<void>;
    stopMonitoring: () => Promise<void>;
  };

  // 语音识别
  speech: {
    start: () => Promise<void>;
    stop: () => Promise<void>;
  };

  // 腾讯云语音识别
  tencentSpeech: {
    initialize: (config: any) => Promise<any>;
    start: () => Promise<any>;
    stop: () => Promise<any>;
    sendAudio: (audioData: Uint8Array | ArrayBuffer) => Promise<any>;
    getStatus: () => Promise<any>;
    test?: () => Promise<any>;
  };

  // AI分析
  ai: {
    analyze: (question: string) => Promise<any>;
  };

  // 事件监听
  on: (channel: string, callback: (...args: any[]) => void) => void;
  off: (channel: string, callback: (...args: any[]) => void) => void;
  removeAllListeners: (channel: string) => void;
}

// 暴露安全的API给渲染进程
const electronAPI: ElectronAPI = {
  // 应用控制
  app: {
    quit: () => ipcRenderer.invoke('app:quit'),
    restart: () => ipcRenderer.invoke('app:restart'),
    getVersion: () => ipcRenderer.invoke('app:get-version'),
  },

  // 窗口控制
  window: {
    minimize: () => ipcRenderer.invoke('window:minimize'),
    hide: () => ipcRenderer.invoke('window:hide'),
    show: () => ipcRenderer.invoke('window:show'),
    toggleVisibility: () => ipcRenderer.invoke('window:toggle-visibility'),
  },

  // 隐私保护
  privacy: {
    startMonitoring: () => ipcRenderer.invoke('privacy:start-monitoring'),
    stopMonitoring: () => ipcRenderer.invoke('privacy:stop-monitoring'),
  },

  // 语音识别
  speech: {
    start: () => ipcRenderer.invoke('speech:start'),
    stop: () => ipcRenderer.invoke('speech:stop'),
  },

  // 腾讯云语音识别
  tencentSpeech: {
    initialize: (config: any) => ipcRenderer.invoke('tencent-speech:initialize', config),
    start: () => ipcRenderer.invoke('tencent-speech:start'),
    stop: () => ipcRenderer.invoke('tencent-speech:stop'),
    sendAudio: (audioData: Uint8Array | ArrayBuffer) => ipcRenderer.invoke('tencent-speech:send-audio', audioData),
    getStatus: () => ipcRenderer.invoke('tencent-speech:get-status'),
    test: () => ipcRenderer.invoke('tencent-speech:test'),
  },

  // AI分析
  ai: {
    analyze: (question: string) => ipcRenderer.invoke('ai:analyze', question),
  },

  // 事件监听
  on: (channel: string, callback: (...args: any[]) => void) => {
    const wrappedCallback = (event: any, ...args: any[]) => callback(...args);
    // Store the wrapped callback on the original callback for later removal
    (callback as any)._wrappedCallback = wrappedCallback;
    ipcRenderer.on(channel, wrappedCallback);
  },

  off: (channel: string, callback: (...args: any[]) => void) => {
    const wrappedCallback = (callback as any)._wrappedCallback;
    if (wrappedCallback) {
      ipcRenderer.off(channel, wrappedCallback);
      delete (callback as any)._wrappedCallback;
    }
  },

  removeAllListeners: (channel: string) => {
    ipcRenderer.removeAllListeners(channel);
  }
};

contextBridge.exposeInMainWorld('electron', electronAPI);

// 添加调试日志
console.log('Preload script loaded successfully');
console.log('ElectronAPI exposed to window.electron');

// 类型声明
declare global {
  interface Window {
    electron: ElectronAPI;
  }
}
