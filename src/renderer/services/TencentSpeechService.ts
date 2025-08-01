// 简单的日志工具
const logger = {
  info: (message: string, ...args: any[]) => console.log(`[INFO] ${message}`, ...args),
  warn: (message: string, ...args: any[]) => console.warn(`[WARN] ${message}`, ...args),
  error: (message: string, ...args: any[]) => console.error(`[ERROR] ${message}`, ...args),
  debug: (message: string, ...args: any[]) => console.log(`[DEBUG] ${message}`, ...args)
};

// 检查是否在 Electron 环境中
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


export class TencentSpeechService {
  private mediaStream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private processorNode: ScriptProcessorNode | null = null;
  private isListening = false;
  private audioBuffer: Int16Array = new Int16Array(0);
  private lastSendTime = 0;
  private config: TencentSpeechConfig | null = null;

  // 腾讯云要求的音频参数
  private readonly TARGET_SAMPLE_RATE = 16000; // 16kHz
  private readonly SAMPLES_PER_CHUNK = 640; // 每40ms的样本数 (16000 * 0.04)
  private readonly BYTES_PER_CHUNK = 1280; // 640 * 2 bytes (16位)
  private readonly SEND_INTERVAL = 40; // 40ms发送间隔

  constructor() {
    this.initializeService();
  }

  private async initializeService() {
    try {
      logger.info('腾讯云语音识别服务初始化开始');
      
      // 检查浏览器支持
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('浏览器不支持音频录制功能');
      }

      if (!window.AudioContext && !(window as any).webkitAudioContext) {
        throw new Error('浏览器不支持Web Audio API');
      }

      logger.info('腾讯云语音识别服务初始化完成');
    } catch (error) {
      logger.error('腾讯云语音识别服务初始化失败:', error);
      throw error;
    }
  }

  // 公共初始化方法，供外部调用
  async initialize(config: TencentSpeechConfig): Promise<void> {
    try {
      this.config = config;
      logger.info('腾讯云语音识别配置已更新:', {
        appId: config.appId,
        region: config.region,
        engineType: config.engineType
      });
      
      // 执行基础初始化
      await this.initializeService();
      
      // 在 Electron 环境中，同时初始化主进程服务
      if (isElectron && window.electron && window.electron.tencentSpeech) {
        const result = await window.electron.tencentSpeech.initialize(config);
        if (!result.success) {
          throw new Error(result.error || '主进程初始化失败');
        }
        logger.info('主进程腾讯云语音识别服务初始化成功');
      }
    } catch (error) {
      logger.error('初始化腾讯云语音识别失败:', error);
      throw error;
    }
  }

  // 更新配置方法
  async updateConfig(config: TencentSpeechConfig): Promise<void> {
    try {
      this.config = config;
      logger.info('腾讯云语音识别配置已更新');
      
      // 在 Electron 环境中，同时更新主进程配置
      if (isElectron && window.electron && window.electron.tencentSpeech) {
        const result = await window.electron.tencentSpeech.initialize(config);
        if (!result.success) {
          throw new Error(result.error || '主进程配置更新失败');
        }
        logger.info('主进程腾讯云语音识别配置更新成功');
      }
    } catch (error) {
      logger.error('更新腾讯云语音识别配置失败:', error);
      throw error;
    }
  }

  async startListening(config: TencentSpeechConfig): Promise<void> {
    try {
      if (this.isListening) {
        logger.warn('语音识别已在进行中');
        return;
      }

      this.config = config;
      logger.info('开始语音识别，配置:', {
        appId: config.appId,
        region: config.region,
        engineType: config.engineType,
        voiceFormat: config.voiceFormat
      });

      // 请求麦克风权限
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: this.TARGET_SAMPLE_RATE, // 尝试直接请求16kHz
          channelCount: 1, // 单声道
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      // 创建音频上下文
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioContextClass({
        sampleRate: this.TARGET_SAMPLE_RATE // 尝试设置为16kHz
      });

      logger.info(`音频上下文创建成功，采样率: ${this.audioContext.sampleRate}Hz`);

      // 创建音频源节点
      this.sourceNode = this.audioContext.createMediaStreamSource(this.mediaStream);

      // 创建音频处理节点 (4096是缓冲区大小)
      this.processorNode = this.audioContext.createScriptProcessor(4096, 1, 1);

      // 初始化音频缓冲区
      this.audioBuffer = new Int16Array(0);
      this.lastSendTime = 0;

      // 设置音频处理回调
      this.processorNode.onaudioprocess = (e) => {
        this.processAudioData(e);
      };

      // 连接音频节点
      this.sourceNode.connect(this.processorNode);
      this.processorNode.connect(this.audioContext.destination);

      this.isListening = true;

      // 通知主进程开始语音识别
      if (isElectron && window.electron && window.electron.tencentSpeech) {
        const result = await window.electron.tencentSpeech.start();
        if (!result.success) {
          throw new Error(result.error || '启动语音识别失败');
        }
        logger.info('主进程语音识别启动成功');
      } else {
        logger.warn('Electron API 不可用，无法启动语音识别');
      }

    } catch (error) {
      logger.error('启动语音识别失败:', error);
      await this.stopListening();
      throw error;
    }
  }

  private processAudioData(e: AudioProcessingEvent) {
    if (!this.isListening) return;

    try {
      // 获取音频数据 (Float32Array)
      const inputData = e.inputBuffer.getChannelData(0);
      
      if (!inputData || inputData.length === 0) {
        logger.debug('收到空音频数据');
        return;
      }

      // 检查音频数据是否有效
      let hasAudio = false;
      let maxAmplitude = 0;
      for (let i = 0; i < inputData.length; i++) {
        const amplitude = Math.abs(inputData[i]);
        maxAmplitude = Math.max(maxAmplitude, amplitude);
        if (amplitude > 0.001) { // 降低阈值，检测更微弱的声音
          hasAudio = true;
        }
      }

      // 检查是否需要重采样
      const currentSampleRate = this.audioContext!.sampleRate;
      let processedData: Float32Array;

      if (currentSampleRate !== this.TARGET_SAMPLE_RATE) {
        // 需要重采样到16kHz
        processedData = this.resampleAudio(inputData, currentSampleRate, this.TARGET_SAMPLE_RATE);
        logger.debug(`重采样: ${currentSampleRate}Hz -> ${this.TARGET_SAMPLE_RATE}Hz, 样本数: ${inputData.length} -> ${processedData.length}`);
      } else {
        processedData = inputData;
      }

      // 转换为16位PCM格式
      const pcmData = this.convertToPCM16(processedData);

      // 添加到缓冲区
      const newBuffer = new Int16Array(this.audioBuffer.length + pcmData.length);
      newBuffer.set(this.audioBuffer);
      newBuffer.set(pcmData, this.audioBuffer.length);
      this.audioBuffer = newBuffer;

      // 记录音频状态
      if (hasAudio) {
        logger.debug(`处理音频数据: 长度=${inputData.length}, 最大振幅=${maxAmplitude.toFixed(4)}, 有效音频=${hasAudio}`);
      }

      // 发送音频数据块
      this.sendAudioChunks();

    } catch (error) {
      console.error('处理音频数据失败:', error);
      logger.error('处理音频数据失败:', error);
    }
  }

  private resampleAudio(inputData: Float32Array, inputSampleRate: number, outputSampleRate: number): Float32Array {
    if (inputSampleRate === outputSampleRate) {
      return inputData;
    }

    const ratio = inputSampleRate / outputSampleRate;
    const outputLength = Math.round(inputData.length / ratio);
    const outputData = new Float32Array(outputLength);

    for (let i = 0; i < outputLength; i++) {
      const inputIndex = i * ratio;
      const inputIndexFloor = Math.floor(inputIndex);
      const inputIndexCeil = Math.min(inputIndexFloor + 1, inputData.length - 1);
      const fraction = inputIndex - inputIndexFloor;

      // 线性插值
      outputData[i] = inputData[inputIndexFloor] * (1 - fraction) + inputData[inputIndexCeil] * fraction;
    }

    return outputData;
  }

  private convertToPCM16(floatData: Float32Array): Int16Array {
    const pcmData = new Int16Array(floatData.length);
    for (let i = 0; i < floatData.length; i++) {
      // 限制范围到 [-1, 1]
      const sample = Math.max(-1, Math.min(1, floatData[i]));
      // 转换为16位整数
      pcmData[i] = Math.round(sample * 32767);
    }
    return pcmData;
  }

  private sendAudioChunks() {
    const now = Date.now();
    
    // 控制发送频率 (40ms间隔)
    if (now - this.lastSendTime < this.SEND_INTERVAL) {
      return;
    }

    // 检查是否有足够的数据发送
    while (this.audioBuffer.length >= this.SAMPLES_PER_CHUNK) {
      // 提取640个样本 (1280字节)
      const chunk = this.audioBuffer.slice(0, this.SAMPLES_PER_CHUNK);
      
      // 更新缓冲区
      this.audioBuffer = this.audioBuffer.slice(this.SAMPLES_PER_CHUNK);

      // 转换为ArrayBuffer，确保字节序正确
      const audioData = new ArrayBuffer(this.BYTES_PER_CHUNK);
      const view = new DataView(audioData);
      
      // 写入16位PCM数据 (小端序，腾讯云要求)
      for (let i = 0; i < chunk.length; i++) {
        // 限制数值范围到 [-32768, 32767]
        const sample = Math.max(-32768, Math.min(32767, chunk[i]));
        view.setInt16(i * 2, sample, true); // true表示小端序
      }

      // 验证生成的数据
      if (audioData.byteLength !== this.BYTES_PER_CHUNK) {
        logger.error(`音频数据长度错误: ${audioData.byteLength}, 期望: ${this.BYTES_PER_CHUNK}`);
        continue;
      }

      logger.debug(`发送音频数据: ${audioData.byteLength} 字节, 样本数: ${chunk.length}`);

      // 发送到主进程
      if (isElectron && window.electron && window.electron.tencentSpeech) {
        console.log(`[渲染进程] 准备发送音频数据到主进程: ${audioData.byteLength} 字节`);
        window.electron.tencentSpeech.sendAudio(audioData).then(result => {
          if (!result.success) {
            console.log('[渲染进程] 发送音频数据失败:', result.error);
            logger.error('发送音频数据失败:', result.error);
          } else {
            console.log(`[渲染进程] ✅ 音频数据发送成功: ${audioData.byteLength} 字节`);
          }
        }).catch(error => {
          console.log('[渲染进程] 发送音频数据异常:', error);
          logger.error('发送音频数据异常:', error);
        });
      } else {
        console.log('[渲染进程] ❌ Electron API 不可用，无法发送音频数据');
      }

      this.lastSendTime = now;
      break; // 每次只发送一个块，避免阻塞
    }
  }

  async stopListening(): Promise<void> {
    try {
      logger.info('停止语音识别');
      this.isListening = false;

      // 断开音频节点连接
      if (this.sourceNode) {
        this.sourceNode.disconnect();
        this.sourceNode = null;
      }

      if (this.processorNode) {
        this.processorNode.disconnect();
        this.processorNode = null;
      }

      // 关闭音频上下文
      if (this.audioContext && this.audioContext.state !== 'closed') {
        await this.audioContext.close();
        this.audioContext = null;
      }

      // 停止媒体流
      if (this.mediaStream) {
        this.mediaStream.getTracks().forEach(track => track.stop());
        this.mediaStream = null;
      }

      // 清空缓冲区
      this.audioBuffer = new Int16Array(0);

      // 通知主进程停止语音识别
      if (isElectron && window.electron && window.electron.tencentSpeech) {
        const result = await window.electron.tencentSpeech.stop();
        if (!result.success) {
          logger.warn('停止语音识别失败:', result.error);
        }
      }

      logger.info('语音识别已停止');
    } catch (error) {
      logger.error('停止语音识别失败:', error);
      throw error;
    }
  }

  isRecording(): boolean {
    return this.isListening;
  }

  // 获取音频设备列表
  async getAudioDevices(): Promise<MediaDeviceInfo[]> {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices.filter(device => device.kind === 'audioinput');
    } catch (error) {
      logger.error('获取音频设备失败:', error);
      return [];
    }
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
export const tencentSpeechService = new TencentSpeechService();