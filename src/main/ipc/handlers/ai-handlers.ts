import { IpcMainInvokeEvent } from 'electron';
import { AIService } from '../../services/ai-service';

const aiService = new AIService();

export const aiHandlers = {
  'ai:chat': async (
    event: IpcMainInvokeEvent,
    message: string,
    context?: any
  ) => {
    try {
      return await aiService.chat(message, context);
    } catch (error) {
      console.error('AI聊天失败:', error);
      throw error;
    }
  },

  'ai:generate-response': async (
    event: IpcMainInvokeEvent,
    prompt: string,
    options?: any
  ) => {
    try {
      return await aiService.generateResponse(prompt, options);
    } catch (error) {
      console.error('AI生成回复失败:', error);
      throw error;
    }
  },

  'ai:get-models': async (event: IpcMainInvokeEvent) => {
    try {
      return await aiService.getAvailableModels();
    } catch (error) {
      console.error('获取AI模型列表失败:', error);
      throw error;
    }
  },
};
