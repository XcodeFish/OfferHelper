import { EventBus } from '../../shared/utils/EventBus';
import { logger } from '../../shared/utils/Logger';
import type { SpeechError } from '../../shared/types/speech';

/**
 * 腾讯云实时语音识别服务（网页版）
 * 在浏览器环境中使用 Web Speech API 作为替代方案
 */
export class TencentWebSpeechService {
  private isListening: boolean = false;
  private isInitialized: boolean = false;
  private config: TencentSpeechConfig | null = null;
  private interimResult: string = '';
  private recognition: any = null; // Web Speech API 识别器
  private useWebSpeechAPI: boolean = false; // 是否使用 Web Speech API

  constructor() {
    console.log('TencentWebSpeechService 初始化');
    
    // 检查浏览器是否支持 Web Speech API
    if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      console.log('浏览器支持 Web Speech API');
      this.useWebSpeechAPI = true;
    } else {
      console.warn('浏览器不支持 Web Speech API');
    }
  }

  /**
   * 初始化腾讯云语音识别服务
   */
  public async initialize(config: TencentSpeechConfig): Promise<void> {
    try {
      console.log('初始化语音识别服务（网页版），配置:', config);
      
      // 验证必要的配置参数
      if (!config.secretId || !config.secretKey || !config.appId) {
        console.warn('腾讯云配置参数不完整，将使用浏览器原生 Web Speech API');
      }
      
      this.config = config;
      this.isInitialized = true;
      
      logger.info('语音识别服务（网页版）初始化成功');
      console.log('语音识别服务（网页版）初始化成功');
    } catch (error) {
      logger.error('语音识别初始化失败:', error);
      console.error('语音识别初始化失败:', error);
      this.isInitialized = false;
      throw error;
    }
  }

  /**
   * 开始语音识别
   */
  public async startListening(): Promise<void> {
    console.log('开始语音识别（网页版），当前状态:', {
      isInitialized: this.isInitialized,
      isListening: this.isListening,
      hasConfig: !!this.config,
      useWebSpeechAPI: this.useWebSpeechAPI
    });

    if (!this.isInitialized) {
      const error = new Error('语音识别服务未初始化');
      console.error(error.message);
      throw error;
    }

    if (this.isListening) {
      console.warn('语音识别已在进行中');
      return;
    }

    try {
      if (this.useWebSpeechAPI) {
        console.log('使用浏览器原生 Web Speech API...');
        await this.startWebSpeechAPI();
      } else {
        console.warn('浏览器不支持 Web Speech API，无法进行语音识别');
        throw new Error('浏览器不支持语音识别功能');
      }
      
      this.isListening = true;
      EventBus.emit('speech:started');
      console.log('语音识别（网页版）已开始');
    } catch (error) {
      console.error('启动语音识别失败:', error);
      this.isListening = false;
      throw error;
    }
  }

  /**
   * 停止语音识别
   */
  public stopListening(): void {
    if (!this.isListening) return;

    try {
      if (this.useWebSpeechAPI) {
        // 停止 Web Speech API
        this.stopWebSpeechAPI();
      }
      
      this.isListening = false;
      EventBus.emit('speech:ended');
      logger.info('语音识别（网页版）结束');
    } catch (error) {
      logger.error('停止语音识别失败:', error);
      
      const speechError: SpeechError = {
        error: 'stop_failed',
        message: error instanceof Error ? error.message : '停止语音识别失败'
      };
      EventBus.emit('speech:error', speechError);
    }
  }

  /**
   * 初始化 Web Speech API
   */
  private async initWebSpeechAPI(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // 创建语音识别实例
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        
        if (!SpeechRecognition) {
          reject(new Error('浏览器不支持 Web Speech API'));
          return;
        }
        
        this.recognition = new SpeechRecognition();
        
        // 配置识别参数
        this.recognition.continuous = true; // 持续识别
        this.recognition.interimResults = true; // 返回中间结果
        this.recognition.lang = 'zh-CN'; // 中文识别
        this.recognition.maxAlternatives = 1;
        
        console.log('Web Speech API 初始化成功');
        resolve();
      } catch (error) {
        console.error('Web Speech API 初始化失败:', error);
        reject(error);
      }
    });
  }

  /**
   * 开始 Web Speech API 识别
   */
  private async startWebSpeechAPI(): Promise<void> {
    if (!this.recognition) {
      await this.initWebSpeechAPI();
    }

    return new Promise((resolve, reject) => {
      if (!this.recognition) {
        reject(new Error('Web Speech API 未初始化'));
        return;
      }

      // 设置事件监听器
      this.recognition.onstart = () => {
        console.log('Web Speech API 开始识别');
        resolve();
      };

      this.recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
            console.log('最终识别结果:', finalTranscript);
            
            EventBus.emit('speech:result', {
              transcript: finalTranscript,
              confidence: event.results[i][0].confidence || 1,
              isFinal: true
            });
          } else {
            interimTranscript += transcript;
            this.interimResult = interimTranscript;
            
            EventBus.emit('speech:interim', {
              transcript: interimTranscript,
              confidence: event.results[i][0].confidence || 1,
              isFinal: false
            });
          }
        }
      };

      this.recognition.onerror = (event: any) => {
        console.error('Web Speech API 错误:', event.error);
        
        let errorMessage = '';
        switch (event.error) {
          case 'not-allowed':
            errorMessage = '麦克风权限被拒绝，请在浏览器设置中允许麦克风访问';
            break;
          case 'network':
            errorMessage = '网络连接错误，请检查网络连接或尝试刷新页面';
            break;
          case 'no-speech':
            errorMessage = '未检测到语音输入，请确保麦克风正常工作';
            break;
          case 'audio-capture':
            errorMessage = '音频捕获失败，请检查麦克风设备';
            break;
          case 'service-not-allowed':
            errorMessage = '语音识别服务不可用，请尝试使用 HTTPS 访问';
            break;
          default:
            errorMessage = `语音识别错误: ${event.error}`;
        }
        
        EventBus.emit('speech:error', {
          error: 'recognition_error',
          message: errorMessage
        });
        
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          reject(new Error(errorMessage));
        } else {
          // 对于网络错误等，不直接 reject，而是尝试重连
          console.warn('语音识别遇到错误，将尝试重新连接:', errorMessage);
        }
      };

      this.recognition.onend = () => {
        console.log('Web Speech API 识别结束');
        if (this.isListening) {
          // 如果还在监听状态，重新开始识别
          setTimeout(() => {
            if (this.isListening && this.recognition) {
              try {
                this.recognition.start();
              } catch (error) {
                console.error('重新启动识别失败:', error);
              }
            }
          }, 100);
        }
      };

      // 开始识别
      try {
        this.recognition.start();
      } catch (error) {
        console.error('启动 Web Speech API 失败:', error);
        reject(error);
      }
    });
  }

  /**
   * 停止 Web Speech API 识别
   */
  private stopWebSpeechAPI(): void {
    if (this.recognition) {
      try {
        this.recognition.stop();
        console.log('Web Speech API 已停止');
      } catch (error) {
        console.error('停止 Web Speech API 失败:', error);
      }
    }
  }

  /**
   * 获取当前状态
   */
  public getStatus(): {
    isListening: boolean;
    interimResult: string;
  } {
    return {
      isListening: this.isListening,
      interimResult: this.interimResult
    };
  }

  /**
   * 更新配置
   */
  public updateConfig(newConfig: Partial<TencentSpeechConfig>): void {
    if (this.config) {
      this.config = { ...this.config, ...newConfig };
      logger.info('语音识别配置已更新');
    }
  }

  /**
   * 销毁服务
   */
  public destroy(): void {
    this.stopListening();
    
    if (this.recognition) {
      this.recognition = null;
    }
    
    this.isInitialized = false;
    this.config = null;
    logger.info('语音识别服务已销毁');
  }
}

/**
 * 腾讯云语音识别配置接口
 */
export interface TencentSpeechConfig {
  secretId: string;
  secretKey: string;
  appId: string;
  region: string;
  engineType: string;
  voiceFormat: number;
  needVad: number;
  hotwordId: string;
  filterDirty: number;
  filterModal: number;
  filterPunc: number;
  convertNumMode: number;
  filterEmptyResult: number;
  vadSilenceTime: number;
}

// 导出单例实例
export const tencentWebSpeechService = new TencentWebSpeechService();