import { IpcMainInvokeEvent } from 'electron';
import { VoiceService } from '../../services/voice-service';

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
};
