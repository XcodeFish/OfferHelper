import { VoiceService } from './voice-service';
import { AIService } from './ai-service';
import { SettingsService } from './settings-service';
import { AuthService } from './auth-service';

export async function initializeServices(): Promise<void> {
  try {
    console.log('正在初始化服务...');

    // 初始化各个服务
    // 这里可以添加服务初始化逻辑

    console.log('服务初始化完成');
  } catch (error) {
    console.error('服务初始化失败:', error);
    throw error;
  }
}

export { VoiceService, AIService, SettingsService, AuthService };
