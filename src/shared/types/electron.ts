export interface ElectronAPI {
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

  // 腾讯语音识别
  tencentSpeech: {
    initialize: (config: any) => Promise<{ success: boolean; error?: string }>;
    start: () => Promise<{ success: boolean; error?: string }>;
    stop: () => Promise<{ success: boolean; error?: string }>;
    sendAudio: (audioData: ArrayBuffer) => Promise<{ success: boolean; error?: string }>;
    onResult: (callback: (result: any) => void) => void;
    onError: (callback: (error: any) => void) => void;
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

