import { ipcMain } from 'electron';

/**
 * 最小化腾讯云语音识别主进程服务 - 用于诊断导入问题
 */
export class TencentSpeechMainServiceMinimal {
  constructor() {
    console.log('🎯 [主进程] 最小化语音服务构造函数执行');
    this.setupBasicIpcHandlers();
    console.log('✅ [主进程] 最小化语音服务初始化完成');
  }

  private setupBasicIpcHandlers(): void {
    console.log('📡 [主进程] 开始注册基础IPC处理器');

    // 测试处理器
    ipcMain.handle('tencent-speech:test', () => {
      console.log('🧪 [主进程] 测试IPC处理器被调用');
      return { success: true, message: '最小化服务测试成功' };
    });

    // 初始化处理器
    ipcMain.handle('tencent-speech:initialize', async (event, config: any) => {
      console.log('🔧 [主进程] 收到初始化请求');
      return { success: true };
    });

    // 启动处理器
    ipcMain.handle('tencent-speech:start', async () => {
      console.log('▶️ [主进程] 收到启动请求');
      return { success: true };
    });

    // 停止处理器
    ipcMain.handle('tencent-speech:stop', () => {
      console.log('⏹️ [主进程] 收到停止请求');
      return { success: true };
    });

    // 发送音频数据处理器
    ipcMain.handle('tencent-speech:send-audio', (event, audioData: any) => {
      console.log(`🎵 [主进程] 收到音频数据: ${audioData ? (audioData.length || audioData.byteLength || 'unknown size') : 'null'}`);
      return { success: true };
    });

    // 获取状态处理器
    ipcMain.handle('tencent-speech:get-status', () => {
      return {
        isConnected: false,
        voiceId: 'minimal-test'
      };
    });

    console.log('✅ [主进程] 基础IPC处理器注册完成');
  }

  public setMainWindow(window: any): void {
    console.log('🪟 [主进程] 主窗口引用已设置');
  }
}

// 导出单例实例
console.log('🚀 [主进程] 正在创建最小化语音服务单例');
export const tencentSpeechMainServiceMinimal = new TencentSpeechMainServiceMinimal();
console.log('🎉 [主进程] 最小化语音服务单例创建完成');