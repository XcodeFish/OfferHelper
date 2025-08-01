// 应用常量
export const APP_NAME = 'OfferHelper';
export const APP_VERSION = '1.0.0';

// 窗口配置常量
export const WINDOW_CONFIG = {
  DEFAULT_WIDTH: 400,
  DEFAULT_HEIGHT: 600,
  MIN_WIDTH: 320,
  MIN_HEIGHT: 450,
  MAX_WIDTH: 600,
  MAX_HEIGHT: 800,
  DEFAULT_OPACITY: 0.9,
  MIN_OPACITY: 0.1,
  MAX_OPACITY: 1.0
} as const;

// 语音识别常量
export const SPEECH_CONFIG = {
  DEFAULT_LANGUAGE: 'zh-CN',
  SUPPORTED_LANGUAGES: ['zh-CN', 'en-US'],
  MAX_ALTERNATIVES: 3,
  RECOGNITION_TIMEOUT: 30000,
  SILENCE_TIMEOUT: 5000
} as const;

// AI 服务常量
export const AI_CONFIG = {
  MAX_TOKENS: 500,
  TEMPERATURE: 0.7,
  REQUEST_TIMEOUT: 30000,
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000
} as const;

// 隐私保护常量
export const PRIVACY_CONFIG = {
  CHECK_INTERVAL: 1000,
  HIDE_DELAY: 100,
  SHOW_DELAY: 500,
  DETECTION_TIMEOUT: 5000
} as const;

// 数据库常量
export const DATABASE_CONFIG = {
  MAX_HISTORY_RECORDS: 1000,
  MAX_KNOWLEDGE_ITEMS: 10000,
  CLEANUP_INTERVAL: 24 * 60 * 60 * 1000, // 24小时
  BACKUP_INTERVAL: 7 * 24 * 60 * 60 * 1000 // 7天
} as const;

// 网络请求常量
export const NETWORK_CONFIG = {
  REQUEST_TIMEOUT: 10000,
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000,
  USER_AGENT: `${APP_NAME}/${APP_VERSION}`
} as const;

// 文件路径常量
export const PATHS = {
  USER_DATA: 'userData',
  LOGS: 'logs',
  DATABASE: 'database',
  CONFIG: 'config',
  CACHE: 'cache',
  TEMP: 'temp'
} as const;

// 事件名称常量
export const EVENTS = {
  // 窗口事件
  WINDOW_SHOW: 'window:show',
  WINDOW_HIDE: 'window:hide',
  WINDOW_MINIMIZE: 'window:minimize',
  WINDOW_RESTORE: 'window:restore',
  WINDOW_CLOSE: 'window:close',

  // 语音识别事件
  SPEECH_START: 'speech:start',
  SPEECH_STOP: 'speech:stop',
  SPEECH_RESULT: 'speech:result',
  SPEECH_ERROR: 'speech:error',

  // AI 分析事件
  AI_ANALYZE_START: 'ai:analyze:start',
  AI_ANALYZE_SUCCESS: 'ai:analyze:success',
  AI_ANALYZE_ERROR: 'ai:analyze:error',

  // 隐私保护事件
  PRIVACY_SCREEN_SHARING_DETECTED: 'privacy:screen-sharing:detected',
  PRIVACY_SCREEN_SHARING_STOPPED: 'privacy:screen-sharing:stopped',
  PRIVACY_AUTO_HIDE: 'privacy:auto-hide',
  PRIVACY_AUTO_SHOW: 'privacy:auto-show',

  // 系统事件
  SYSTEM_READY: 'system:ready',
  SYSTEM_ERROR: 'system:error',
  SYSTEM_SHUTDOWN: 'system:shutdown'
} as const;

// 错误代码常量
export const ERROR_CODES = {
  // 通用错误
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  PERMISSION_ERROR: 'PERMISSION_ERROR',

  // 语音识别错误
  SPEECH_NOT_SUPPORTED: 'SPEECH_NOT_SUPPORTED',
  SPEECH_PERMISSION_DENIED: 'SPEECH_PERMISSION_DENIED',
  SPEECH_NETWORK_ERROR: 'SPEECH_NETWORK_ERROR',

  // AI 服务错误
  AI_API_ERROR: 'AI_API_ERROR',
  AI_QUOTA_EXCEEDED: 'AI_QUOTA_EXCEEDED',
  AI_INVALID_REQUEST: 'AI_INVALID_REQUEST',

  // 数据库错误
  DATABASE_CONNECTION_ERROR: 'DATABASE_CONNECTION_ERROR',
  DATABASE_QUERY_ERROR: 'DATABASE_QUERY_ERROR',
  DATABASE_MIGRATION_ERROR: 'DATABASE_MIGRATION_ERROR'
} as const;

// 主题常量
export const THEMES = {
  DARK: 'dark',
  LIGHT: 'light'
} as const;

// 动画常量
export const ANIMATIONS = {
  DURATION: {
    FAST: 150,
    NORMAL: 300,
    SLOW: 500
  },
  EASING: {
    EASE_IN: 'ease-in',
    EASE_OUT: 'ease-out',
    EASE_IN_OUT: 'ease-in-out'
  }
} as const;