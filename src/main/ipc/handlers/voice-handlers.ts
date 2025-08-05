import { IpcMainInvokeEvent } from 'electron';
import { VoiceService } from '../../services/voice-service';
import { TencentConfigService } from '../../services/tencent-config-service';

const voiceService = new VoiceService();

export const voiceHandlers = {
  'voice:start-recording': async (event: IpcMainInvokeEvent) => {
    try {
      return await voiceService.startRecording();
    } catch (error) {
      console.error('开始录音失败:', error);
      throw error;
    }
  },

  'voice:stop-recording': async (event: IpcMainInvokeEvent) => {
    try {
      return await voiceService.stopRecording();
    } catch (error) {
      console.error('停止录音失败:', error);
      throw error;
    }
  },

  'voice:get-recording-status': async (event: IpcMainInvokeEvent) => {
    try {
      return voiceService.getRecordingStatus();
    } catch (error) {
      console.error('获取录音状态失败:', error);
      throw error;
    }
  },

  'voice:transcribe': async (event: IpcMainInvokeEvent, audioData: Buffer) => {
    try {
      return await voiceService.transcribeAudio(audioData);
    } catch (error) {
      console.error('语音转文字失败:', error);
      throw error;
    }
  },

  // 腾讯云配置相关处理器
  'tencent:get-config': async (event: IpcMainInvokeEvent) => {
    try {
      return TencentConfigService.getTencentConfig();
    } catch (error) {
      console.error('获取腾讯云配置失败:', error);
      throw error;
    }
  },

  'tencent:get-config-status': async (event: IpcMainInvokeEvent) => {
    try {
      return TencentConfigService.getConfigStatus();
    } catch (error) {
      console.error('获取腾讯云配置状态失败:', error);
      throw error;
    }
  },
};
