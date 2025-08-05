import * as CryptoJS from 'crypto-js';

export interface TencentConfig {
  appId: string;
  secretId: string;
  secretKey: string;
  engineModelType?: string;
  voiceFormat?: number;
}

export interface RecognitionResult {
  code: number;
  message?: string;
  voice_id?: string;
  result?: {
    slice_type: number;
    voice_text_str: string;
    start_time: number;
    end_time: number;
  };
  final?: number;
}

export class TencentSpeechRecognizer {
  private config: TencentConfig;
  private websocket: WebSocket | null = null;
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private processor: ScriptProcessorNode | null = null;
  private voiceId: string;
  private status: 'idle' | 'connecting' | 'connected' | 'recording' | 'error' =
    'idle';

  // 回调函数
  private onResultCallback?: (result: RecognitionResult) => void;
  private onErrorCallback?: (error: string) => void;
  private onStatusChangeCallback?: (status: string) => void;

  constructor(config: TencentConfig) {
    this.config = config;
    this.voiceId = this.generateVoiceId();
  }

  // 生成音频流唯一标识
  private generateVoiceId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2);
    return `voice_${timestamp}_${random}`;
  }

  // 构建WebSocket连接URL
  private buildWebSocketUrl(): string {
    const timestamp = Math.floor(Date.now() / 1000);
    const nonce = Math.floor(Math.random() * 1000000000); // 最长10位随机数
    const expired = timestamp + 3600; // 1小时后过期

    // 构建参数对象（不包含signature）
    const params: Record<string, string | number> = {
      secretid: this.config.secretId,
      timestamp: timestamp,
      expired: expired,
      nonce: nonce,
      engine_model_type: this.config.engineModelType || '16k_zh',
      voice_id: this.voiceId,
      voice_format: 1, // PCM格式
      filter_dirty: 1,
      filter_modal: 1,
      filter_punc: 0,
      convert_num_mode: 1,
      word_info: 1,
    };

    // 按键名排序并构建查询字符串
    const sortedKeys = Object.keys(params).sort();
    const queryString = sortedKeys
      .map(key => `${key}=${params[key]}`)
      .join('&');

    // 构建签名原文（不包含协议部分，使用appId而不是secretId）
    const signatureString = `asr.cloud.tencent.com/asr/v2/${this.config.appId}?${queryString}`;

    // 使用HMAC-SHA1加密并Base64编码（根据文档要求）
    const signature = CryptoJS.HmacSHA1(
      signatureString,
      this.config.secretKey
    ).toString(CryptoJS.enc.Base64);

    // 构建最终URL（使用appId而不是secretId）
    const finalUrl = `wss://asr.cloud.tencent.com/asr/v2/${this.config.appId}?${queryString}&signature=${encodeURIComponent(signature)}`;

    console.log('WebSocket URL:', finalUrl);
    console.log('签名原文:', signatureString);
    return finalUrl;
  }

  // 设置回调函数
  public setCallbacks(
    onResult?: (result: RecognitionResult) => void,
    onError?: (error: string) => void,
    onStatusChange?: (status: string) => void
  ) {
    this.onResultCallback = onResult;
    this.onErrorCallback = onError;
    this.onStatusChangeCallback = onStatusChange;
  }

  // 获取当前状态
  public getStatus(): { isRecording: boolean; status: string } {
    return {
      isRecording: this.status === 'recording',
      status: this.status,
    };
  }

  // 开始语音识别
  public async start(): Promise<void> {
    try {
      this.updateStatus('connecting');

      // 建立WebSocket连接
      await this.connectWebSocket();

      // 获取麦克风权限并开始录音
      await this.startRecording();

      this.updateStatus('recording');
    } catch (error) {
      this.updateStatus('error');
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      this.onErrorCallback?.(errorMessage);
      throw error;
    }
  }

  // 停止语音识别
  public stop(): void {
    try {
      // 发送结束标识
      if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
        this.websocket.send(JSON.stringify({ type: 'end' }));
      }

      // 停止录音
      this.stopRecording();

      // 关闭WebSocket连接
      if (this.websocket) {
        this.websocket.close();
        this.websocket = null;
      }

      this.updateStatus('idle');
    } catch (error) {
      console.error('停止识别时出错:', error);
    }
  }

  // 建立WebSocket连接
  private connectWebSocket(): Promise<void> {
    return new Promise((resolve, reject) => {
      const url = this.buildWebSocketUrl();
      this.websocket = new WebSocket(url);

      this.websocket.onopen = () => {
        console.log('WebSocket连接已建立');
        this.updateStatus('connected');
        resolve();
      };

      this.websocket.onmessage = event => {
        try {
          const result: RecognitionResult = JSON.parse(event.data);
          this.handleRecognitionResult(result);
        } catch (error) {
          console.error('解析识别结果失败:', error);
        }
      };

      this.websocket.onerror = error => {
        console.error('WebSocket错误:', error);
        this.updateStatus('error');
        reject(new Error('WebSocket连接错误'));
      };

      this.websocket.onclose = event => {
        console.log('WebSocket连接已关闭:', event.code, event.reason);
        this.updateStatus('idle');
      };
    });
  }

  // 开始录音
  private async startRecording(): Promise<void> {
    try {
      // 获取麦克风权限
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });

      // 创建音频上下文
      this.audioContext = new (window.AudioContext ||
        (window as any).webkitAudioContext)({
        sampleRate: 16000,
      });

      const source = this.audioContext.createMediaStreamSource(
        this.mediaStream
      );

      // 创建音频处理器
      this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);

      this.processor.onaudioprocess = event => {
        if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
          const inputBuffer = event.inputBuffer.getChannelData(0);
          const pcmData = this.convertToPCM16(inputBuffer);
          this.websocket.send(pcmData);
        }
      };

      source.connect(this.processor);
      this.processor.connect(this.audioContext.destination);
    } catch (error) {
      throw new Error(`获取麦克风权限失败: ${error}`);
    }
  }

  // 停止录音
  private stopRecording(): void {
    if (this.processor) {
      this.processor.disconnect();
      this.processor = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
  }

  // 将Float32Array转换为PCM16格式
  private convertToPCM16(float32Array: Float32Array): ArrayBuffer {
    const buffer = new ArrayBuffer(float32Array.length * 2);
    const view = new DataView(buffer);

    for (let i = 0; i < float32Array.length; i++) {
      const sample = Math.max(-1, Math.min(1, float32Array[i]));
      const pcm = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
      view.setInt16(i * 2, pcm, true); // little-endian
    }

    return buffer;
  }

  // 处理识别结果
  private handleRecognitionResult(result: RecognitionResult): void {
    console.log('收到识别结果:', result);

    if (result.code === 0) {
      // 识别成功
      this.onResultCallback?.(result);
    } else {
      // 识别错误
      const errorMessage = result.message || `识别错误，错误码: ${result.code}`;
      console.error('识别错误:', errorMessage);
      this.onErrorCallback?.(errorMessage);
    }

    // 如果是最终结果，关闭连接
    if (result.final === 1) {
      this.stop();
    }
  }

  // 更新状态
  private updateStatus(newStatus: typeof this.status): void {
    this.status = newStatus;
    this.onStatusChangeCallback?.(newStatus);
  }

  // 销毁实例
  public destroy(): void {
    this.stop();
    this.onResultCallback = undefined;
    this.onErrorCallback = undefined;
    this.onStatusChangeCallback = undefined;
  }
}
