/**
 * 环境变量管理模块
 */

export interface AppEnvironment {
  NODE_ENV: 'development' | 'production' | 'test';
  ELECTRON_IS_DEV: boolean;
  APP_VERSION: string;
  OPENAI_API_KEY?: string;
  SENTRY_DSN?: string;
  UPDATE_SERVER_URL?: string;
  LOG_LEVEL?: string;
}

class EnvironmentManager {
  private env: AppEnvironment;

  constructor() {
    this.env = this.loadEnvironment();
  }

  private loadEnvironment(): AppEnvironment {
    return {
      NODE_ENV: (process.env.NODE_ENV as any) || 'development',
      ELECTRON_IS_DEV: process.env.NODE_ENV === 'development',
      APP_VERSION: process.env.npm_package_version || '1.0.0',
      OPENAI_API_KEY: process.env.OPENAI_API_KEY,
      SENTRY_DSN: process.env.SENTRY_DSN,
      UPDATE_SERVER_URL: process.env.UPDATE_SERVER_URL,
      LOG_LEVEL: process.env.LOG_LEVEL
    };
  }

  public get(key: keyof AppEnvironment): any {
    return this.env[key];
  }

  public isDevelopment(): boolean {
    return this.env.NODE_ENV === 'development';
  }

  public isProduction(): boolean {
    return this.env.NODE_ENV === 'production';
  }

  public isTest(): boolean {
    return this.env.NODE_ENV === 'test';
  }

  public getAppVersion(): string {
    return this.env.APP_VERSION;
  }

  public hasOpenAIKey(): boolean {
    return !!this.env.OPENAI_API_KEY;
  }

  public getOpenAIKey(): string | undefined {
    return this.env.OPENAI_API_KEY;
  }
}

// 导出单例实例
export const env = new EnvironmentManager();
export default env;