import { IpcMainInvokeEvent } from 'electron';
import { GLMService, GLMConfig, GLMRequest } from '../../services/glm-service';
import { ConversationManager } from '../../services/conversation-manager';

// 从环境变量获取GLM配置
const getGLMConfig = (): GLMConfig => {
  const apiKey = process.env.AI_API_KEY;
  const baseUrl =
    process.env.AI_API_BASE_URL || 'https://open.bigmodel.cn/api/paas/v4';
  const model = process.env.AI_MODEL || 'glm-4.5-AirX';

  if (!apiKey) {
    throw new Error('AI_API_KEY environment variable is required');
  }

  return { apiKey, baseUrl, model };
};

// 创建GLM服务实例
let glmService: GLMService | null = null;
const conversationManager = new ConversationManager();

const initializeGLMService = () => {
  if (!glmService) {
    const config = getGLMConfig();
    glmService = new GLMService(config);
  }
  return glmService;
};

export const glmHandlers = {
  // 获取GLM配置状态
  'glm:get-config-status': async (event: IpcMainInvokeEvent) => {
    try {
      const config = getGLMConfig();
      return {
        success: true,
        isConfigured: !!config.apiKey,
        model: config.model,
        baseUrl: config.baseUrl,
      };
    } catch (error) {
      return {
        success: false,
        isConfigured: false,
        error: error instanceof Error ? error.message : '配置获取失败',
      };
    }
  },

  // 创建对话会话
  'glm:create-session': async (
    event: IpcMainInvokeEvent,
    sessionId: string,
    scenario: string = 'general'
  ) => {
    try {
      const session = conversationManager.createSession(sessionId, scenario);
      return {
        success: true,
        session: {
          sessionId: session.sessionId,
          scenario,
          createdAt: session.createdAt,
          messageCount: session.messages.length,
        },
      };
    } catch (error) {
      console.error('创建会话失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '创建会话失败',
      };
    }
  },

  // 发送消息并获取AI回复
  'glm:send-message': async (
    event: IpcMainInvokeEvent,
    sessionId: string,
    userInput: string,
    options?: {
      temperature?: number;
      maxTokens?: number;
      audioSource?: boolean;
    }
  ) => {
    try {
      const service = initializeGLMService();

      // 添加用户消息到会话
      const session = conversationManager.addMessage(sessionId, {
        role: 'user',
        content: userInput,
        audioSource: options?.audioSource ? 'voice' : 'text',
      });

      if (!session) {
        throw new Error('会话不存在，请先创建会话');
      }

      // 获取上下文消息
      const contextMessages = conversationManager.getContextMessages(sessionId);

      // 调用GLM API
      const request: GLMRequest = {
        sessionId,
        userInput,
        context: contextMessages,
        options: {
          stream: false,
          temperature: options?.temperature || 0.3,
          maxTokens: options?.maxTokens || 500,
        },
      };

      const response = await service.callGLM(request);

      // 添加AI回复到会话
      conversationManager.addMessage(sessionId, {
        role: 'assistant',
        content: response.content,
      });

      return {
        success: true,
        response: {
          content: response.content,
          usage: response.usage,
          responseTime: response.responseTime,
          sessionId,
        },
      };
    } catch (error) {
      console.error('发送消息失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '发送消息失败',
      };
    }
  },

  // 获取会话历史
  'glm:get-session-history': async (
    event: IpcMainInvokeEvent,
    sessionId: string
  ) => {
    try {
      const session = conversationManager.getSession(sessionId);
      if (!session) {
        return {
          success: false,
          error: '会话不存在',
        };
      }

      // 过滤掉系统消息，只返回用户和助手的对话
      const messages = session.messages
        .filter(msg => msg.role !== 'system')
        .map(msg => ({
          role: msg.role,
          content: msg.content,
          timestamp: msg.timestamp,
          audioSource: msg.audioSource,
        }));

      return {
        success: true,
        history: {
          sessionId: session.sessionId,
          messages,
          createdAt: session.createdAt,
          lastActiveAt: session.lastActiveAt,
        },
      };
    } catch (error) {
      console.error('获取会话历史失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '获取会话历史失败',
      };
    }
  },

  // 重置会话
  'glm:reset-session': async (event: IpcMainInvokeEvent, sessionId: string) => {
    try {
      const session = conversationManager.resetSession(sessionId);
      if (!session) {
        return {
          success: false,
          error: '会话不存在',
        };
      }

      return {
        success: true,
        session: {
          sessionId: session.sessionId,
          messageCount: session.messages.length,
          lastActiveAt: session.lastActiveAt,
        },
      };
    } catch (error) {
      console.error('重置会话失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '重置会话失败',
      };
    }
  },

  // 删除会话
  'glm:delete-session': async (
    event: IpcMainInvokeEvent,
    sessionId: string
  ) => {
    try {
      const deleted = conversationManager.deleteSession(sessionId);
      return {
        success: deleted,
        message: deleted ? '会话已删除' : '会话不存在',
      };
    } catch (error) {
      console.error('删除会话失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '删除会话失败',
      };
    }
  },

  // 获取面试场景列表
  'glm:get-interview-scenarios': async (event: IpcMainInvokeEvent) => {
    try {
      const scenarios = conversationManager.getInterviewScenarios();
      return {
        success: true,
        scenarios: Object.entries(scenarios).map(([key, scenario]) => ({
          key,
          name: scenario.name,
          topics: scenario.topics,
        })),
      };
    } catch (error) {
      console.error('获取面试场景失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '获取面试场景失败',
      };
    }
  },

  // 清理过期会话
  'glm:cleanup-sessions': async (event: IpcMainInvokeEvent) => {
    try {
      conversationManager.cleanupExpiredSessions();
      return {
        success: true,
        message: '过期会话清理完成',
      };
    } catch (error) {
      console.error('清理会话失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '清理会话失败',
      };
    }
  },

  // 测试GLM连接
  'glm:test-connection': async (event: IpcMainInvokeEvent) => {
    try {
      console.log('IPC处理器: 开始GLM连接测试...');
      const service = initializeGLMService();
      console.log('IPC处理器: GLM服务初始化完成');

      // 直接调用GLM服务的testConnection方法
      const result = await service.testConnection();
      console.log('IPC处理器: GLM连接测试结果:', result);

      return {
        success: result.success,
        message: result.message,
        model: result.model,
      };
    } catch (error) {
      console.error('IPC处理器: GLM连接测试失败:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'GLM连接测试失败',
      };
    }
  },
};
