// 安全版腾讯云语音识别服务 - 专为防止崩溃设计
import type { ElectronAPI } from '../../shared/types/electron';
import { EventBus } from '../../shared/utils/EventBus';

const logger = {
  info: (message: string, ...args: any[]) => console.log(`[SAFE-INFO] ${message}`, ...args),
  warn: (message: string, ...args: any[]) => console.warn(`[SAFE-WARN] ${message}`, ...args),
  error: (message: string, ...args: any[]) => console.error(`[SAFE-ERROR] ${message}`, ...args),
  debug: (message: string, ...args: any[]) => console.log(`[SAFE-DEBUG] ${message}`, ...args)
};

const isElectron = typeof window !== 'undefined' && window.electron;

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

export class TencentSpeechServiceSafe {
  private mediaStream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private isListening = false;
  private config: TencentSpeechConfig | null = null;
  private audioProcessTimer: NodeJS.Timeout | null = null;
  private analyser: AnalyserNode | null = null;
  private isDestroyed = false; // 防止重复调用

  // 简化的音频参数
  private readonly TARGET_SAMPLE_RATE = 16000;
  private readonly SEND_INTERVAL = 500; // 增加到500ms，减少频繁发送

  constructor() {
    logger.info('安全版腾讯云语音识别服务初始化');
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    if (!isElectron || !window.electron) return;

    // 监听主进程的语音识别结果
    try {
      // 使用标准的IPC事件监听
      window.electron.on('speech:result', (result: any) => {
        this.handleSpeechResult(result);
      });

      window.electron.on('speech:error', (error: any) => {
        this.handleSpeechError(error);
      });

      window.electron.on('speech:started', () => {
        logger.info('收到主进程语音识别启动事件');
      });

      window.electron.on('speech:ended', () => {
        logger.info('收到主进程语音识别结束事件');
      });

      logger.info('IPC事件监听器已设置');
    } catch (error) {
      logger.warn('设置事件监听器失败:', error);
    }
  }

  private handleSpeechResult(result: any): void {
    try {
      logger.info('收到主进程语音识别结果:', result);
      logger.info('结果类型:', typeof result);
      logger.info('结果键值:', Object.keys(result || {}));
      logger.info('结果JSON:', JSON.stringify(result, null, 2));
      
      // 发射EventBus事件
      const speechResult = {
        transcript: result.transcript || result.text || '',
        confidence: result.confidence || 1.0,
        isFinal: result.isFinal !== false, // 默认为final
        timestamp: result.timestamp || Date.now()
      };

      logger.info('🔍 处理语音识别结果:', {
        originalResult: result,
        extractedTranscript: speechResult.transcript,
        hasTranscript: !!speechResult.transcript
      });

      if (speechResult.transcript) {
        EventBus.emit('speech:result', speechResult);
        logger.info('✅ 语音识别结果已发射到EventBus:', speechResult.transcript);
      } else {
        logger.warn('收到空的语音识别结果，原始数据:', result);
      }
    } catch (error) {
      logger.error('处理语音识别结果失败:', error);
    }
  }

  private handleSpeechError(error: any): void {
    try {
      logger.error('收到语音识别错误:', error);
      
      EventBus.emit('speech:error', {
        error: error.code || 'unknown',
        message: error.message || '语音识别错误'
      });
    } catch (err) {
      logger.error('处理语音识别错误失败:', err);
    }
  }

  async initialize(config: TencentSpeechConfig): Promise<void> {
    if (this.isDestroyed) {
      throw new Error('服务已销毁，无法初始化');
    }

    try {
      this.config = config;
      logger.info('配置已更新');
      
      // 仅在Electron环境中初始化主进程服务
      if (isElectron && window.electron && window.electron.tencentSpeech) {
        try {
          const result = await window.electron.tencentSpeech.initialize(config);
          if (!result.success) {
            throw new Error(result.error || '主进程初始化失败');
          }
          logger.info('主进程服务初始化成功');
        } catch (electronError) {
          logger.warn('主进程初始化失败:', electronError);
          throw electronError; // 如果主进程初始化失败，直接抛出错误
        }
      } else {
        throw new Error('Electron环境不可用');
      }
    } catch (error) {
      logger.error('初始化失败:', error);
      throw error;
    }
  }

  async updateConfig(config: TencentSpeechConfig): Promise<void> {
    if (this.isDestroyed) {
      throw new Error('服务已销毁，无法更新配置');
    }

    try {
      this.config = config;
      
      if (isElectron && window.electron && window.electron.tencentSpeech) {
        const result = await window.electron.tencentSpeech.initialize(config);
        if (!result.success) {
          throw new Error(result.error || '主进程配置更新失败');
        }
        logger.info('配置更新成功');
      }
    } catch (error) {
      logger.error('配置更新失败:', error);
      throw error;
    }
  }

  async startListening(config: TencentSpeechConfig): Promise<void> {
    if (this.isDestroyed) {
      throw new Error('服务已销毁，无法启动');
    }

    if (this.isListening) {
      logger.warn('语音识别已在进行中');
      return;
    }

    try {
      // 验证配置
      if (!config.secretId || !config.secretKey || !config.appId) {
        throw new Error('腾讯云配置参数不完整');
      }

      this.config = config;
      logger.info('开始语音识别');

      // 获取麦克风权限
      await this.initializeAudio();
      
      // 启动主进程服务
      await this.startMainProcessService();
      
      // 启动音频处理
      this.startAudioProcessing();
      
      this.isListening = true;
      logger.info('语音识别启动成功');

    } catch (error) {
      logger.error('启动语音识别失败:', error);
      await this.stopListening(); // 清理资源
      throw error;
    }
  }

  private async initializeAudio(): Promise<void> {
    try {
      // 检查浏览器支持
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('浏览器不支持音频录制功能');
      }

      // 获取麦克风权限
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: this.TARGET_SAMPLE_RATE,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      // 创建音频上下文
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioContextClass({
        sampleRate: this.TARGET_SAMPLE_RATE
      });

      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      // 创建音频源节点
      this.sourceNode = this.audioContext.createMediaStreamSource(this.mediaStream);

      // 创建分析器节点
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 2048;
      this.analyser.smoothingTimeConstant = 0.3;

      // 连接节点
      this.sourceNode.connect(this.analyser);

      logger.info('音频系统初始化成功');
    } catch (error) {
      logger.error('音频系统初始化失败:', error);
      throw error;
    }
  }

  private async startMainProcessService(): Promise<void> {
    if (!isElectron || !window.electron || !window.electron.tencentSpeech) {
      throw new Error('Electron环境不可用');
    }

    try {
      const result = await window.electron.tencentSpeech.start();
      if (!result.success) {
        throw new Error(result.error || '启动主进程服务失败');
      }
      logger.info('主进程服务启动成功');
    } catch (error) {
      logger.error('主进程服务启动失败:', error);
      throw error;
    }
  }

  private startAudioProcessing(): void {
    if (this.audioProcessTimer) {
      clearInterval(this.audioProcessTimer);
    }

    logger.info('启动音频处理定时器');
    
    // 使用更长的间隔来减少系统负担
    this.audioProcessTimer = setInterval(() => {
      if (!this.isListening || !this.analyser || this.isDestroyed) {
        return;
      }

      try {
        this.processAudioSafely();
      } catch (error) {
        logger.error('音频处理错误:', error);
        // 不立即停止，继续尝试
      }
    }, this.SEND_INTERVAL);
  }

  private processAudioSafely(): void {
    if (!this.analyser) return;

    try {
      // 获取频域数据
      const bufferLength = this.analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      this.analyser.getByteFrequencyData(dataArray);

      // 检测音频输入
      let hasAudio = false;
      let maxAmplitude = 0;
      for (let i = 0; i < dataArray.length; i++) {
        const amplitude = dataArray[i] / 255.0;
        maxAmplitude = Math.max(maxAmplitude, amplitude);
        if (amplitude > 0.02) {
          hasAudio = true;
        }
      }

      // 只在有音频时发送数据，避免过度发送
      if (hasAudio || Math.random() < 0.1) { // 10%的概率发送静音包保持连接
        this.sendAudioDataSafely(hasAudio, maxAmplitude);
      }

    } catch (error) {
      logger.error('音频处理失败:', error);
    }
  }

  private sendAudioDataSafely(hasAudio: boolean, amplitude: number): void {
    try {
      // 创建简化的音频数据
      const sampleCount = 640; // 40ms @ 16kHz
      const audioData = new ArrayBuffer(sampleCount * 2);
      const view = new DataView(audioData);

      // 生成基于检测结果的音频数据
      for (let i = 0; i < sampleCount; i++) {
        let sample = 0;
        if (hasAudio) {
          // 生成简单的音频信号
          sample = Math.round(amplitude * 16383 * (Math.random() - 0.5));
        }
        view.setInt16(i * 2, sample, true);
      }

      // 异步发送，避免阻塞
      this.sendToMainProcess(new Uint8Array(audioData));

    } catch (error) {
      logger.error('音频数据创建失败:', error);
    }
  }

  private sendToMainProcess(audioData: Uint8Array): void {
    if (!isElectron || !window.electron || !window.electron.tencentSpeech) {
      return;
    }

    // 使用非阻塞的方式发送
    setTimeout(() => {
      if (this.isDestroyed || !this.isListening) return;

      window.electron!.tencentSpeech!.sendAudio(audioData)
        .then(result => {
          if (!result.success) {
            logger.warn('音频发送失败:', result.error);
          }
        })
        .catch(error => {
          logger.warn('音频发送异常:', error);
        });
    }, 0);
  }

  async stopListening(): Promise<void> {
    try {
      logger.info('正在停止语音识别...');
      this.isListening = false;

      // 停止音频处理定时器
      if (this.audioProcessTimer) {
        clearInterval(this.audioProcessTimer);
        this.audioProcessTimer = null;
      }

      // 断开音频节点
      if (this.sourceNode) {
        try {
          this.sourceNode.disconnect();
          this.sourceNode = null;
        } catch (error) {
          logger.warn('断开音频源节点失败:', error);
        }
      }

      if (this.analyser) {
        try {
          this.analyser.disconnect();
          this.analyser = null;
        } catch (error) {
          logger.warn('断开分析器节点失败:', error);
        }
      }

      // 关闭音频上下文
      if (this.audioContext) {
        try {
          if (this.audioContext.state !== 'closed') {
            await this.audioContext.close();
          }
          this.audioContext = null;
        } catch (error) {
          logger.warn('关闭音频上下文失败:', error);
        }
      }

      // 停止媒体流
      if (this.mediaStream) {
        try {
          this.mediaStream.getTracks().forEach(track => track.stop());
          this.mediaStream = null;
        } catch (error) {
          logger.warn('停止媒体流失败:', error);
        }
      }

      // 停止主进程服务
      if (isElectron && window.electron && window.electron.tencentSpeech) {
        try {
          await window.electron.tencentSpeech.stop();
        } catch (error) {
          logger.warn('停止主进程服务失败:', error);
        }
      }

      logger.info('语音识别已完全停止');
    } catch (error) {
      logger.error('停止语音识别过程中出现错误:', error);
      // 确保状态重置
      this.isListening = false;
      this.sourceNode = null;
      this.analyser = null;
      this.audioContext = null;
      this.mediaStream = null;
    }
  }

  // 销毁服务
  async destroy(): Promise<void> {
    this.isDestroyed = true;
    await this.stopListening();
    logger.info('服务已销毁');
  }

  isRecording(): boolean {
    return this.isListening && !this.isDestroyed;
  }

  // 测试麦克风权限
  async testMicrophone(): Promise<boolean> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (error) {
      logger.error('麦克风测试失败:', error);
      return false;
    }
  }
}

// 导出单例实例
export const tencentSpeechServiceSafe = new TencentSpeechServiceSafe();