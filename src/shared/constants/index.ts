// IPC通道常量
export const IPC_CHANNELS = {
  // 应用相关
  APP_GET_VERSION: 'app:get-version',
  APP_GET_PLATFORM: 'app:get-platform',

  // 语音相关
  VOICE_START_RECORDING: 'voice:start-recording',
  VOICE_STOP_RECORDING: 'voice:stop-recording',
  VOICE_GET_STATUS: 'voice:get-recording-status',
  VOICE_TRANSCRIBE: 'voice:transcribe',

  // AI相关
  AI_CHAT: 'ai:chat',
  AI_GENERATE_RESPONSE: 'ai:generate-response',
  AI_GET_MODELS: 'ai:get-models',

  // 设置相关
  SETTINGS_GET: 'settings:get',
  SETTINGS_SET: 'settings:set',
  SETTINGS_RESET: 'settings:reset',
  SETTINGS_EXPORT: 'settings:export',
  SETTINGS_IMPORT: 'settings:import',

  // 认证相关
  AUTH_LOGIN: 'auth:login',
  AUTH_LOGOUT: 'auth:logout',
  AUTH_GET_USER: 'auth:get-user',
  AUTH_REFRESH_TOKEN: 'auth:refresh-token',
  AUTH_VALIDATE_TOKEN: 'auth:validate-token',
} as const;

// 应用常量
export const APP_CONFIG = {
  NAME: 'AI语音助手',
  VERSION: '1.0.0',
  DESCRIPTION: '基于智谱AI和腾讯云语音识别的桌面助手',
  AUTHOR: 'Your Name',

  // 窗口配置
  WINDOW: {
    MIN_WIDTH: 800,
    MIN_HEIGHT: 600,
    DEFAULT_WIDTH: 1200,
    DEFAULT_HEIGHT: 800,
  },

  // API配置
  API: {
    TIMEOUT: 30000,
    RETRY_COUNT: 3,
    RETRY_DELAY: 1000,
  },
} as const;

// 主题常量
export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system',
} as const;

// 语言常量
export const LANGUAGES = {
  ZH_CN: 'zh-CN',
  EN_US: 'en-US',
} as const;

// AI模型常量
export const AI_MODELS = {
  GLM_4: 'glm-4',
  GLM_3_TURBO: 'glm-3-turbo',
  CHATGLM_PRO: 'chatglm_pro',
} as const;

// 错误代码常量
export const ERROR_CODES = {
  // 通用错误
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',

  // 认证错误
  AUTH_FAILED: 'AUTH_FAILED',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',

  // 语音错误
  RECORDING_FAILED: 'RECORDING_FAILED',
  TRANSCRIPTION_FAILED: 'TRANSCRIPTION_FAILED',
  AUDIO_DEVICE_ERROR: 'AUDIO_DEVICE_ERROR',

  // AI错误
  AI_API_ERROR: 'AI_API_ERROR',
  MODEL_NOT_AVAILABLE: 'MODEL_NOT_AVAILABLE',
  QUOTA_EXCEEDED: 'QUOTA_EXCEEDED',
} as const;
