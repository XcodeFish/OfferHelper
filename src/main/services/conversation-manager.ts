import { GLMMessage } from './glm-service';

export interface ConversationSession {
  sessionId: string;
  messages: GLMMessage[];
  createdAt: number;
  lastActiveAt: number;
  contextWindow: number;
  maxMessages: number;
}

export interface InterviewScenario {
  name: string;
  systemPrompt: string;
  topics: string[];
}

export class ConversationManager {
  private sessions: Map<string, ConversationSession> = new Map();
  private readonly DEFAULT_CONTEXT_WINDOW = 4000;
  private readonly DEFAULT_MAX_MESSAGES = 20;

  // 面试场景预设
  private readonly INTERVIEW_SCENARIOS: Record<string, InterviewScenario> = {
    frontend: {
      name: '前端开发面试',
      systemPrompt: `你是一位资深的前端技术面试官，专门负责前端开发工程师的技术面试。你需要：
1. 根据候选人的回答进行有针对性的追问
2. 评估前端技术能力并给出建设性建议
3. 保持专业且友好的交流方式
4. 适时提供前端技术指导和最佳实践建议
5. 重点关注JavaScript、React/Vue、CSS、性能优化等前端核心技术

请用专业但不失亲和力的语气进行面试，帮助候选人展现最佳状态。`,
      topics: ['JavaScript', 'React', 'Vue', 'CSS', '性能优化', 'Webpack', 'TypeScript']
    },
    backend: {
      name: '后端开发面试',
      systemPrompt: `你是一位资深的后端技术面试官，专门负责后端开发工程师的技术面试。你需要：
1. 根据候选人的回答进行有针对性的追问
2. 评估后端技术能力并给出建设性建议
3. 保持专业且友好的交流方式
4. 适时提供后端技术指导和最佳实践建议
5. 重点关注Java/Python/Go、数据库、微服务、系统设计等后端核心技术

请用专业但不失亲和力的语气进行面试，帮助候选人展现最佳状态。`,
      topics: ['Java', 'Spring', 'Python', '数据库', '微服务', '系统设计', 'Redis', 'MQ']
    },
    algorithm: {
      name: '算法面试',
      systemPrompt: `你是一位资深的算法面试官，专门负责程序员的算法和数据结构面试。你需要：
1. 根据候选人的回答进行有针对性的追问
2. 评估算法思维和编程能力
3. 保持专业且友好的交流方式
4. 适时提供算法思路指导和优化建议
5. 重点关注数据结构、算法设计、复杂度分析、编程实现等

请用专业但不失亲和力的语气进行面试，帮助候选人展现最佳状态。`,
      topics: ['数据结构', '算法', '动态规划', '图论', '复杂度分析', '排序', '搜索']
    },
    general: {
      name: '综合技术面试',
      systemPrompt: `你是一位资深的技术面试官，专门负责程序员的综合技术面试。你需要：
1. 根据候选人的回答进行有针对性的追问
2. 评估综合技术能力并给出建设性建议
3. 保持专业且友好的交流方式
4. 适时提供技术指导和最佳实践建议
5. 涵盖编程基础、系统设计、项目经验、技术选型等多个方面

请用专业但不失亲和力的语气进行面试，帮助候选人展现最佳状态。`,
      topics: ['编程基础', '系统设计', '项目经验', '技术选型', '团队协作', '问题解决']
    }
  };

  /**
   * 创建新的对话会话
   */
  public createSession(
    sessionId: string,
    scenario: string = 'general',
    contextWindow: number = this.DEFAULT_CONTEXT_WINDOW,
    maxMessages: number = this.DEFAULT_MAX_MESSAGES
  ): ConversationSession {
    const interviewScenario = this.INTERVIEW_SCENARIOS[scenario] || this.INTERVIEW_SCENARIOS.general;
    
    const session: ConversationSession = {
      sessionId,
      messages: [
        {
          role: 'system',
          content: interviewScenario.systemPrompt,
          timestamp: Date.now(),
        }
      ],
      createdAt: Date.now(),
      lastActiveAt: Date.now(),
      contextWindow,
      maxMessages,
    };

    this.sessions.set(sessionId, session);
    return session;
  }

  /**
   * 获取对话会话
   */
  public getSession(sessionId: string): ConversationSession | null {
    return this.sessions.get(sessionId) || null;
  }

  /**
   * 添加消息到会话
   */
  public addMessage(sessionId: string, message: Omit<GLMMessage, 'timestamp'>): ConversationSession | null {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return null;
    }

    const messageWithTimestamp: GLMMessage = {
      ...message,
      timestamp: Date.now(),
    };

    session.messages.push(messageWithTimestamp);
    session.lastActiveAt = Date.now();

    // 限制消息数量
    if (session.messages.length > session.maxMessages) {
      // 保留系统消息和最近的消息
      const systemMessages = session.messages.filter(msg => msg.role === 'system');
      const recentMessages = session.messages
        .filter(msg => msg.role !== 'system')
        .slice(-(session.maxMessages - systemMessages.length));
      
      session.messages = [...systemMessages, ...recentMessages];
    }

    this.sessions.set(sessionId, session);
    return session;
  }

  /**
   * 获取会话的上下文消息（用于API调用）
   */
  public getContextMessages(sessionId: string): GLMMessage[] {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return [];
    }

    // 计算上下文窗口内的消息
    let totalTokens = 0;
    const contextMessages: GLMMessage[] = [];

    // 从最新消息开始倒序添加
    for (let i = session.messages.length - 1; i >= 0; i--) {
      const message = session.messages[i];
      const estimatedTokens = this.estimateTokens(message.content);
      
      if (totalTokens + estimatedTokens > session.contextWindow && contextMessages.length > 0) {
        break;
      }

      contextMessages.unshift(message);
      totalTokens += estimatedTokens;
    }

    // 确保系统消息始终包含在内
    const systemMessage = session.messages.find(msg => msg.role === 'system');
    if (systemMessage && !contextMessages.some(msg => msg.role === 'system')) {
      contextMessages.unshift(systemMessage);
    }

    return contextMessages;
  }

  /**
   * 估算文本的token数量（简单估算）
   */
  private estimateTokens(text: string): number {
    // 简单估算：中文字符按1.5个token计算，英文单词按1个token计算
    const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
    const englishWords = (text.match(/[a-zA-Z]+/g) || []).length;
    const otherChars = text.length - chineseChars - englishWords;
    
    return Math.ceil(chineseChars * 1.5 + englishWords + otherChars * 0.5);
  }

  /**
   * 清理过期会话
   */
  public cleanupExpiredSessions(maxAge: number = 24 * 60 * 60 * 1000): void {
    const now = Date.now();
    const expiredSessions: string[] = [];

    for (const [sessionId, session] of this.sessions) {
      if (now - session.lastActiveAt > maxAge) {
        expiredSessions.push(sessionId);
      }
    }

    expiredSessions.forEach(sessionId => {
      this.sessions.delete(sessionId);
    });

    if (expiredSessions.length > 0) {
      console.log(`清理了 ${expiredSessions.length} 个过期会话`);
    }
  }

  /**
   * 删除会话
   */
  public deleteSession(sessionId: string): boolean {
    return this.sessions.delete(sessionId);
  }

  /**
   * 获取所有会话ID
   */
  public getAllSessionIds(): string[] {
    return Array.from(this.sessions.keys());
  }

  /**
   * 获取面试场景列表
   */
  public getInterviewScenarios(): Record<string, InterviewScenario> {
    return { ...this.INTERVIEW_SCENARIOS };
  }

  /**
   * 重置会话（保留系统消息）
   */
  public resetSession(sessionId: string): ConversationSession | null {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return null;
    }

    const systemMessages = session.messages.filter(msg => msg.role === 'system');
    session.messages = systemMessages;
    session.lastActiveAt = Date.now();

    this.sessions.set(sessionId, session);
    return session;
  }
}