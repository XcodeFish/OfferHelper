// 腾讯云语音识别配置
export interface TencentCloudConfig {
  appId: string;
  secretId: string;
  secretKey: string;
  region?: string;
}

// 默认配置（仅作为fallback）
const fallbackConfig: TencentCloudConfig = {
  appId: '',
  secretId: '',
  secretKey: '',
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

// 从主进程获取配置的辅助函数
export async function getTencentConfig(): Promise<TencentCloudConfig> {
  try {
    // 通过IPC从主进程获取环境变量配置
    if (window.electronAPI?.tencent) {
      const config = await window.electronAPI.tencent.getConfig();
      return config;
    }

    // 如果没有electronAPI，返回空配置
    return fallbackConfig;
  } catch (error) {
    console.error('获取腾讯云配置失败:', error);
    return fallbackConfig;
  }
}

// 获取配置状态的辅助函数
export async function getTencentConfigStatus(): Promise<{
  isValid: boolean;
  missingFields: string[];
  message: string;
}> {
  try {
    if (window.electronAPI?.tencent) {
      const status = await window.electronAPI.tencent.getConfigStatus();
      return status;
    }

    return {
      isValid: false,
      missingFields: [
        'TENCENT_APP_ID',
        'TENCENT_SECRET_ID',
        'TENCENT_SECRET_KEY',
      ],
      message: 'ElectronAPI 不可用',
    };
  } catch (error) {
    console.error('获取腾讯云配置状态失败:', error);
    return {
      isValid: false,
      missingFields: [],
      message: '获取配置状态失败',
    };
  }
}

// 验证配置是否有效
export function validateTencentConfig(config: TencentCloudConfig): boolean {
  return !!(
    config.appId &&
    config.appId.trim() !== '' &&
    config.secretId &&
    config.secretId.trim() !== '' &&
    config.secretKey &&
    config.secretKey.trim() !== ''
  );
}
