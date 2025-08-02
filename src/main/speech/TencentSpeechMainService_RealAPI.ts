import { ipcMain, BrowserWindow } from 'electron';
import { logger } from '../../shared/utils/Logger';
import * as crypto from 'crypto';
import * as https from 'https';

/**
 * 真实腾讯云语音识别主进程服务 - 使用HTTP API
 * 避免WebSocket的复杂性，使用一句话识别API
 */
export class TencentSpeechMainServiceRealAPI {
  private config: any = null;
  private isConnected: boolean = false;
  private mainWindow: BrowserWindow | null = null;
  private voiceId: string = '';
  private audioBuffer: Buffer[] = [];
  private processTimer: NodeJS.Timeout | null = null;

  constructor() {
    console.log('🎯 [主进程] 真实API语音服务构造函数执行');
    this.setupIpcHandlers();
    console.log('✅ [主进程] 真实API语音服务初始化完成');
  }

  /**
   * 设置主窗口引用
   */
  public setMainWindow(window: BrowserWindow): void {
    this.mainWindow = window;
    console.log('🪟 [主进程] 主窗口引用已设置');
  }

  /**
   * 设置IPC处理器
   */
  private setupIpcHandlers(): void {
    console.log('📡 [主进程] 开始注册IPC处理器');

    // 测试处理器
    ipcMain.handle('tencent-speech:test', () => {
      console.log('🧪 [主进程] 测试IPC处理器被调用');
      return { success: true, message: '真实API服务测试成功' };
    });

    // 初始化腾讯云语音识别
    ipcMain.handle('tencent-speech:initialize', async (event, config: any) => {
      console.log('🔧 [主进程] 收到初始化请求');
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
      console.log('▶️ [主进程] 收到启动请求');
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
      console.log('⏹️ [主进程] 收到停止请求');
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
    ipcMain.handle('tencent-speech:send-audio', (event, audioData: any) => {
      try {
        this.processAudioData(audioData);
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

    console.log('✅ [主进程] IPC处理器注册完成');
  }

  /**
   * 初始化腾讯云语音识别服务
   */
  public async initialize(config: any): Promise<void> {
    try {
      // 验证必要的配置参数
      if (!config.secretId || !config.secretKey || !config.appId) {
        throw new Error('腾讯云配置参数不完整');
      }

      this.config = config;
      console.log('⚙️ [主进程] 腾讯云语音识别配置已保存');
      logger.info('腾讯云语音识别主进程服务初始化成功');
    } catch (error) {
      logger.error('腾讯云语音识别初始化失败:', error);
      throw error;
    }
  }

  /**
   * 开始语音识别
   */
  private async startListening(): Promise<void> {
    console.log('🎤 [主进程] 开始语音识别');
    if (!this.config) {
      throw new Error('腾讯云语音识别未初始化');
    }

    if (this.isConnected) {
      console.log('⚠️ [主进程] 语音识别已在进行中');
      return;
    }

    try {
      // 生成语音ID
      this.voiceId = this.generateVoiceId();
      this.isConnected = true;
      this.audioBuffer = [];
      
      console.log(`🆔 [主进程] 语音识别已启动，ID: ${this.voiceId}`);
      
      // 启动定时器，每3秒处理一次积累的音频数据
      this.processTimer = setInterval(() => {
        this.processAccumulatedAudio();
      }, 3000);
      
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
    console.log('🛑 [主进程] 停止语音识别');
    
    if (!this.isConnected) return;

    try {
      // 清理定时器
      if (this.processTimer) {
        clearInterval(this.processTimer);
        this.processTimer = null;
      }

      // 处理最后的音频数据
      if (this.audioBuffer.length > 0) {
        this.processAccumulatedAudio();
      }

      this.isConnected = false;
      this.voiceId = '';
      this.audioBuffer = [];
      
      console.log('✅ [主进程] 语音识别已停止');
      
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
   * 处理音频数据 - 积累到缓冲区
   */
  private processAudioData(audioData: any): void {
    if (!this.isConnected || !audioData) return;

    try {
      // 将音频数据添加到缓冲区
      if (audioData instanceof ArrayBuffer) {
        this.audioBuffer.push(Buffer.from(audioData));
      } else if (audioData instanceof Uint8Array) {
        this.audioBuffer.push(Buffer.from(audioData));
      } else if (Buffer.isBuffer(audioData)) {
        this.audioBuffer.push(audioData);
      }

      // 限制缓冲区大小（最多保存10秒的音频数据）
      const maxBufferSize = 16000 * 2 * 10; // 16kHz * 2字节 * 10秒
      let totalSize = this.audioBuffer.reduce((sum, buf) => sum + buf.length, 0);
      
      while (totalSize > maxBufferSize && this.audioBuffer.length > 1) {
        const removed = this.audioBuffer.shift();
        if (removed) {
          totalSize -= removed.length;
        }
      }
    } catch (error) {
      logger.error('处理音频数据失败:', error);
    }
  }

  /**
   * 处理积累的音频数据 - 调用腾讯云API
   */
  private async processAccumulatedAudio(): Promise<void> {
    if (this.audioBuffer.length === 0) return;

    try {
      // 合并音频缓冲区
      const audioData = Buffer.concat(this.audioBuffer);
      this.audioBuffer = []; // 清空缓冲区

      console.log(`🎵 [主进程] 处理音频数据: ${audioData.length} 字节`);

      // 调用腾讯云一句话识别API
      const result = await this.callTencentASR(audioData);
      
      if (result && result.transcript) {
        console.log(`🎯 [主进程] 识别结果: ${result.transcript}`);
        
        this.sendToRenderer('speech:result', {
          transcript: result.transcript,
          confidence: result.confidence || 0.9,
          isFinal: true,
          timestamp: Date.now()
        });
      }
    } catch (error) {
      logger.error('处理积累音频数据失败:', error);
      this.sendToRenderer('speech:error', {
        error: 'recognition_failed',
        message: error instanceof Error ? error.message : '识别失败'
      });
    }
  }

  /**
   * 调用腾讯云一句话识别API
   */
  private async callTencentASR(audioData: Buffer): Promise<any> {
    const host = 'asr.tencentcloudapi.com';
    const service = 'asr';
    const version = '2019-06-14';
    const action = 'SentenceRecognition';
    const region = this.config.region || 'ap-beijing';

    // 准备请求参数
    const params = {
      ProjectId: 0,
      SubServiceType: 2,
      EngSerViceType: '16k_zh',
      SourceType: 1,
      VoiceFormat: 'wav',
      UsrAudioKey: this.voiceId,
      Data: audioData.toString('base64')
    };

    // 生成签名
    const timestamp = Math.floor(Date.now() / 1000);
    const authorization = this.generateSignature(host, params, timestamp, action, version, region, service);

    return new Promise((resolve, reject) => {
      const postData = JSON.stringify(params);
      
      const options = {
        hostname: host,
        port: 443,
        path: '/',
        method: 'POST',
        headers: {
          'Authorization': authorization,
          'Content-Type': 'application/json; charset=utf-8',
          'Content-Length': Buffer.byteLength(postData),
          'Host': host,
          'X-TC-Action': action,
          'X-TC-Timestamp': timestamp.toString(),
          'X-TC-Version': version,
          'X-TC-Region': region
        }
      };

      const req = https.request(options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          try {
            const response = JSON.parse(data);
            
            if (response.Response.Error) {
              reject(new Error(`腾讯云API错误: ${response.Response.Error.Message}`));
              return;
            }
            
            const result = response.Response.Result;
            if (result && result.length > 0) {
              resolve({
                transcript: result,
                confidence: 0.9 // 腾讯云一句话识别没有返回置信度
              });
            } else {
              resolve(null);
            }
          } catch (error) {
            reject(new Error(`解析响应失败: ${error}`));
          }
        });
      });

      req.on('error', (error) => {
        reject(new Error(`请求失败: ${error.message}`));
      });

      req.write(postData);
      req.end();
    });
  }

  /**
   * 生成腾讯云API签名
   */
  private generateSignature(host: string, params: any, timestamp: number, action: string, version: string, region: string, service: string): string {
    const secretId = this.config.secretId;
    const secretKey = this.config.secretKey;

    // 步骤1：拼接规范请求串
    const httpRequestMethod = 'POST';
    const canonicalUri = '/';
    const canonicalQueryString = '';
    const canonicalHeaders = `content-type:application/json; charset=utf-8\nhost:${host}\n`;
    const signedHeaders = 'content-type;host';
    const payload = JSON.stringify(params);
    const hashedRequestPayload = crypto.createHash('sha256').update(payload).digest('hex');
    
    const canonicalRequest = `${httpRequestMethod}\n${canonicalUri}\n${canonicalQueryString}\n${canonicalHeaders}\n${signedHeaders}\n${hashedRequestPayload}`;

    // 步骤2：拼接待签名字符串
    const algorithm = 'TC3-HMAC-SHA256';
    const date = new Date(timestamp * 1000).toISOString().split('T')[0];
    const credentialScope = `${date}/${service}/tc3_request`;
    const hashedCanonicalRequest = crypto.createHash('sha256').update(canonicalRequest).digest('hex');
    
    const stringToSign = `${algorithm}\n${timestamp}\n${credentialScope}\n${hashedCanonicalRequest}`;

    // 步骤3：计算签名
    const secretDate = crypto.createHmac('sha256', `TC3${secretKey}`).update(date).digest();
    const secretService = crypto.createHmac('sha256', secretDate).update(service).digest();
    const secretSigning = crypto.createHmac('sha256', secretService).update('tc3_request').digest();
    const signature = crypto.createHmac('sha256', secretSigning).update(stringToSign).digest('hex');

    // 步骤4：拼接Authorization
    return `${algorithm} Credential=${secretId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
  }

  /**
   * 生成语音ID
   */
  private generateVoiceId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `voice_${timestamp}_${random}`;
  }

  /**
   * 发送消息到渲染进程
   */
  private sendToRenderer(channel: string, data: any): void {
    try {
      if (!this.mainWindow || this.mainWindow.isDestroyed()) {
        return;
      }

      const webContents = this.mainWindow.webContents;
      if (!webContents || webContents.isDestroyed()) {
        return;
      }

      if (webContents.isLoading() || webContents.isCrashed()) {
        return;
      }

      console.log(`📤 [主进程] 发送IPC事件: ${channel}`, JSON.stringify(data, null, 2));
      webContents.send(channel, data);
    } catch (error) {
      logger.error('发送消息到渲染进程失败:', error);
    }
  }
}

// 导出单例实例
console.log('🚀 [主进程] 正在创建真实API语音服务单例');
export const tencentSpeechMainServiceRealAPI = new TencentSpeechMainServiceRealAPI();
console.log('🎉 [主进程] 真实API语音服务单例创建完成');