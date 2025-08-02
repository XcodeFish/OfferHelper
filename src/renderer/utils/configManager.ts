// 配置管理器 - 使用环境变量保护敏感信息
export interface TencentConfig {
  secretId: string;
  secretKey: string;
  appId: string;
  region: string;
}

export class ConfigManager {
  private static instance: ConfigManager;
  
  private constructor() {}
  
  public static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }
  
  /**
   * 获取腾讯云配置
   * 优先从环境变量读取，如果没有则使用默认值（需要用户手动配置）
   */
  public getTencentConfig(): TencentConfig {
    return {
      secretId: process.env.TENCENT_SECRET_ID || '',
      secretKey: process.env.TENCENT_SECRET_KEY || '',
      appId: process.env.TENCENT_APP_ID || '',
      region: process.env.TENCENT_REGION || 'ap-beijing'
    };
  }
  
  /**
   * 验证配置是否完整
   */
  public validateTencentConfig(): boolean {
    const config = this.getTencentConfig();
    return !!(config.secretId && config.secretKey && config.appId);
  }
  
  /**
   * 获取配置状态信息
   */
  public getConfigStatus(): string {
    if (this.validateTencentConfig()) {
      return '配置已完成';
    }
    return '请在.env文件中配置腾讯云密钥信息';
  }
}

export default ConfigManager.getInstance();