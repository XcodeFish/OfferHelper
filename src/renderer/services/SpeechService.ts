import { tencentSpeechService } from './TencentSpeechService';
import { tencentSpeechServiceSafe } from './TencentSpeechServiceSafe';
import { EventBus } from '../../shared/utils/EventBus';

// 简单的日志工具
const logger = {
  info: (message: string, ...args: any[]) => console.log(`[INFO] ${message}`, ...args),
  warn: (message: string, ...args: any[]) => console.warn(`[WARN] ${message}`, ...args),
  error: (message: string, ...args: any[]) => console.error(`[ERROR] ${message}`, ...args)
};

// 类型定义
interface SpeechConfig {
  language: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
}

interface SpeechResult {
  transcript: string;
  confidence: number;
  isFinal: boolean;
  timestamp: number;
}

interface SpeechError {
  error: string;
  message: string;
}

// 声明全局类型
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

/**
 * 语音识别服务
 * 负责处理语音识别功能，包括Web Speech API和备用方案
 */
export class SpeechService {
  private recognition: any | null = null;
  private isListening: boolean = false;
  private config: SpeechConfig;
  private speechProvider: 'browser' | 'tencent' = 'browser';
  private tencentConfig: any = null;

  constructor() {
    this.config = {
      language: 'zh-CN',
      continuous: true,
      interimResults: true,
      maxAlternatives: 3
    };
    this.initializeRecognition();
  }

  /**
   * 初始化语音识别
   */
  private initializeRecognition(): void {
    try {
      // 检查浏览器支持
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      
      if (!SpeechRecognition) {
        logger.warn('浏览器不支持语音识别');
        return;
      }

      this.recognition = new SpeechRecognition();
      this.setupRecognitionConfig();
      this.setupEventHandlers();
      
      logger.info('语音识别服务初始化成功');
    } catch (error) {
      logger.error('语音识别初始化失败:', error);
    }
  }

  /**
   * 配置语音识别参数
   */
  private setupRecognitionConfig(): void {
    if (!this.recognition) return;

    this.recognition.lang = this.config.language;
    this.recognition.continuous = this.config.continuous;
    this.recognition.interimResults = this.config.interimResults;
    this.recognition.maxAlternatives = this.config.maxAlternatives;
  }

  /**
   * 设置事件处理器
   */
  private setupEventHandlers(): void {
    if (!this.recognition) return;

    this.recognition.onstart = () => {
      this.isListening = true;
      logger.info('语音识别开始');
      EventBus.emit('speech:started');
    };

    this.recognition.onresult = (event: any) => {
      try {
        const results = Array.from(event.results);
        const transcript = results
          .map((result: any) => result[0]?.transcript || '')
          .join('');

        const lastResult = results.length > 0 ? results[results.length - 1] as any : null;
        const confidence = lastResult?.[0]?.confidence || 0;
        const isFinal = event.results[event.results.length - 1]?.isFinal || false;

        const speechResult: SpeechResult = {
          transcript,
          confidence,
          isFinal,
          timestamp: Date.now()
        };

        if (isFinal) {
          logger.info('语音识别完成:', transcript);
          EventBus.emit('speech:result', speechResult);
        } else {
          EventBus.emit('speech:interim', speechResult);
        }
      } catch (error) {
        logger.error('处理语音识别结果失败:', error);
      }
    };

    this.recognition.onerror = (event: any) => {
      logger.error('语音识别错误:', event.error);
      this.isListening = false;
      EventBus.emit('speech:error', {
        error: event.error,
        message: this.getErrorMessage(event.error)
      });
    };

    this.recognition.onend = () => {
      this.isListening = false;
      logger.info('语音识别结束');
      EventBus.emit('speech:ended');
    };
  }

  /**
   * 开始语音识别
   */
  public startListening(): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        logger.info(`SpeechService: 开始语音识别，提供商: ${this.speechProvider}`);
        
        // 如果使用腾讯云语音识别
        if (this.speechProvider === 'tencent') {
          logger.info('SpeechService: 使用腾讯云语音识别');
          
          // 检查腾讯云服务是否可用
          if (!tencentSpeechServiceSafe) {
            const error = new Error('腾讯云语音识别服务不可用');
            logger.error('SpeechService:', error.message);
            EventBus.emit('speech:error', { error: 'service-unavailable', message: error.message });
            reject(error);
            return;
          }
          
          // 检查腾讯云配置
          if (!this.tencentConfig) {
            const error = new Error('腾讯云语音识别配置缺失，请先在设置中配置相关参数');
            logger.error('SpeechService:', error.message);
            EventBus.emit('speech:error', { error: 'config-missing', message: error.message });
            reject(error);
            return;
          }
          
          try {
            logger.info('SpeechService: 启动安全版腾讯云语音识别服务...');
            await tencentSpeechServiceSafe.startListening(this.tencentConfig);
            this.isListening = true;
            logger.info('SpeechService: 腾讯云语音识别已启动');
            
            // 使用更安全的异步事件发射
            try {
              EventBus.emit('speech:started');
              logger.info('SpeechService: speech:started事件已发射');
            } catch (eventError) {
              logger.error('SpeechService: 发射speech:started事件失败:', eventError);
            }
            
            resolve();
          } catch (tencentError) {
            this.isListening = false;
            const errorMessage = tencentError instanceof Error ? tencentError.message : '腾讯云语音识别启动失败';
            logger.error('SpeechService: 腾讯云语音识别启动失败:', tencentError);
            EventBus.emit('speech:error', { error: 'tencent-start-failed', message: errorMessage });
            reject(new Error(errorMessage));
          }
          return;
        }
        
        // 使用浏览器内置语音识别
        if (!this.recognition) {
          const error = new Error('浏览器语音识别不可用，请使用支持Web Speech API的现代浏览器');
          logger.error(error.message);
          reject(error);
          return;
        }

        if (this.isListening) {
          logger.warn('语音识别已在进行中');
          resolve();
          return;
        }

        // 检查麦克风权限
        try {
          await navigator.mediaDevices.getUserMedia({ audio: true });
        } catch (permissionError) {
          logger.error('麦克风权限检查失败:', permissionError);
          reject(new Error('无法访问麦克风，请检查浏览器权限设置'));
          return;
        }

        try {
          this.recognition.start();
          resolve();
        } catch (startError) {
          logger.error('启动浏览器语音识别失败:', startError);
          reject(new Error('启动语音识别失败: ' + (startError instanceof Error ? startError.message : '未知错误')));
        }
      } catch (error) {
        logger.error('语音识别启动过程中出现未预期的错误:', error);
        this.isListening = false;
        reject(error);
      }
    });
  }

  /**
   * 停止语音识别
   */
  public stopListening(): void {
    // 如果使用腾讯云语音识别
    if (this.speechProvider === 'tencent') {
      console.log('SpeechService: 停止安全版腾讯云语音识别');
      tencentSpeechServiceSafe.stopListening();
      this.isListening = false;
      return;
    }
    
    // 使用浏览器内置语音识别
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
        logger.info('停止语音识别');
      } catch (error) {
        logger.error('停止语音识别失败:', error);
      }
    }
  }

  /**
   * 切换语音识别状态
   */
  public toggleListening(): Promise<void> {
    if (this.isListening) {
      this.stopListening();
      return Promise.resolve();
    } else {
      return this.startListening();
    }
  }

  /**
   * 更新配置
   */
  public updateConfig(newConfig: Partial<SpeechConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // 更新浏览器语音识别配置
    if (this.speechProvider === 'browser') {
      this.setupRecognitionConfig();
    }
    
    logger.info('语音识别配置已更新:', this.config);
  }
  
  /**
   * 设置语音识别提供商
   */
  public setProvider(provider: 'browser' | 'tencent'): void {
    this.speechProvider = provider;
    logger.info(`语音识别提供商已切换为: ${provider}`);
  }

  /**
   * 获取当前状态
   */
  public getStatus(): {
    isListening: boolean;
    isSupported: boolean;
    config: SpeechConfig;
    provider: 'browser' | 'tencent';
  } {
    // 如果使用腾讯云语音识别
    if (this.speechProvider === 'tencent') {
      // 使用安全版腾讯云语音识别的状态
      const isRecording = tencentSpeechServiceSafe.isRecording();
      this.isListening = isRecording;
      return {
        isListening: isRecording,
        isSupported: true, // 假设腾讯云服务总是可用的
        config: this.config,
        provider: 'tencent'
      };
    }
    
    // 使用浏览器内置语音识别
    return {
      isListening: this.isListening,
      isSupported: !!this.recognition,
      config: this.config,
      provider: 'browser'
    };
  }

  /**
   * 获取错误消息
   */
  private getErrorMessage(error: string): string {
    const errorMessages: Record<string, string> = {
      'no-speech': '未检测到语音输入',
      'audio-capture': '音频捕获失败',
      'not-allowed': '麦克风权限被拒绝',
      'network': '网络连接错误',
      'service-not-allowed': '语音识别服务不可用',
      'bad-grammar': '语法错误',
      'language-not-supported': '不支持的语言',
      'aborted': '语音识别被中断'
    };

    return errorMessages[error] || `未知错误: ${error}`;
  }

  /**
   * 销毁服务
   */
  public destroy(): void {
    // 停止并销毁浏览器语音识别
    if (this.recognition) {
      this.stopListening();
      this.recognition = null;
    }
    
    // 停止腾讯云语音识别服务
    if (this.speechProvider === 'tencent') {
      tencentSpeechServiceSafe.stopListening();
    }
    
    logger.info('语音识别服务已销毁');
  }
  
  /**
   * 初始化腾讯云语音识别
   */
  public initializeTencentSpeech(config: any): Promise<void> {
    this.tencentConfig = config;
    return tencentSpeechServiceSafe.initialize(config);
  }

  /**
   * 设置腾讯云配置
   */
  public setTencentConfig(config: any): void {
    this.tencentConfig = config;
    logger.info('SpeechService: 腾讯云配置已更新');
  }
}

// 导出单例实例
export const speechService = new SpeechService();