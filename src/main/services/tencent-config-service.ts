import { TencentCloudConfig } from '../../renderer/config/tencent-config';

/**
 * 腾讯云配置服务
 * 从环境变量中安全地读取配置信息
 */
export class TencentConfigService {
  /**
   * 从环境变量获取腾讯云配置
   */
  static getTencentConfig(): TencentCloudConfig {
    const config = {
      appId: process.env.TENCENT_APP_ID || '',
      secretId: process.env.TENCENT_SECRET_ID || '',
      secretKey: process.env.TENCENT_SECRET_KEY || '',
      region: process.env.TENCENT_REGION || 'ap-beijing',
    };

    // 添加调试信息
    console.log('环境变量读取结果:', {
      TENCENT_APP_ID: process.env.TENCENT_APP_ID ? '已设置' : '未设置',
      TENCENT_SECRET_ID: process.env.TENCENT_SECRET_ID ? '已设置' : '未设置',
      TENCENT_SECRET_KEY: process.env.TENCENT_SECRET_KEY ? '已设置' : '未设置',
      config: {
        appId: config.appId ? '已设置' : '未设置',
        secretId: config.secretId ? '已设置' : '未设置',
        secretKey: config.secretKey ? '已设置' : '未设置',
      },
    });

    return config;
  }

  /**
   * 验证配置是否完整
   */
  static validateConfig(config: TencentCloudConfig): boolean {
    return !!(
      config.appId &&
      config.appId.trim() !== '' &&
      config.secretId &&
      config.secretId.trim() !== '' &&
      config.secretKey &&
      config.secretKey.trim() !== ''
    );
  }

  /**
   * 获取配置状态信息
   */
  static getConfigStatus(): {
    isValid: boolean;
    missingFields: string[];
    message: string;
  } {
    const config = this.getTencentConfig();
    const missingFields: string[] = [];

    if (!config.appId || config.appId.trim() === '') {
      missingFields.push('TENCENT_APP_ID');
    }
    if (!config.secretId || config.secretId.trim() === '') {
      missingFields.push('TENCENT_SECRET_ID');
    }
    if (!config.secretKey || config.secretKey.trim() === '') {
      missingFields.push('TENCENT_SECRET_KEY');
    }

    const isValid = missingFields.length === 0;
    const message = isValid
      ? '腾讯云配置已完成'
      : `缺少环境变量: ${missingFields.join(', ')}`;

    return {
      isValid,
      missingFields,
      message,
    };
  }
}
