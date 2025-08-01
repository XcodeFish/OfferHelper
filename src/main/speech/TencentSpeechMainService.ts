import { ipcMain, BrowserWindow } from 'electron';
import WebSocket from 'ws';
import { EventEmitter } from 'events';
import { logger } from '../../shared/utils/Logger';
import { v4 as uuidv4 } from 'uuid';
import * as crypto from 'crypto';

/**
 * 腾讯云实时语音识别主进程服务
 * 在主进程中处理WebSocket连接，避开浏览器安全限制
 */
export class TencentSpeechMainService extends EventEmitter {
  private websocket: WebSocket | null = null;
  private config: TencentSpeechConfig | null = null;
  private voiceId: string = '';
  private isConnected: boolean = false;
  private mainWindow: BrowserWindow | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private lastAudioTime: number = 0;

  constructor() {
    super();
    this.setupIpcHandlers();
  }

  /**
   * 设置主窗口引用
   */
  public setMainWindow(window: BrowserWindow): void {
    this.mainWindow = window;
  }

  /**
   * 设置IPC处理器
   */
  private setupIpcHandlers(): void {
    // 初始化腾讯云语音识别
    ipcMain.handle('tencent-speech:initialize', async (event, config: TencentSpeechConfig) => {
      try {
        await this.initialize(config);
        return { success: true };
      } catch (error) {
        logger.error('腾讯云语音识别初始化失败:', error);
        return { 
          success: false, 
          error: error instanceof Error ? error.message : '初始化失败' 
        };
      }
    });

    // 开始语音识别
    ipcMain.handle('tencent-speech:start', async () => {
      try {
        await this.startListening();
        return { success: true };
      } catch (error) {
        logger.error('启动腾讯云语音识别失败:', error);
        return { 
          success: false, 
          error: error instanceof Error ? error.message : '启动失败' 
        };
      }
    });

    // 停止语音识别
    ipcMain.handle('tencent-speech:stop', () => {
      try {
        this.stopListening();
        return { success: true };
      } catch (error) {
        logger.error('停止腾讯云语音识别失败:', error);
        return { 
          success: false, 
          error: error instanceof Error ? error.message : '停止失败' 
        };
      }
    });

    // 发送音频数据
    ipcMain.handle('tencent-speech:send-audio', (event, audioData: ArrayBuffer) => {
      try {
        this.sendAudioData(audioData);
        return { success: true };
      } catch (error) {
        logger.error('发送音频数据失败:', error);
        return { 
          success: false, 
          error: error instanceof Error ? error.message : '发送失败' 
        };
      }
    });

    // 获取连接状态
    ipcMain.handle('tencent-speech:get-status', () => {
      return {
        isConnected: this.isConnected,
        voiceId: this.voiceId
      };
    });
  }

  /**
   * 发送消息到渲染进程
   */
  private sendToRenderer(channel: string, data: any): void {
    // 使用 setImmediate 延迟执行，避免在渲染进程销毁时发送消息
    setImmediate(() => {
      try {
        // 检查主窗口是否存在且未销毁
        if (!this.mainWindow || this.mainWindow.isDestroyed()) {
          return;
        }

        const webContents = this.mainWindow.webContents;
        if (!webContents || webContents.isDestroyed()) {
          return;
        }

        // 检查渲染进程是否准备就绪
        if (webContents.isLoading() || webContents.isCrashed()) {
          return;
        }

        // 检查是否有有效的渲染帧
        try {
          const url = webContents.getURL();
          if (!url || url === 'about:blank' || url === '') {
            return;
          }
        } catch {
          return;
        }

        // 使用 executeJavaScript 替代 send，更安全
        webContents.executeJavaScript(`
          if (window.electron && window.electron.ipcRenderer) {
            window.electron.ipcRenderer.emit('${channel}', ${JSON.stringify(data)});
          }
        `).catch(() => {
          // 静默忽略执行失败
        });

      } catch {
        // 静默忽略所有错误
      }
    });
  }

  /**
   * 开始语音识别
   */
  private async startListening(): Promise<void> {
    if (!this.config) {
      throw new Error('腾讯云语音识别未初始化');
    }

    if (this.isConnected) {
      logger.warn('腾讯云语音识别已在进行中');
      return;
    }

    try {
      // 生成新的语音ID
      this.voiceId = uuidv4().replace(/-/g, '').substring(0, 16);
      
      // 创建WebSocket连接
      await this.createWebSocketConnection();
      
      // 记录开始时间
      this.lastAudioTime = Date.now();
      
      // 启动心跳定时器
      this.startHeartbeat();
      
      logger.info('腾讯云语音识别开始，语音ID:', this.voiceId);
      
      // 通知渲染进程
      this.sendToRenderer('speech:started', { voiceId: this.voiceId });
    } catch (error) {
      logger.error('启动腾讯云语音识别失败:', error);
      throw error;
    }
  }

  /**
   * 停止语音识别
   */
  private stopListening(): void {
    if (!this.isConnected) return;

    try {
      // 停止心跳机制
      this.stopHeartbeat();
      
      // 发送结束消息
      if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
        this.websocket.send(JSON.stringify({ type: 'end' }));
      }
      
      // 关闭WebSocket连接
      this.cleanup();
      
      logger.info('腾讯云语音识别结束');
      
      // 通知渲染进程
      this.sendToRenderer('speech:ended', {});
    } catch (error) {
      logger.error('停止腾讯云语音识别失败:', error);
      this.sendToRenderer('speech:error', {
        error: 'stop_failed',
        message: error instanceof Error ? error.message : '停止失败'
      });
    }
  }

  /**
   * 创建WebSocket连接
   */
  private async createWebSocketConnection(): Promise<void> {
    if (!this.config) {
      throw new Error('配置未初始化');
    }

    try {
      // 生成签名URL
      const url = this.generateSignedUrl();
      
      // 创建WebSocket连接
      this.websocket = new WebSocket(url);
      
      // 设置WebSocket事件处理
      this.websocket.on('open', () => {
        this.isConnected = true;
        logger.info('腾讯云WebSocket连接已建立');
      });
      
      this.websocket.on('message', (data: Buffer) => {
        try {
          const response = JSON.parse(data.toString());
          this.handleWebSocketMessage(response);
        } catch (error) {
          logger.error('解析WebSocket消息失败:', error);
        }
      });
      
      this.websocket.on('error', (error: Error) => {
        logger.error('WebSocket错误:', error);
        this.sendToRenderer('speech:error', {
          error: 'websocket_error',
          message: '腾讯云WebSocket连接错误: ' + (error instanceof Error ? error.message : String(error))
        });
      });
      
      this.websocket.on('close', (code: number, reason: string) => {
        this.isConnected = false;
        logger.info(`WebSocket连接已关闭: ${code} ${reason}`);
        this.sendToRenderer('speech:ended', {});
      });
      
      // 等待连接建立
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('WebSocket连接超时'));
        }, 10000);
        
        this.websocket!.on('open', () => {
          clearTimeout(timeout);
          resolve();
        });
        
        this.websocket!.on('error', (error: Error) => {
          clearTimeout(timeout);
          reject(error);
        });
      });
    } catch (error) {
      logger.error('创建WebSocket连接失败:', error);
      throw error;
    }
  }

  /**
   * 生成签名URL
   */
  private generateSignedUrl(): string {
    if (!this.config) {
      throw new Error('配置未初始化');
    }

    try {
      // 生成当前时间戳
      const timestamp = Math.floor(Date.now() / 1000);
      // 设置过期时间（1小时后）
      const expired = timestamp + 3600;
      // 生成随机数
      const nonce = Math.floor(Math.random() * 100000000);
      
      // 构建请求参数 - 注意：必须包含 secretid 和 timestamp
      const params = new Map<string, string | number>();
      params.set('secretid', this.config.secretId);  // 必需参数
      params.set('timestamp', timestamp);            // 必需参数
      params.set('engine_model_type', this.config.engineType);
      params.set('expired', expired);
      params.set('nonce', nonce);
      params.set('voice_id', this.voiceId);
      params.set('voice_format', this.config.voiceFormat);
      params.set('needvad', this.config.needVad);
      
      if (this.config.hotwordId) {
        params.set('hotword_id', this.config.hotwordId);
      }
      
      params.set('filter_dirty', this.config.filterDirty);
      params.set('filter_modal', this.config.filterModal);
      params.set('filter_punc', this.config.filterPunc);
      params.set('convert_num_mode', this.config.convertNumMode);
      params.set('filter_empty_result', this.config.filterEmptyResult);
      params.set('vad_silence_time', this.config.vadSilenceTime);
      
      // 构建签名原文
      let signText = `asr.cloud.tencent.com/asr/v2/${this.config.appId}?`;
      const sortedParams = [...params.entries()].sort((a, b) => a[0].localeCompare(b[0]));
      signText += sortedParams.map(([key, value]) => `${key}=${value}`).join('&');
      
      logger.debug('签名原文:', signText);
      
      // 使用HMAC-SHA1算法和SecretKey对签名原文进行签名
      const hmac = crypto.createHmac('sha1', this.config.secretKey);
      hmac.update(signText);
      const signature = hmac.digest('base64');
      
      // URL编码签名
      const encodedSignature = encodeURIComponent(signature);
      
      // 构建最终URL
      let url = `wss://asr.cloud.tencent.com/asr/v2/${this.config.appId}?`;
      url += sortedParams.map(([key, value]) => `${key}=${value}`).join('&');
      url += `&signature=${encodedSignature}`;
      
      logger.debug('生成的WebSocket URL:', url.replace(this.config.secretId, '***').replace(encodedSignature, '***'));
      
      return url;
    } catch (error) {
      logger.error('生成签名URL失败:', error);
      throw error;
    }
  }

  /**
   * 启动心跳机制
   */
  private startHeartbeat(): void {
    console.log('[主进程] 启动心跳机制');
    
    // 清除之前的定时器
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
    }

    // 每3秒检查一次状态
    this.heartbeatTimer = setInterval(() => {
      if (!this.isConnected || !this.websocket || this.websocket.readyState !== WebSocket.OPEN) {
        console.log(`[主进程] 心跳检查跳过: 连接=${this.isConnected}, WebSocket=${this.websocket ? this.websocket.readyState : 'null'}`);
        return;
      }

      const now = Date.now();
      const timeSinceLastAudio = now - this.lastAudioTime;
      console.log(`[主进程] 心跳检查: 距离上次音频 ${timeSinceLastAudio}ms`);
      
      // 如果超过8秒没有音频数据，发送 WebSocket ping 以保持连接
      if (timeSinceLastAudio > 8000) {
        try {
          console.log('[主进程] 准备发送 WebSocket ping');
          this.websocket.ping();
          console.log('[主进程] ✅ 已发送 WebSocket ping');
          logger.debug('发送 WebSocket ping 用于心跳');
        } catch (error) {
          console.log('[主进程] ❌ 发送 WebSocket ping 失败:', error);
          logger.error('发送 WebSocket ping 失败:', error);
        }
      }
      
      // 如果超过60秒没有有效音频数据，主动停止识别
      if (timeSinceLastAudio > 60000) {
        console.log('[主进程] 超过60秒未接收到音频数据，主动停止识别');
        logger.warn('超过60秒未接收到有效音频数据，主动停止语音识别');
        this.stopListening();
      }
    }, 3000); // 3秒检查一次
  }

  /**
   * 停止心跳机制
   */
  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  /**
   * 发送音频数据
   */
  private sendAudioData(audioData: ArrayBuffer): void {
    console.log(`[主进程] 收到音频数据: ${audioData.byteLength} 字节`);
    
    if (!this.websocket || this.websocket.readyState !== WebSocket.OPEN) {
      console.log(`[主进程] WebSocket连接状态异常: ${this.websocket ? this.websocket.readyState : 'null'}`);
      logger.warn('WebSocket连接未建立，跳过音频数据发送');
      return;
    }

    if (!this.config) {
      console.log('[主进程] 配置未初始化');
      logger.error('配置未初始化，无法发送音频数据');
      return;
    }

    try {
      // 验证音频数据
      if (!audioData || audioData.byteLength === 0) {
        console.log('[主进程] 收到空音频数据，跳过发送');
        logger.debug('跳过空音频数据');
        return;
      }

      // 验证音频格式与配置是否匹配
      const expectedFormat = this.config.voiceFormat;
      console.log(`[主进程] 音频格式配置: ${expectedFormat}, 数据长度: ${audioData.byteLength}`);
      
      // 对于PCM格式，验证数据长度必须是偶数字节（16位PCM要求）
      if (expectedFormat === 1 && audioData.byteLength % 2 !== 0) {
        console.log(`[主进程] PCM音频数据字节数不是偶数: ${audioData.byteLength}`);
        logger.error(`PCM音频数据字节数不是偶数: ${audioData.byteLength}，数据格式错误`);
        return; // 直接丢弃格式错误的数据
      }
      
      // 腾讯云要求每次发送1280字节 (640个16位样本，40ms音频)
      const EXPECTED_CHUNK_SIZE = 1280;
      if (expectedFormat === 1 && audioData.byteLength !== EXPECTED_CHUNK_SIZE) {
        console.log(`[主进程] 音频数据长度不匹配: 实际=${audioData.byteLength}, 期望=${EXPECTED_CHUNK_SIZE}`);
        logger.warn(`音频数据长度: ${audioData.byteLength} 字节，期望: ${EXPECTED_CHUNK_SIZE} 字节`);
        
        // 如果数据过小，跳过这次发送
        if (audioData.byteLength < EXPECTED_CHUNK_SIZE) {
          console.log('[主进程] 音频数据过小，跳过发送');
          logger.debug('音频数据过小，跳过发送');
          return;
        }
        
        // 如果数据过大，截取前1280字节
        if (audioData.byteLength > EXPECTED_CHUNK_SIZE) {
          console.log('[主进程] 音频数据过大，截取前1280字节');
          logger.debug('音频数据过大，截取前1280字节');
          audioData = audioData.slice(0, EXPECTED_CHUNK_SIZE);
        }
      }

      // 检查音频数据内容（用于调试）
      const dataView = new DataView(audioData);
      let nonZeroCount = 0;
      let maxValue = 0;
      for (let i = 0; i < Math.min(audioData.byteLength, 100); i += 2) {
        const sample = Math.abs(dataView.getInt16(i, true));
        if (sample > 0) nonZeroCount++;
        maxValue = Math.max(maxValue, sample);
      }
      console.log(`[主进程] 音频数据分析: 非零样本=${nonZeroCount}/50, 最大值=${maxValue}`);

      // 创建Buffer并发送到腾讯云
      const buffer = Buffer.from(audioData);
      
      // 确保WebSocket仍然处于开放状态
      if (this.websocket.readyState === WebSocket.OPEN) {
        console.log(`[主进程] 准备发送音频数据到腾讯云: ${buffer.length} 字节`);
        this.websocket.send(buffer);
        console.log(`[主进程] ✅ 音频数据已成功发送到腾讯云: ${buffer.length} 字节`);
        logger.debug(`音频数据已发送到腾讯云: ${buffer.length} 字节`);
        
        // 更新最后接收音频数据的时间
        this.lastAudioTime = Date.now();
      } else {
        console.log(`[主进程] WebSocket状态异常，无法发送: ${this.websocket.readyState}`);
        logger.warn(`WebSocket状态异常，无法发送音频数据: ${this.websocket.readyState}`);
      }
    } catch (error) {
      console.log('[主进程] 发送音频数据时发生错误:', error);
      logger.error('发送音频数据失败:', error);
      // 发送错误通知到渲染进程
      this.sendToRenderer('speech:error', {
        error: 'audio_send_failed',
        message: '音频数据发送失败: ' + (error instanceof Error ? error.message : String(error))
      });
    }
  }

  /**
   * 处理WebSocket消息
   */
  private handleWebSocketMessage(response: any): void {
    try {
      // 检查响应格式
      if (!response || typeof response !== 'object') {
        logger.warn('收到无效的WebSocket消息格式');
        return;
      }

      // 检查是否有错误
      if (response.code !== undefined && response.code !== 0) {
        const errorMessage = this.getErrorMessage(response.code, response.message);
        logger.error(`腾讯云语音识别错误 [${response.code}]:`, errorMessage);
        
        this.sendToRenderer('speech:error', {
          error: `tencent_error_${response.code}`,
          message: errorMessage
        });
        
        // 对于严重错误，停止识别
        if (response.code === 4001 || response.code === 4003 || response.code === 4004) {
          this.stopListening();
        }
        return;
      }
      
      // 处理识别结果
      if (response.result && response.result.voice_text_str) {
        const result = response.result;
        const text = result.voice_text_str.trim();
        
        if (!text) {
          logger.debug('收到空的识别结果');
          return;
        }
        
        // 根据slice_type判断是中间结果还是最终结果
        if (result.slice_type === 0) {
          // 开始识别
          logger.debug('语音识别片段开始');
        } else if (result.slice_type === 1) {
          // 中间结果
          logger.debug('收到中间识别结果:', text);
          this.handleInterimResult(text);
        } else if (result.slice_type === 2) {
          // 最终结果
          logger.info('收到最终识别结果:', text);
          this.handleFinalResult(text);
        }
      }
      
      // 处理final标志
      if (response.final === 1) {
        logger.info('语音识别会话完成');
        this.stopListening();
      }
    } catch (error) {
      logger.error('处理WebSocket消息失败:', error);
      this.sendToRenderer('speech:error', {
        error: 'message_parse_error',
        message: '解析语音识别响应失败'
      });
    }
  }

  /**
   * 获取错误消息
   */
  private getErrorMessage(code: number, message?: string): string {
    const errorMessages: { [key: number]: string } = {
      4001: '音频解码失败，请检查音频格式是否为16kHz 16bit PCM',
      4002: '识别超时，请重新开始识别',
      4003: '鉴权失败，请检查SecretId和SecretKey是否正确',
      4004: '参数错误，请检查请求参数',
      4005: '音频数据过长，单次识别不能超过60秒',
      4006: '服务内部错误，请稍后重试',
      4007: '音频数据为空或格式错误',
      4008: '音频数据过短，至少需要0.1秒的音频',
      4009: '请求频率过高，请降低请求频率'
    };

    return errorMessages[code] || message || `未知错误 (${code})`;
  }

  /**
   * 处理中间结果
   */
  private handleInterimResult(text: string): void {
    if (!text) return;
    
    this.sendToRenderer('speech:interim', {
      transcript: text,
      confidence: 0.5,
      isFinal: false,
      timestamp: Date.now()
    });
  }

  /**
   * 处理最终结果
   */
  private handleFinalResult(text: string): void {
    if (!text) return;
    
    this.sendToRenderer('speech:result', {
      transcript: text,
      confidence: 0.9,
      isFinal: true,
      timestamp: Date.now()
    });
  }

  /**
   * 初始化腾讯云语音识别服务
   */
  public async initialize(config: TencentSpeechConfig): Promise<void> {
    try {
      // 验证必要的配置参数
      if (!config.secretId || !config.secretKey || !config.appId) {
        throw new Error('腾讯云配置参数不完整');
      }

      this.config = config;
      logger.info('腾讯云语音识别主进程服务初始化成功');
    } catch (error) {
      logger.error('腾讯云语音识别初始化失败:', error);
      throw error;
    }
  }

  /**
   * 清理资源
   */
  private cleanup(): void {
    // 停止心跳机制
    this.stopHeartbeat();
    
    if (this.websocket) {
      if (this.websocket.readyState === WebSocket.OPEN || this.websocket.readyState === WebSocket.CONNECTING) {
        this.websocket.close();
      }
      this.websocket = null;
    }
    
    this.isConnected = false;
    this.voiceId = '';
    this.lastAudioTime = 0;
  }

  /**
   * 销毁服务
   */
  public destroy(): void {
    this.cleanup();
    this.removeAllListeners();
    logger.info('腾讯云语音识别主进程服务已销毁');
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
export const tencentSpeechMainService = new TencentSpeechMainService();