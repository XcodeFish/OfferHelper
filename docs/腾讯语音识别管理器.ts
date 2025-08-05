/**
 * 腾讯云实时语音识别服务
 * 基于WebSocket实现实时语音识别功能
 */

import { EventEmitter } from 'events';
import * as crypto from 'crypto';

// 配置接口
export interface TencentASRConfig {
  appid: string;
  secretid: string;
  secretkey: string;
  engine_model_type?: string;
  voice_format?: number;
  region?: string;
}

// 认证参数接口
export interface AuthParams {
  secretid: string;
  timestamp: number;
  expired: number;
  nonce: number;
  signature: string;
  engine_model_type: string;
  voice_id: string;
  voice_format: number;
  hotword_id?: string;
  customization_id?: string;
  filter_dirty?: number;
  filter_modal?: number;
  filter_punc?: number;
  convert_num_mode?: number;
  word_info?: number;
}

// 识别结果接口
export interface ASRResult {
  voice_id: string;
  message_id: string;
  result: {
    slice_type: number;
    index: number;
    start_time: number;
    end_time: number;
    voice_text_str: string;
    word_size: number;
    word_list?: Array<{
      word: string;
      start_time: number;
      end_time: number;
      stable_flag: number;
    }>;
  };
  final: number;
  code: number;
  message: string;
}

// 程序员热词库
export const PROGRAMMER_HOT_WORDS = {
  languages: [
    { word: 'JavaScript', weight: 10 },
    { word: 'TypeScript', weight: 10 },
    { word: 'Python', weight: 10 },
    { word: 'Java', weight: 10 },
    { word: 'C++', weight: 8 },
    { word: 'Go', weight: 8 },
    { word: 'Rust', weight: 6 },
  ],
  frontend: [
    { word: 'React', weight: 10 },
    { word: 'Vue', weight: 10 },
    { word: 'Angular', weight: 8 },
    { word: 'Next.js', weight: 8 },
    { word: 'Webpack', weight: 8 },
    { word: 'Vite', weight: 8 },
  ],
  backend: [
    { word: 'Spring Boot', weight: 9 },
    { word: 'Express', weight: 8 },
    { word: 'Django', weight: 8 },
    { word: 'Flask', weight: 7 },
  ],
  database: [
    { word: 'MySQL', weight: 10 },
    { word: 'MongoDB', weight: 9 },
    { word: 'Redis', weight: 9 },
    { word: 'PostgreSQL', weight: 8 },
  ],
  cloud: [
    { word: 'Docker', weight: 10 },
    { word: 'Kubernetes', weight: 9 },
    { word: 'AWS', weight: 9 },
    { word: '阿里云', weight: 9 },
    { word: '腾讯云', weight: 8 },
  ],
  tools: [
    { word: 'Git', weight: 10 },
    { word: 'GitHub', weight: 9 },
    { word: 'VS Code', weight: 9 },
    { word: 'Jenkins', weight: 8 },
  ],
  concepts: [
    { word: 'API', weight: 10 },
    { word: 'RESTful', weight: 9 },
    { word: '微服务', weight: 9 },
    { word: '容器化', weight: 8 },
    { word: '负载均衡', weight: 7 },
  ],
};

// 生成热词配置
export function generateHotWords(): Array<{ word: string; weight: number }> {
  const allWords: Array<{ word: string; weight: number }> = [];

  Object.values(PROGRAMMER_HOT_WORDS).forEach(category => {
    allWords.push(...category);
  });

  return allWords.sort((a, b) => b.weight - a.weight).slice(0, 100);
}

// 腾讯云ASR认证类
export class TencentASRAuth {
  static generateSignature(
    secretKey: string,
    params: Record<string, any>
  ): string {
    // 1. 参数排序
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}=${params[key]}`)
      .join('&');

    // 2. 构造签名原文
    const signStr = `asr.tencentcloudapi.com/asr/v2/${secretKey}?${sortedParams}`;

    // 3. 生成签名
    return crypto.createHash('sha1').update(signStr).digest('base64');
  }

  static buildAuthParams(config: TencentASRConfig): AuthParams {
    const timestamp = Math.floor(Date.now() / 1000);
    const nonce = Math.floor(Math.random() * 1000000);
    const expired = timestamp + 3600; // 1小时后过期

    const params = {
      secretid: config.secretid,
      timestamp,
      expired,
      nonce,
      engine_model_type: config.engine_model_type || '16k_zh',
      voice_id: `voice_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      voice_format: config.voice_format || 1, // PCM格式
      filter_dirty: 1, // 过滤脏词
      filter_modal: 1, // 过滤语气词
      filter_punc: 0, // 保留标点符号
      convert_num_mode: 1, // 智能数字转换
      word_info: 1, // 显示词级别时间戳
    };

    const signature = this.generateSignature(config.secretkey, params);

    return {
      ...params,
      signature,
    };
  }
}

// 音频处理器
export class AudioProcessor {
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private processor: ScriptProcessorNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;

  async initialize(): Promise<void> {
    try {
      this.audioContext = new (window.AudioContext ||
        (window as any).webkitAudioContext)({
        sampleRate: 16000,
      });

      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      console.log('音频初始化成功');
    } catch (error) {
      console.error('音频初始化失败:', error);
      throw error;
    }
  }

  startProcessing(onAudioData: (audioData: ArrayBuffer) => void): void {
    if (!this.audioContext || !this.mediaStream) {
      throw new Error('音频上下文未初始化');
    }

    try {
      this.source = this.audioContext.createMediaStreamSource(this.mediaStream);
      this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);

      this.processor.onaudioprocess = event => {
        const inputBuffer = event.inputBuffer;
        const inputData = inputBuffer.getChannelData(0);

        const pcmData = this.convertToPCM16(inputData);
        onAudioData(pcmData);
      };

      this.source.connect(this.processor);
      this.processor.connect(this.audioContext.destination);

      console.log('音频处理开始');
    } catch (error) {
      console.error('开始音频处理失败:', error);
      throw error;
    }
  }

  stopProcessing(): void {
    try {
      if (this.processor) {
        this.processor.disconnect();
        this.processor = null;
      }

      if (this.source) {
        this.source.disconnect();
        this.source = null;
      }

      if (this.mediaStream) {
        this.mediaStream.getTracks().forEach(track => track.stop());
        this.mediaStream = null;
      }

      console.log('音频处理停止');
    } catch (error) {
      console.error('停止音频处理失败:', error);
    }
  }

  private convertToPCM16(float32Array: Float32Array): ArrayBuffer {
    const buffer = new ArrayBuffer(float32Array.length * 2);
    const view = new DataView(buffer);

    for (let i = 0; i < float32Array.length; i++) {
      const sample = Math.max(-1, Math.min(1, float32Array[i]));
      view.setInt16(i * 2, sample * 0x7fff, true);
    }

    return buffer;
  }

  getVolumeLevel(audioData: Float32Array): number {
    let sum = 0;
    for (let i = 0; i < audioData.length; i++) {
      sum += audioData[i] * audioData[i];
    }
    const rms = Math.sqrt(sum / audioData.length);
    return Math.min(100, Math.floor(rms * 100 * 10));
  }

  cleanup(): void {
    this.stopProcessing();

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}

// 腾讯云ASR客户端
export class TencentASRClient extends EventEmitter {
  private ws: WebSocket | null = null;
  private config: TencentASRConfig;
  private authParams: AuthParams;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  constructor(config: TencentASRConfig) {
    super();
    this.config = config;
    this.authParams = TencentASRAuth.buildAuthParams(config);
  }

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const url = this.buildConnectionURL();
        this.ws = new WebSocket(url);

        this.ws.onopen = () => {
          console.log('ASR WebSocket 连接成功');
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.emit('connected');
          resolve();
        };

        this.ws.onmessage = event => {
          try {
            const result: ASRResult = JSON.parse(event.data);
            this.handleMessage(result);
          } catch (error) {
            console.error('解析ASR消息失败:', error);
            this.emit('error', error);
          }
        };

        this.ws.onerror = error => {
          console.error('ASR WebSocket 错误:', error);
          this.emit('error', error);
          reject(error);
        };

        this.ws.onclose = event => {
          console.log(
            `ASR WebSocket 连接关闭: ${event.code} - ${event.reason}`
          );
          this.isConnected = false;
          this.emit('disconnected', { code: event.code, reason: event.reason });

          if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.scheduleReconnect();
          }
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  private buildConnectionURL(): string {
    const params = new URLSearchParams();

    Object.entries(this.authParams).forEach(([key, value]) => {
      params.append(key, value.toString());
    });

    return `wss://asr.tencentcloudapi.com/asr/v2/${this.config.secretid}?${params.toString()}`;
  }

  private handleMessage(result: ASRResult): void {
    if (result.code !== 0) {
      console.error('ASR识别错误:', result.message);
      this.emit('error', new Error(result.message));
      return;
    }

    this.emit('result', {
      text: result.result.voice_text_str,
      isFinal: result.final === 1,
      sliceType: result.result.slice_type,
      startTime: result.result.start_time,
      endTime: result.result.end_time,
      wordList: result.result.word_list || [],
    });

    if (result.final === 1) {
      this.emit('finalResult', result.result.voice_text_str);
    }
  }

  sendAudio(audioData: ArrayBuffer): void {
    if (!this.isConnected || !this.ws) {
      console.warn('WebSocket未连接，无法发送音频数据');
      return;
    }

    try {
      this.ws.send(audioData);
    } catch (error) {
      console.error('发送音频数据失败:', error);
      this.emit('error', error);
    }
  }

  sendEnd(): void {
    if (!this.isConnected || !this.ws) {
      return;
    }

    try {
      this.ws.send(new ArrayBuffer(0));
    } catch (error) {
      console.error('发送结束标识失败:', error);
    }
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
  }

  private scheduleReconnect(): void {
    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    console.log(`${delay}ms后尝试第${this.reconnectAttempts}次重连...`);

    setTimeout(() => {
      this.connect().catch(error => {
        console.error('重连失败:', error);
      });
    }, delay);
  }

  isConnectedState(): boolean {
    return this.isConnected;
  }
}

// 语音识别管理器
export class VoiceRecognitionManager extends EventEmitter {
  private asrClient: TencentASRClient;
  private audioProcessor: AudioProcessor;
  private isRecording = false;
  private currentVolumeLevel = 0;

  constructor(config: TencentASRConfig) {
    super();
    this.asrClient = new TencentASRClient(config);
    this.audioProcessor = new AudioProcessor();
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.asrClient.on('connected', () => {
      this.emit('connected');
    });

    this.asrClient.on('disconnected', info => {
      this.emit('disconnected', info);
    });

    this.asrClient.on('result', result => {
      this.emit('result', result);
    });

    this.asrClient.on('finalResult', text => {
      this.emit('finalResult', text);
    });

    this.asrClient.on('error', error => {
      this.emit('error', error);
    });
  }

  async start(): Promise<void> {
    if (this.isRecording) {
      console.warn('语音识别已在进行中');
      return;
    }

    try {
      this.emit('starting');

      await this.audioProcessor.initialize();
      await this.asrClient.connect();

      this.audioProcessor.startProcessing(audioData => {
        this.asrClient.sendAudio(audioData);
      });

      this.isRecording = true;
      this.emit('started');
      console.log('语音识别开始');
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    if (!this.isRecording) {
      return;
    }

    try {
      this.emit('stopping');

      this.audioProcessor.stopProcessing();
      this.asrClient.sendEnd();

      await new Promise(resolve => setTimeout(resolve, 500));

      this.asrClient.disconnect();

      this.isRecording = false;
      this.currentVolumeLevel = 0;
      this.emit('stopped');
      console.log('语音识别停止');
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  write(audioData: ArrayBuffer): void {
    this.asrClient.sendAudio(audioData);
  }

  getStatus() {
    return {
      isRecording: this.isRecording,
      isConnected: this.asrClient.isConnectedState(),
      volumeLevel: this.currentVolumeLevel,
    };
  }

  async cleanup(): Promise<void> {
    try {
      if (this.isRecording) {
        await this.stop();
      }

      this.audioProcessor.cleanup();
      this.removeAllListeners();

      console.log('语音识别服务清理完成');
    } catch (error) {
      console.error('清理资源失败:', error);
    }
  }
}

export default VoiceRecognitionManager;
