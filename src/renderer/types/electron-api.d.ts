// Electron API 类型定义
interface ElectronAPI {
  // 认证相关
  auth?: {
    login: (credentials: { username: string; password: string }) => Promise<{
      success: boolean;
      data?: { user: any; token: string };
      error?: string;
    }>;
    logout: () => Promise<{ success: boolean; error?: string }>;
    getCurrentUser: () => Promise<{
      success: boolean;
      data?: any;
      error?: string;
    }>;
  };

  // 设置相关
  settings?: {
    getAll: () => Promise<{ success: boolean; data?: any; error?: string }>;
    get: (
      key: string
    ) => Promise<{ success: boolean; data?: any; error?: string }>;
    set: (
      key: string,
      value: any
    ) => Promise<{ success: boolean; data?: any; error?: string }>;
    update: (
      updates: any
    ) => Promise<{ success: boolean; data?: any; error?: string }>;
    reset: () => Promise<{ success: boolean; data?: any; error?: string }>;
    export: () => Promise<{ success: boolean; data?: any; error?: string }>;
    import: (
      importData: any
    ) => Promise<{ success: boolean; data?: any; error?: string }>;
  };

  // 语音相关
  voice?: {
    getConfig: () => Promise<{
      success: boolean;
      data?: {
        appId: string;
        secretId: string;
        secretKey: string;
      };
      error?: string;
    }>;
    startRecording: () => Promise<{ success: boolean; error?: string }>;
    stopRecording: () => Promise<{ success: boolean; error?: string }>;
  };

  // AI相关
  ai?: {
    generateAnswer: (
      question: string,
      mode?: string
    ) => Promise<{
      success: boolean;
      data?: { answer: string };
      error?: string;
    }>;
  };

  // 窗口相关
  window?: {
    setOpacity: (opacity: number) => Promise<{
      success: boolean;
      data?: { opacity: number };
      error?: string;
    }>;
    getOpacity: () => Promise<{
      success: boolean;
      data?: { opacity: number };
      error?: string;
    }>;
    setAlwaysOnTop: (alwaysOnTop: boolean) => Promise<{
      success: boolean;
      data?: { alwaysOnTop: boolean };
      error?: string;
    }>;
    minimize: () => Promise<{
      success: boolean;
      error?: string;
    }>;
    toggleMaximize: () => Promise<{
      success: boolean;
      data?: { isMaximized: boolean };
      error?: string;
    }>;
    close: () => Promise<{
      success: boolean;
      error?: string;
    }>;
    resize: (
      width: number,
      height: number
    ) => Promise<{
      success: boolean;
      data?: { width: number; height: number };
      error?: string;
    }>;
  };

  // 主题相关
  theme?: {
    set: (theme: string) => Promise<{
      success: boolean;
      data?: { theme: string };
      error?: string;
    }>;
    get: () => Promise<{
      success: boolean;
      data?: { theme: string };
      error?: string;
    }>;
    getSystemTheme: () => Promise<{
      success: boolean;
      data?: { theme: string };
      error?: string;
    }>;
    onChanged: (callback: (theme: string) => void) => void;
  };
}

export {};
