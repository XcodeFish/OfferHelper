declare global {
  interface Window {
    electronAPI: {
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
        get: (
          key?: string
        ) => Promise<{ success: boolean; settings?: any; error?: string }>;
        set: (
          key: string,
          value: any
        ) => Promise<{ success: boolean; error?: string }>;
        reset: () => Promise<{ success: boolean; error?: string }>;
        export: () => Promise<{
          success: boolean;
          settings?: any;
          error?: string;
        }>;
        import: (
          settings: any
        ) => Promise<{ success: boolean; error?: string }>;
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
        setAlwaysOnTop: (alwaysOnTop: boolean) => Promise<{
          success: boolean;
          alwaysOnTop?: boolean;
          error?: string;
        }>;
        resize: (
          width: number,
          height: number
        ) => Promise<{
          success: boolean;
          width?: number;
          height?: number;
          error?: string;
        }>;
      };

      // 主题相关
      theme: {
        set: (
          theme: 'light' | 'dark' | 'auto'
        ) => Promise<{ success: boolean; theme?: string; error?: string }>;
        get: () => Promise<{
          success: boolean;
          theme?: string;
          error?: string;
        }>;
        getSystemTheme: () => Promise<{
          success: boolean;
          theme?: string;
          error?: string;
        }>;
        onChanged: (callback: (theme: string) => void) => void;
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
    };
  }
}

export {};
