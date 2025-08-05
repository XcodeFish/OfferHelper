export interface GLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp?: number;
  audioSource?: 'voice' | 'text';
}

export interface GLMResponse {
  content: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  responseTime: number;
  sessionId: string;
}

export interface GLMSessionInfo {
  sessionId: string;
  scenario?: string;
  createdAt: number;
  messageCount: number;
}

export interface GLMConfigStatus {
  success: boolean;
  isConfigured: boolean;
  model?: string;
  baseUrl?: string;
  error?: string;
}

export interface InterviewScenario {
  key: string;
  name: string;
  topics: string[];
}

export class GLMService {
  private currentSessionId: string | null = null;

  /**
   * 获取GLM配置状态
   */
  public async getConfigStatus(): Promise<GLMConfigStatus> {
    try {
      const result = await window.electronAPI.invoke('glm:get-config-status');
      return result;
    } catch (error) {
      console.error('获取GLM配置状态失败:', error);
      return {
        success: false,
        isConfigured: false,
        error: error instanceof Error ? error.message : '未知错误',
      };
    }
  }

  /**
   * 创建新的对话会话
   */
  public async createSession(scenario: string = 'general'): Promise<string> {
    try {
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2)}`;
      const result = await window.electronAPI.invoke(
        'glm:create-session',
        sessionId,
        scenario
      );

      if (result.success) {
        this.currentSessionId = sessionId;
        console.log('GLM会话创建成功:', sessionId);
        return sessionId;
      } else {
        throw new Error(result.error || '创建会话失败');
      }
    } catch (error) {
      console.error('创建GLM会话失败:', error);
      throw error;
    }
  }

  /**
   * 发送消息并获取AI回复
   */
  public async sendMessage(
    sessionId: string,
    userInput: string,
    options?: {
      temperature?: number;
      maxTokens?: number;
      audioSource?: boolean;
    }
  ): Promise<GLMResponse> {
    try {
      if (!sessionId) {
        throw new Error('会话ID不能为空');
      }

      if (!userInput.trim()) {
        throw new Error('用户输入不能为空');
      }

      console.log('发送消息到GLM:', { sessionId, userInput, options });

      const result = await window.electronAPI.invoke(
        'glm:send-message',
        sessionId,
        userInput,
        options
      );

      if (result.success) {
        console.log('GLM回复成功:', result.response);
        return result.response;
      } else {
        throw new Error(result.error || '发送消息失败');
      }
    } catch (error) {
      console.error('发送GLM消息失败:', error);
      throw error;
    }
  }

  /**
   * 获取会话历史
   */
  public async getSessionHistory(sessionId: string): Promise<GLMMessage[]> {
    try {
      const result = await window.electronAPI.invoke(
        'glm:get-session-history',
        sessionId
      );

      if (result.success) {
        return result.history.messages;
      } else {
        throw new Error(result.error || '获取会话历史失败');
      }
    } catch (error) {
      console.error('获取GLM会话历史失败:', error);
      throw error;
    }
  }

  /**
   * 重置会话
   */
  public async resetSession(sessionId: string): Promise<void> {
    try {
      const result = await window.electronAPI.invoke(
        'glm:reset-session',
        sessionId
      );

      if (!result.success) {
        throw new Error(result.error || '重置会话失败');
      }

      console.log('GLM会话重置成功:', sessionId);
    } catch (error) {
      console.error('重置GLM会话失败:', error);
      throw error;
    }
  }

  /**
   * 删除会话
   */
  public async deleteSession(sessionId: string): Promise<void> {
    try {
      const result = await window.electronAPI.invoke(
        'glm:delete-session',
        sessionId
      );

      if (!result.success) {
        throw new Error(result.error || '删除会话失败');
      }

      if (this.currentSessionId === sessionId) {
        this.currentSessionId = null;
      }

      console.log('GLM会话删除成功:', sessionId);
    } catch (error) {
      console.error('删除GLM会话失败:', error);
      throw error;
    }
  }

  /**
   * 获取面试场景列表
   */
  public async getInterviewScenarios(): Promise<InterviewScenario[]> {
    try {
      const result = await window.electronAPI.invoke(
        'glm:get-interview-scenarios'
      );

      if (result.success) {
        return result.scenarios;
      } else {
        throw new Error(result.error || '获取面试场景失败');
      }
    } catch (error) {
      console.error('获取面试场景失败:', error);
      throw error;
    }
  }

  /**
   * 测试GLM连接
   */
  public async testConnection(): Promise<{
    success: boolean;
    message: string;
    responseTime?: number;
  }> {
    try {
      const result = await window.electronAPI.invoke('glm:test-connection');
      console.log('GLM result', result);

      return result;
    } catch (error) {
      console.error('GLM连接测试失败:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : '连接测试失败',
      };
    }
  }

  /**
   * 清理过期会话
   */
  public async cleanupSessions(): Promise<void> {
    try {
      const result = await window.electronAPI.invoke('glm:cleanup-sessions');

      if (!result.success) {
        throw new Error(result.error || '清理会话失败');
      }

      console.log('GLM会话清理完成');
    } catch (error) {
      console.error('清理GLM会话失败:', error);
      throw error;
    }
  }

  /**
   * 获取当前会话ID
   */
  public getCurrentSessionId(): string | null {
    return this.currentSessionId;
  }

  /**
   * 设置当前会话ID
   */
  public setCurrentSessionId(sessionId: string | null): void {
    this.currentSessionId = sessionId;
  }
}

// 创建全局GLM服务实例
export const glmService = new GLMService();
