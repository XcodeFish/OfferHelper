// 腾讯云语音识别配置示例文件
// 请复制此文件为 tencent-config.ts 并填入您的真实配置信息

export interface TencentCloudConfig {
  appId: string;
  secretId: string;
  secretKey: string;
  region?: string;
}

// 配置示例 - 请替换为您的真实配置
export const defaultTencentConfig: TencentCloudConfig = {
  // 1. 在腾讯云控制台账号信息页面获取AppId
  // https://console.cloud.tencent.com/developer
  appId: 'YOUR_SECRET_APPID_HERE', // 替换为您的AppId

  // 2. 在腾讯云控制台访问管理页面获取SecretId和SecretKey
  // https://console.cloud.tencent.com/cam/capi
  secretId: 'YOUR_SECRET_ID_HERE', // 替换为您的SecretId
  secretKey: 'YOUR_SECRET_KEY_HERE', // 替换为您的SecretKey

  // 3. 可选：设置地域，默认为北京
  region: 'ap-beijing',
};

// 语音识别引擎模型类型
export const ENGINE_MODEL_TYPES = {
  // 电话场景
  '8k_zh': '8k中文电话',
  '8k_en': '8k英文电话',

  // 非电话场景
  '16k_zh': '16k中文通用',
  '16k_zh_large': '16k中文大模型',
  '16k_en': '16k英文通用',
  '16k_ca': '16k粤语',
  '16k_ja': '16k日语',
  '16k_wuu-SH': '16k上海话',
} as const;

// 音频格式
export const VOICE_FORMATS = {
  wav: 'WAV格式',
  pcm: 'PCM格式',
  opus: 'OPUS格式',
  speex: 'SPEEX格式',
  silk: 'SILK格式',
  mp3: 'MP3格式',
  m4a: 'M4A格式',
  aac: 'AAC格式',
} as const;

// 获取配置的辅助函数
export function getTencentConfig(): TencentCloudConfig {
  // 在渲染进程中直接使用默认配置
  // 如需使用环境变量，请在主进程中处理并通过IPC传递
  return { ...defaultTencentConfig };
}

// 验证配置是否有效
export function validateTencentConfig(config: TencentCloudConfig): boolean {
  return !!(
    config.appId &&
    config.appId !== 'YOUR_APP_ID' &&
    config.appId !== '1234567890' &&
    config.secretId &&
    config.secretId !== 'YOUR_SECRET_ID' &&
    config.secretId !== 'YOUR_SECRET_ID_HERE' &&
    config.secretKey &&
    config.secretKey !== 'YOUR_SECRET_KEY' &&
    config.secretKey !== 'YOUR_SECRET_KEY_HERE'
  );
}
