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
  private lastSendTime: number = 0; // 添加发送频率控制

  constructor() {
    super();
    console.log('🔥 [主进程] TencentSpeechMainService构造函数开始执行');
    logger.info('[主进程] TencentSpeechMainService构造函数被调用');
    
    console.log('🔥 [主进程] 准备调用setupIpcHandlers');
    this.setupIpcHandlers();
    
    console.log('🔥 [主进程] TencentSpeechMainService构造函数完成');
    logger.info('[主进程] TencentSpeechMainService初始化完成');
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
    logger.info('[主进程] 开始注册IPC处理器');
    console.log('[主进程] 开始注册IPC处理器');
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

    // 发送音频数据 - 带调试日志的防崩溃保护
    ipcMain.handle('tencent-speech:send-audio', (event, audioData: Uint8Array | ArrayBuffer) => {
      console.log(`[主进程] 收到IPC音频数据请求, 类型: ${audioData ? audioData.constructor.name : 'null'}, 长度: ${audioData ? (audioData as any).length || (audioData as any).byteLength : 'null'}`);
      
      try {
        if (!audioData) {
          console.log(`[主进程] 音频数据为空，返回成功`);
          return { success: true };
        }
        
        // 将 Uint8Array 转换为 ArrayBuffer
        let arrayBuffer: ArrayBuffer;
        if (audioData instanceof Uint8Array) {
          console.log(`[主进程] 将Uint8Array转换为ArrayBuffer: ${audioData.length} 字节`);
          arrayBuffer = audioData.buffer.slice(audioData.byteOffset, audioData.byteOffset + audioData.byteLength);
        } else if (audioData instanceof ArrayBuffer) {
          console.log(`[主进程] 直接使用ArrayBuffer: ${audioData.byteLength} 字节`);
          arrayBuffer = audioData;
        } else {
          console.log(`[主进程] 未知数据类型: ${typeof audioData}`);
          return { success: false, error: '未知的音频数据类型' };
        }
        
        console.log(`[主进程] 准备处理音频数据: ${arrayBuffer.byteLength} 字节`);
        
        // 同步调用，但加强错误处理
        try {
          this.sendAudioData(arrayBuffer);
          console.log(`[主进程] 音频数据处理完成`);
          return { success: true };
        } catch (sendError) {
          console.log(`[主进程] sendAudioData出错:`, sendError);
          logger.error(`[主进程] sendAudioData失败:`, sendError);
          return { success: false, error: sendError instanceof Error ? sendError.message : '音频数据处理失败' };
        }
        
      } catch (error) {
        console.log(`[主进程] IPC处理出错:`, error);
        logger.error(`[主进程] IPC音频数据处理失败:`, error);
        return { 
          success: false, 
          error: error instanceof Error ? error.message : '音频数据处理失败'
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
          logger.debug('主窗口不存在或已销毁，跳过消息发送');
          return;
        }

        const webContents = this.mainWindow.webContents;
        if (!webContents || webContents.isDestroyed()) {
          logger.debug('webContents不存在或已销毁，跳过消息发送');
          return;
        }

        // 检查渲染进程是否准备就绪
        if (webContents.isLoading() || webContents.isCrashed()) {
          logger.debug('渲染进程未准备就绪，跳过消息发送');
          return;
        }

        // 使用更安全的方式发送消息
        try {
          // 优先使用 webContents.send 方法
          webContents.send(channel, data);
          logger.debug(`消息已发送到渲染进程: ${channel}`);
        } catch (sendError) {
          logger.warn(`使用send方法发送消息失败，尝试备用方案: ${sendError}`);
          
          // 备用方案：使用自定义事件
          try {
            webContents.executeJavaScript(`
              try {
                const event = new CustomEvent('${channel}', { detail: ${JSON.stringify(data)} });
                document.dispatchEvent(event);
              } catch (e) {
                console.warn('发送自定义事件失败:', e);
              }
            `).catch((execError) => {
              logger.warn(`executeJavaScript也失败: ${execError}`);
            });
          } catch (execError) {
            logger.warn(`备用方案也失败: ${execError}`);
          }
        }

      } catch (error) {
        logger.error('发送消息到渲染进程时出现未预期错误:', error);
      }
    });
    
    logger.info('[主进程] 所有IPC处理器注册完成');
    console.log('[主进程] 所有IPC处理器注册完成');
    
    // 验证IPC处理器是否确实注册了
    console.log('[主进程] 验证IPC处理器注册状态...');
    console.log('[主进程] tencent-speech:send-audio 处理器已注册:', typeof ipcMain.listeners('tencent-speech:send-audio'));
    
    // 添加一个测试IPC处理器
    ipcMain.handle('tencent-speech:test', () => {
      console.log('[主进程] 测试IPC处理器被调用');
      return { success: true, message: '测试成功' };
    });
  }

  /**
   * 开始语音识别
   */
  private async startListening(): Promise<void> {
    logger.info('[主进程] startListening被调用');
    if (!this.config) {
      logger.error('[主进程] 配置未初始化，抛出异常');
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
      // 清理之前的连接
      if (this.websocket) {
        this.websocket.removeAllListeners();
        if (this.websocket.readyState === WebSocket.OPEN || this.websocket.readyState === WebSocket.CONNECTING) {
          this.websocket.close();
        }
        this.websocket = null;
      }

      // 生成签名URL
      const url = this.generateSignedUrl();
      logger.info('创建WebSocket连接到腾讯云...');
      
      // 创建WebSocket连接 - 添加保护措施
      try {
        this.websocket = new WebSocket(url);
        logger.info('WebSocket实例创建成功');
      } catch (wsCreateError) {
        logger.error('WebSocket实例创建失败:', wsCreateError);
        throw new Error('无法创建WebSocket连接: ' + (wsCreateError instanceof Error ? wsCreateError.message : '未知错误'));
      }
      
      // 设置连接超时
      const connectionTimeout = setTimeout(() => {
        if (this.websocket && this.websocket.readyState === WebSocket.CONNECTING) {
          logger.error('WebSocket连接超时');
          this.websocket.close();
        }
      }, 15000); // 15秒超时
      
      // 设置WebSocket事件处理
      this.websocket.on('open', () => {
        clearTimeout(connectionTimeout);
        this.isConnected = true;
        logger.info('✅ 腾讯云WebSocket连接已建立');
        this.sendToRenderer('speech:connected', { voiceId: this.voiceId });
      });
      
      this.websocket.on('message', (data: Buffer) => {
        try {
          const response = JSON.parse(data.toString());
          logger.debug('收到WebSocket消息:', response);
          this.handleWebSocketMessage(response);
        } catch (error) {
          logger.error('解析WebSocket消息失败:', error);
          this.sendToRenderer('speech:error', {
            error: 'message_parse_error',
            message: '解析服务器响应失败'
          });
        }
      });
      
      this.websocket.on('error', (error: Error) => {
        clearTimeout(connectionTimeout);
        this.isConnected = false;
        logger.error('WebSocket连接错误:', error);
        
        let errorMessage = 'WebSocket连接错误';
        if (error.message.includes('ENOTFOUND')) {
          errorMessage = '无法连接到腾讯云服务器，请检查网络连接';
        } else if (error.message.includes('ECONNREFUSED')) {
          errorMessage = '腾讯云服务器拒绝连接，请稍后重试';
        } else if (error.message.includes('timeout')) {
          errorMessage = '连接腾讯云服务器超时，请检查网络状况';
        } else {
          errorMessage = `WebSocket连接错误: ${error.message}`;
        }
        
        this.sendToRenderer('speech:error', {
          error: 'websocket_error',
          message: errorMessage
        });
      });
      
      this.websocket.on('close', (code: number, reason: string) => {
        clearTimeout(connectionTimeout);
        this.isConnected = false;
        
        let closeMessage = `WebSocket连接已关闭 (${code})`;
        if (reason) {
          closeMessage += `: ${reason}`;
        }
        
        // 根据关闭代码提供更友好的信息
        if (code === 1000) {
          logger.info('WebSocket正常关闭');
        } else if (code === 1006) {
          logger.warn('WebSocket异常关闭，可能是网络问题');
          closeMessage = '网络连接异常断开，请检查网络状况';
        } else if (code >= 4000 && code < 5000) {
          logger.error(`腾讯云服务错误: ${code}`);
          closeMessage = `腾讯云服务错误 (${code})，请检查配置参数`;
        } else {
          logger.warn(closeMessage);
        }
        
        this.sendToRenderer('speech:ended', { message: closeMessage });
      });
      
      this.websocket.on('ping', () => {
        logger.debug('收到WebSocket ping');
      });
      
      this.websocket.on('pong', () => {
        logger.debug('收到WebSocket pong');
      });
      
      // 等待连接建立
      return new Promise((resolve, reject) => {
        if (!this.websocket) {
          reject(new Error('WebSocket实例创建失败'));
          return;
        }
        
        const timeout = setTimeout(() => {
          reject(new Error('WebSocket连接超时，请检查网络连接和配置参数'));
        }, 15000);
        
        this.websocket.once('open', () => {
          clearTimeout(timeout);
          resolve();
        });
        
        this.websocket.once('error', (error: Error) => {
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
      console.log(`[主进程] 关键参数验证:`);
      console.log(`- voice_format: ${this.config.voiceFormat} (1=PCM)`);
      console.log(`- engine_model_type: ${this.config.engineType}`);
      console.log(`- voice_id: ${this.voiceId}`);
      console.log(`- 参数总数: ${params.size}`);
      
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
   * 发送音频数据 - 带调试信息的防崩溃保护
   */
  private sendAudioData(audioData: ArrayBuffer): void {
    console.log(`[主进程] sendAudioData开始, 数据长度: ${audioData ? audioData.byteLength : 'null'}`);
    
    try {
      if (!audioData) {
        console.log(`[主进程] 音频数据为空，退出`);
        return;
      }

      // 按腾讯云要求控制发送频率（40ms间隔，保持1:1实时率）
      const now = Date.now();
      if (now - this.lastSendTime < 35) { // 稍微宽松一点，允许35ms间隔
        console.log(`[主进程] 发送过于频繁，跳过 (${now - this.lastSendTime}ms < 35ms)`);
        return;
      }
      this.lastSendTime = now;

      // 检查WebSocket连接状态
      if (!this.websocket) {
        console.log(`[主进程] WebSocket为null`);
        return;
      }
      
      if (this.websocket.readyState !== WebSocket.OPEN) {
        console.log(`[主进程] WebSocket状态不是OPEN: ${this.websocket.readyState}`);
        return;
      }

      if (!this.config) {
        console.log(`[主进程] 配置为空`);
        return;
      }

      // 验证音频数据基本要求
      if (audioData.byteLength === 0) {
        console.log(`[主进程] 音频数据长度为0`);
        return;
      }

      // 对于PCM格式，验证数据长度必须是偶数字节
      const expectedFormat = this.config.voiceFormat || 1;
      if (expectedFormat === 1 && audioData.byteLength % 2 !== 0) {
        console.log(`[主进程] PCM数据长度不是偶数: ${audioData.byteLength}`);
        return;
      }
      
      // 检查数据大小范围
      const MIN_CHUNK_SIZE = 320;
      if (audioData.byteLength < MIN_CHUNK_SIZE) {
        console.log(`[主进程] 数据过小: ${audioData.byteLength} < ${MIN_CHUNK_SIZE}`);
        return;
      }

      console.log(`[主进程] 准备发送到腾讯云: ${audioData.byteLength} 字节`);

      // 创建Buffer并发送
      const buffer = Buffer.from(audioData);
      console.log(`[主进程] Buffer创建成功: ${buffer.length} 字节`);
      
      // 直接发送，不使用异步
      try {
        this.websocket.send(buffer);
        console.log(`[主进程] ✅ WebSocket发送成功: ${buffer.length} 字节`);
        this.lastAudioTime = Date.now();
      } catch (sendError) {
        console.log(`[主进程] ❌ WebSocket发送失败:`, sendError);
        throw sendError; // 重新抛出错误以便上层处理
      }
      
    } catch (error) {
      console.log(`[主进程] sendAudioData出错:`, error);
      throw error; // 重新抛出错误
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
console.log('🚀 [主进程] 正在创建TencentSpeechMainService单例实例');
export const tencentSpeechMainService = new TencentSpeechMainService();
console.log('✅ [主进程] TencentSpeechMainService单例实例创建完成');