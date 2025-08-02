/**
 * 语音服务工具函数
 * 提供安全的语音服务操作
 */

import { tencentSpeechService } from '../services/TencentSpeechService';
import { speechService } from '../services/SpeechService';

export interface SpeechTestResult {
  success: boolean;
  error?: string;
  provider?: 'browser' | 'tencent';
}

/**
 * 安全地测试语音识别服务
 */
export async function testSpeechService(
  provider: 'browser' | 'tencent',
  config?: any
): Promise<SpeechTestResult> {
  try {
    console.log(`开始测试语音识别服务: ${provider}`);
    
    if (provider === 'tencent') {
      if (!config) {
        return {
          success: false,
          error: '腾讯云配置参数缺失'
        };
      }
      
      // 验证腾讯云配置
      if (!config.secretId || !config.secretKey || !config.appId) {
        return {
          success: false,
          error: '腾讯云配置参数不完整，请检查 SecretId、SecretKey 和 AppId'
        };
      }
      
      // 使用超时控制
      const testPromise = tencentSpeechService.initialize(config);
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('初始化超时')), 8000);
      });
      
      await Promise.race([testPromise, timeoutPromise]);
      
      // 设置语音服务提供商
      speechService.setProvider('tencent');
      speechService.setTencentConfig(config);
      
      console.log('✅ 腾讯云语音识别服务测试成功');
      return {
        success: true,
        provider: 'tencent'
      };
    } else {
      // 测试浏览器语音识别
      speechService.setProvider('browser');
      
      // 测试麦克风权限
      const hasPermission = await tencentSpeechService.testMicrophone();
      if (!hasPermission) {
        return {
          success: false,
          error: '无法访问麦克风，请检查浏览器权限设置'
        };
      }
      
      console.log('✅ 浏览器语音识别服务测试成功');
      return {
        success: true,
        provider: 'browser'
      };
    }
  } catch (error) {
    console.error('❌ 语音识别服务测试失败:', error);
    
    let errorMessage = '语音识别服务测试失败';
    
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    }
    
    // 特殊错误处理
    if (errorMessage.includes('not-allowed')) {
      errorMessage = '麦克风权限被拒绝，请在浏览器设置中允许访问麦克风';
    } else if (errorMessage.includes('network') || errorMessage.includes('超时')) {
      errorMessage = '网络连接失败或超时，请检查网络连接后重试';
    } else if (errorMessage.includes('4003')) {
      errorMessage = '腾讯云认证失败，请检查 SecretId 和 SecretKey 是否正确';
    } else if (errorMessage.includes('IPC') || errorMessage.includes('主进程')) {
      errorMessage = '与主进程通信失败，请重启应用后重试';
    }
    
    return {
      success: false,
      error: errorMessage,
      provider
    };
  }
}

/**
 * 安全地清理语音服务资源
 */
export async function cleanupSpeechService(): Promise<void> {
  try {
    console.log('开始清理语音服务资源...');
    
    // 停止语音识别
    try {
      speechService.stopListening();
    } catch (error) {
      console.warn('停止语音识别时出错:', error);
    }
    
    // 停止腾讯云语音服务
    try {
      await tencentSpeechService.stopListening();
    } catch (error) {
      console.warn('停止腾讯云语音服务时出错:', error);
    }
    
    console.log('✅ 语音服务资源清理完成');
  } catch (error) {
    console.error('清理语音服务资源时出错:', error);
  }
}

/**
 * 验证腾讯云配置格式
 */
export function validateTencentConfig(config: {
  secretId: string;
  secretKey: string;
  appId: string;
}): { valid: boolean; error?: string } {
  if (!config.secretId || !config.secretKey || !config.appId) {
    return {
      valid: false,
      error: '配置参数不完整，请提供 SecretId、SecretKey 和 AppId'
    };
  }
  
  if (config.secretId.trim().length < 10 || config.secretKey.trim().length < 10) {
    return {
      valid: false,
      error: 'SecretId 和 SecretKey 格式不正确，长度过短'
    };
  }
  
  if (!/^\d+$/.test(config.appId.trim())) {
    return {
      valid: false,
      error: 'AppId 必须是纯数字'
    };
  }
  
  return { valid: true };
}