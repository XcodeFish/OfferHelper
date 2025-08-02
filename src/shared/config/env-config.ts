/**
 * 环境变量配置管理器
 * 提供类型安全的环境变量访问
 */

export interface TencentASRConfig {
  secretId: string;
  secretKey: string;
  appId: string;
  asrUrl: string;
  engineModelType: string;
  voiceFormat: number;
  hotwordId?: string;
  customizationId?: string;
  filterDirty: number;
  filterModal: number;
  filterPunc: number;
  convertNumMode: number;
  wordInfo: number;
  vadSilenceTime: number;
  noiseThreshold: number;
  maxSpeakTime: number;
}

export interface AppConfig {
  nodeEnv: string;
  isDev: boolean;
  aiApiBaseUrl: string;
  logLevel: string;
  autoUpdateUrl: string;
  tencentASR: TencentASRConfig;
}

/**
 * 获取腾讯云实时语音识别配置
 */
export function getTencentASRConfig(): TencentASRConfig {
  const config: TencentASRConfig = {
    secretId: process.env.TENCENT_SECRET_ID || '',
    secretKey: process.env.TENCENT_SECRET_KEY || '',
    appId: process.env.TENCENT_APP_ID || '',
    asrUrl: process.env.TENCENT_CLOUD_ASR_URL || 'wss://asr.tencentcloudapi.com',
    engineModelType: process.env.TENCENT_ASR_ENGINE_MODEL_TYPE || '16k_zh',
    voiceFormat: parseInt(process.env.TENCENT_ASR_VOICE_FORMAT || '1'),
    hotwordId: process.env.TENCENT_ASR_HOTWORD_ID || undefined,
    customizationId: process.env.TENCENT_ASR_CUSTOMIZATION_ID || undefined,
    filterDirty: parseInt(process.env.TENCENT_ASR_FILTER_DIRTY || '1'),
    filterModal: parseInt(process.env.TENCENT_ASR_FILTER_MODAL || '2'),
    filterPunc: parseInt(process.env.TENCENT_ASR_FILTER_PUNC || '0'),
    convertNumMode: parseInt(process.env.TENCENT_ASR_CONVERT_NUM_MODE || '1'),
    wordInfo: parseInt(process.env.TENCENT_ASR_WORD_INFO || '0'),
    vadSilenceTime: parseInt(process.env.TENCENT_ASR_VAD_SILENCE_TIME || '1000'),
    noiseThreshold: parseFloat(process.env.TENCENT_ASR_NOISE_THRESHOLD || '0.6'),
    maxSpeakTime: parseInt(process.env.TENCENT_ASR_MAX_SPEAK_TIME || '60000')
  };

  // 验证必需的配置项
  if (!config.secretId || !config.secretKey || !config.appId) {
    throw new Error('腾讯云实时语音识别配置不完整，请检查环境变量中的 TENCENT_SECRET_ID、TENCENT_SECRET_KEY 和 TENCENT_APP_ID');
  }

  return config;
}

/**
 * 获取完整的应用配置
 */
export function getAppConfig(): AppConfig {
  return {
    nodeEnv: process.env.NODE_ENV || 'development',
    isDev: process.env.ELECTRON_IS_DEV === 'true',
    aiApiBaseUrl: process.env.AI_API_BASE_URL || '',
    logLevel: process.env.LOG_LEVEL || 'info',
    autoUpdateUrl: process.env.AUTO_UPDATE_URL || '',
    tencentASR: getTencentASRConfig()
  };
}

/**
 * 验证环境变量配置是否完整
 */
export function validateEnvConfig(): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // 检查必需的环境变量
  const requiredEnvVars = [
    'TENCENT_SECRET_ID',
    'TENCENT_SECRET_KEY', 
    'TENCENT_APP_ID',
    'AI_API_BASE_URL'
  ];

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      errors.push(`缺少必需的环境变量: ${envVar}`);
    }
  }

  // 检查数值类型的环境变量
  const numericEnvVars = [
    'TENCENT_ASR_VOICE_FORMAT',
    'TENCENT_ASR_FILTER_DIRTY',
    'TENCENT_ASR_FILTER_MODAL',
    'TENCENT_ASR_FILTER_PUNC',
    'TENCENT_ASR_CONVERT_NUM_MODE',
    'TENCENT_ASR_WORD_INFO',
    'TENCENT_ASR_VAD_SILENCE_TIME',
    'TENCENT_ASR_MAX_SPEAK_TIME'
  ];

  for (const envVar of numericEnvVars) {
    const value = process.env[envVar];
    if (value && isNaN(parseInt(value))) {
      errors.push(`环境变量 ${envVar} 必须是数字，当前值: ${value}`);
    }
  }

  // 检查噪声阈值
  const noiseThreshold = process.env.TENCENT_ASR_NOISE_THRESHOLD;
  if (noiseThreshold && (isNaN(parseFloat(noiseThreshold)) || parseFloat(noiseThreshold) < 0 || parseFloat(noiseThreshold) > 1)) {
    errors.push(`环境变量 TENCENT_ASR_NOISE_THRESHOLD 必须是 0-1 之间的数字，当前值: ${noiseThreshold}`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}