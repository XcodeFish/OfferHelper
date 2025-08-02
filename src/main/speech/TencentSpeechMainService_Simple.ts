import { ipcMain, BrowserWindow } from 'electron';
import { logger } from '../../shared/utils/Logger';

/**
 * 简化版腾讯云语音识别主进程服务，用于调试
 */
export class TencentSpeechMainServiceSimple {
  private mainWindow: BrowserWindow | null = null;

  constructor() {
    logger.info('[主进程] TencentSpeechMainServiceSimple构造函数被调用');
    this.setupIpcHandlers();
    logger.info('[主进程] TencentSpeechMainServiceSimple初始化完成');
  }

  /**
   * 设置主窗口引用
   */
  public setMainWindow(window: BrowserWindow): void {
    this.mainWindow = window;
    logger.info('[主进程] 主窗口引用已设置');
  }

  /**
   * 设置IPC处理器
   */
  private setupIpcHandlers(): void {
    logger.info('[主进程] 开始注册IPC处理器');

    // 初始化腾讯云语音识别
    ipcMain.handle('tencent-speech:initialize', async (event, config: any) => {
      logger.info('[主进程] 收到initialize请求');
      return { success: true };
    });

    // 开始语音识别
    ipcMain.handle('tencent-speech:start', async () => {
      logger.info('[主进程] 收到start请求');
      return { success: true };
    });

    // 停止语音识别
    ipcMain.handle('tencent-speech:stop', () => {
      logger.info('[主进程] 收到stop请求');
      return { success: true };
    });

    // 发送音频数据 - 添加防崩溃保护
    ipcMain.handle('tencent-speech:send-audio', (event, audioData: ArrayBuffer) => {
      try {
        if (!audioData || audioData.byteLength === 0) {
          logger.debug('[主进程] 收到空音频数据，跳过');
          return { success: true };
        }
        
        // 限制日志输出频率，避免过多日志
        if (Math.random() < 0.1) { // 只有10%的概率输出日志
          logger.debug(`[主进程] 收到音频数据: ${audioData.byteLength} 字节`);
        }
        
        // 模拟处理但不实际处理音频数据
        return { success: true };
      } catch (error) {
        logger.error('[主进程] 音频数据处理异常:', error);
        return { success: false, error: '音频数据处理失败' };
      }
    });

    // 获取连接状态
    ipcMain.handle('tencent-speech:get-status', () => {
      return {
        isConnected: false,
        voiceId: 'test'
      };
    });

    logger.info('[主进程] 所有IPC处理器注册完成');
  }
}

// 导出单例实例
export const tencentSpeechMainServiceSimple = new TencentSpeechMainServiceSimple();