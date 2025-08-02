import { ipcMain, BrowserWindow } from 'electron';
import { logger } from '../../shared/utils/Logger';

/**
 * 修复版腾讯云语音识别主进程服务
 * 移除了导致模块加载失败的复杂依赖
 */
export class TencentSpeechMainServiceFixed {
  private config: any = null;
  private isConnected: boolean = false;
  private mainWindow: BrowserWindow | null = null;
  private voiceId: string = '';

  constructor() {
    console.log('🎯 [主进程] 修复版语音服务构造函数执行');
    this.setupIpcHandlers();
    console.log('✅ [主进程] 修复版语音服务初始化完成');
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
      return { success: true, message: '修复版服务测试成功' };
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
        const dataSize = audioData ? (audioData.length || audioData.byteLength || 'unknown') : 'null';
        
        // 限制日志输出频率，避免过多音频数据日志
        if (Math.random() < 0.01) { // 1%概率输出日志
          console.log(`🎵 [主进程] 收到音频数据: ${dataSize}`);
        }
        
        // 模拟处理音频数据（避免实际的WebSocket连接）
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
      
      console.log(`🆔 [主进程] 语音识别已启动，ID: ${this.voiceId}`);
      
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
      this.isConnected = false;
      this.voiceId = '';
      
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
   * 处理音频数据（模拟版本）
   */
  private processAudioData(audioData: any): void {
    if (!this.isConnected || !audioData) return;

    try {
      // 模拟语音识别处理
      // 这里可以实现实际的腾讯云API调用，但使用HTTP请求而非WebSocket
      
      // 模拟识别结果（用于测试）
      if (Math.random() < 0.03) { // 3%概率模拟识别结果
        const mockResults = [
          '你好，我是语音识别测试',
          '这是腾讯云语音识别服务',
          '语音识别功能正常工作',
          '测试语音转文字功能',
          '实时语音识别测试成功',
          '我能听到你的声音',
          '语音识别准确率很高',
          '这是一个面试辅助工具'
        ];
        const randomResult = mockResults[Math.floor(Math.random() * mockResults.length)];
        
        console.log(`🎯 [主进程] 模拟识别结果: ${randomResult}`);
        
        this.sendToRenderer('speech:result', {
          transcript: randomResult,
          confidence: Math.random() * 0.3 + 0.7, // 0.7-1.0 的置信度
          isFinal: true,
          timestamp: Date.now()
        });
      }
    } catch (error) {
      logger.error('处理音频数据失败:', error);
    }
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
console.log('🚀 [主进程] 正在创建修复版语音服务单例');
console.error('🚀 [主进程-ERROR] 正在创建修复版语音服务单例'); // 强制输出
process.stdout.write('🚀 [主进程-STDOUT] 正在创建修复版语音服务单例\n');

export const tencentSpeechMainServiceFixed = new TencentSpeechMainServiceFixed();

console.log('🎉 [主进程] 修复版语音服务单例创建完成');
console.error('🎉 [主进程-ERROR] 修复版语音服务单例创建完成'); // 强制输出
process.stdout.write('🎉 [主进程-STDOUT] 修复版语音服务单例创建完成\n');