declare global {
  interface Window {
    electronAPI: {
      // 应用相关
      app: {
        getVersion: () => Promise<string>;
        getPlatform: () => Promise<string>;
      };

        connect: () => Promise<{ success: boolean; error?: string }>;
        disconnect: () => Promise<{ success: boolean; error?: string }>;
        startRecording: () => Promise<{ success: boolean; error?: string }>;
        stopRecording: () => Promise<{ success: boolean; error?: string }>;
        getConnectionStatus: () => Promise<{
          success: boolean;
          data?: {
            isConnected: boolean;
            isRecording: boolean;
            connectionState: string;
            hasRecognizer: boolean;
            voiceId?: string;
          };
          error?: string;
        }>;
        getAudioDevices: () => Promise<{
          success: boolean;
          data?: any[];
          error?: string;
        }>;
        getConfig: () => Promise<{
          success: boolean;
          data?: {
            appId: string;
            secretId: string;
            secretKey: string;
          };
          error?: string;
        }>;
        sendAudio: (
          audioData: ArrayBuffer
        ) => Promise<{ success: boolean; error?: string }>;
        sendEnd: () => Promise<{ success: boolean; error?: string }>;
        reconnect: () => Promise<{ success: boolean; error?: string }>;
        onResult: (callback: (result: any) => void) => void;
        onFinalResult: (callback: (result: any) => void) => void;
        onSentenceBegin: (callback: (result: any) => void) => void;
        onSentenceEnd: (callback: (result: any) => void) => void;
        onRecognitionResultChange: (callback: (result: any) => void) => void;
        onRecognitionComplete: (callback: (result: any) => void) => void;
        onRecordingStart: (callback: () => void) => void;
        onRecordingStop: (callback: () => void) => void;
        onError: (callback: (error: any) => void) => void;
        onConnected: (callback: () => void) => void;
        onDisconnected: (callback: (data: any) => void) => void;
        onConnecting: (callback: () => void) => void;
        onInitialized: (callback: () => void) => void;
        removeAllListeners?: () => void;
>>>>>>> 9d5cdfd (fix: 移除硬编码的敏感信息，使用环境变量替代)
      };
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
        connect: () => Promise<{ success: boolean; error?: string }>;
        disconnect: () => Promise<{ success: boolean; error?: string }>;
        startRecording: () => Promise<{ success: boolean; error?: string }>;
        stopRecording: () => Promise<{ success: boolean; error?: string }>;
        getConnectionStatus: () => Promise<{
          success: boolean;
          data?: {
            isConnected: boolean;
            isRecording: boolean;
            connectionState: string;
            hasRecognizer: boolean;
            voiceId?: string;
          };
          error?: string;
        }>;
        getAudioDevices: () => Promise<{
          success: boolean;
          data?: any[];
          error?: string;
        }>;
        getConfig: () => Promise<{
          success: boolean;
          data?: {
            appId: string;
            secretId: string;
            secretKey: string;
          };
          error?: string;
        }>;
        sendAudio: (
          audioData: ArrayBuffer
        ) => Promise<{ success: boolean; error?: string }>;
        sendEnd: () => Promise<{ success: boolean; error?: string }>;
        reconnect: () => Promise<{ success: boolean; error?: string }>;
        onResult: (callback: (result: any) => void) => void;
        onFinalResult: (callback: (result: any) => void) => void;
        onSentenceBegin: (callback: (result: any) => void) => void;
        onSentenceEnd: (callback: (result: any) => void) => void;
        onRecognitionResultChange: (callback: (result: any) => void) => void;
        onRecognitionComplete: (callback: (result: any) => void) => void;
        onRecordingStart: (callback: () => void) => void;
        onRecordingStop: (callback: () => void) => void;
        onError: (callback: (error: any) => void) => void;
        onConnected: (callback: () => void) => void;
        onDisconnected: (callback: (data: any) => void) => void;
        onConnecting: (callback: () => void) => void;
        onInitialized: (callback: () => void) => void;
        removeAllListeners?: () => void;
      };
=======
        connect: () => Promise<{ success: boolean; error?: string }>;
        disconnect: () => Promise<{ success: boolean; error?: string }>;
        startRecording: () => Promise<{ success: boolean; error?: string }>;
        stopRecording: () => Promise<{ success: boolean; error?: string }>;
        getConnectionStatus: () => Promise<{
          success: boolean;
          data?: {
            isConnected: boolean;
            isRecording: boolean;
            connectionState: string;
            hasRecognizer: boolean;
            voiceId?: string;
          };
          error?: string;
        }>;
        getAudioDevices: () => Promise<{
          success: boolean;
          data?: any[];
          error?: string;
        }>;
        getConfig: () => Promise<{
          success: boolean;
          data?: {
            appId: string;
            secretId: string;
            secretKey: string;
          };
          error?: string;
        }>;
        sendAudio: (
          audioData: ArrayBuffer
        ) => Promise<{ success: boolean; error?: string }>;
        sendEnd: () => Promise<{ success: boolean; error?: string }>;
        reconnect: () => Promise<{ success: boolean; error?: string }>;
        onResult: (callback: (result: any) => void) => void;
        onFinalResult: (callback: (result: any) => void) => void;
        onSentenceBegin: (callback: (result: any) => void) => void;
        onSentenceEnd: (callback: (result: any) => void) => void;
        onRecognitionResultChange: (callback: (result: any) => void) => void;
        onRecognitionComplete: (callback: (result: any) => void) => void;
        onRecordingStart: (callback: () => void) => void;
        onRecordingStop: (callback: () => void) => void;
        onError: (callback: (error: any) => void) => void;
        onConnected: (callback: () => void) => void;
        onDisconnected: (callback: (data: any) => void) => void;
        onConnecting: (callback: () => void) => void;
        onInitialized: (callback: () => void) => void;
        removeAllListeners?: () => void;
>>>>>>> 9d5cdfd (fix: 移除硬编码的敏感信息，使用环境变量替代)
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
        get: (key?: string) => Promise<{
          success: boolean;
          data?: any;
          settings?: any;
          error?: string;
        }>;
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
        ) => Promise<{
          success: boolean;
          theme?: string;
          data?: { theme: string };
          error?: string;
        }>;
        get: () => Promise<{
          success: boolean;
          theme?: string;
          data?: { theme: string };
          error?: string;
        }>;
        getSystemTheme: () => Promise<{
          success: boolean;
          theme?: string;
          data?: { theme: string };
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
