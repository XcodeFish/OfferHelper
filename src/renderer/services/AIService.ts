import { EventBus } from '@/shared/utils/EventBus';
import { logger } from '@/shared/utils/Logger';
import type { AIResponse, AIConfig } from '@/shared/types/ai';

/**
 * AI分析引擎
 */
export class AIAnalysisEngine {
  private config: AIConfig;
  private isAnalyzing: boolean = false;

  constructor() {
    this.config = {
      provider: 'openai',
      model: 'gpt-3.5-turbo',
      apiKey: process.env.OPENAI_API_KEY || '',
      baseURL: 'https://api.openai.com/v1',
      temperature: 0.7,
      maxTokens: 500
    };
  }

  public async analyzeQuestion(question: string): Promise<AIResponse> {
    if (this.isAnalyzing) {
      throw new Error('AI分析正在进行中，请稍后再试');
    }

    this.isAnalyzing = true;
    EventBus.emit('ai-analysis-started', question);

    try {
      logger.info('开始AI分析:', question);
      
      // 优先使用云端API
      if (this.config.apiKey) {
        const response = await this.analyzeWithCloudAPI(question);
        EventBus.emit('ai-analysis-completed', response);
        return response;
      }

      // 备用本地分析
      const response = await this.analyzeWithLocalLogic(question);
      EventBus.emit('ai-analysis-completed', response);
      return response;

    } catch (error) {
      logger.error('AI分析失败:', error);
      EventBus.emit('ai-analysis-failed', error);
      
      // 返回备用响应
      return this.getFallbackResponse(question);
    } finally {
      this.isAnalyzing = false;
    }
  }

  private async analyzeWithCloudAPI(question: string): Promise<AIResponse> {
    const response = await fetch(`${this.config.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: this.config.model,
        messages: [
          {
            role: 'system',
            content: '你是一个专业的面试助手，请为以下面试问题提供简洁、专业的回答建议。回答应该结构清晰，重点突出，适合在面试中使用。'
          },
          {
            role: 'user',
            content: question
          }
        ],
        max_tokens: this.config.maxTokens,
        temperature: this.config.temperature
      })
    });

    if (!response.ok) {
      throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const answer = data.choices[0].message.content;

    return {
      answer,
      confidence: 0.9,
      keywords: this.extractKeywords(question),
      category: this.categorizeQuestion(question),
      suggestions: this.generateSuggestions(answer),
      timestamp: Date.now()
    };
  }

  private async analyzeWithLocalLogic(question: string): Promise<AIResponse> {
    // 简单的本地分析逻辑
    const knowledgeBase = this.getKnowledgeBase();
    const matchedAnswer = knowledgeBase.find(item =>
      question.toLowerCase().includes(item.keyword.toLowerCase())
    );

    return {
      answer: matchedAnswer?.answer || '这是一个很好的问题。我认为可以从以下几个方面来回答...',
      confidence: 0.7,
      keywords: this.extractKeywords(question),
      category: this.categorizeQuestion(question),
      suggestions: [
        '结合具体项目经验来回答',
        '突出你的技术能力和解决问题的思路',
        '保持回答简洁明了，重点突出'
      ],
      timestamp: Date.now()
    };
  }

  private getFallbackResponse(question: string): AIResponse {
    return {
      answer: '抱歉，暂时无法分析此问题。建议您结合自己的经验和项目背景来回答。',
      confidence: 0.5,
      keywords: this.extractKeywords(question),
      category: 'unknown',
      suggestions: [
        '保持冷静，仔细思考问题',
        '结合自己的实际经验回答',
        '如果不确定，可以诚实地表达并展示学习意愿'
      ],
      timestamp: Date.now()
    };
  }

  private extractKeywords(text: string): string[] {
    // 简单的关键词提取逻辑
    const commonWords = ['的', '是', '在', '有', '和', '了', '我', '你', '他', '她', '它', '我们', '你们', '他们'];
    const words = text
      .toLowerCase()
      .replace(/[^\u4e00-\u9fa5a-zA-Z0-9\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 1 && !commonWords.includes(word))
      .slice(0, 5);

    return words;
  }

  private categorizeQuestion(question: string): string {
    const categories = {
      'technical': ['算法', '数据结构', '编程', '代码', '技术', '开发', '系统'],
      'behavioral': ['经验', '团队', '项目', '挑战', '解决', '合作', '领导'],
      'system': ['系统', '架构', '设计', '扩展', '性能', '优化', '部署'],
      'frontend': ['前端', 'React', 'Vue', 'JavaScript', 'CSS', 'HTML', '界面'],
      'backend': ['后端', 'Node.js', 'Python', 'Java', '数据库', 'API', '服务器']
    };

    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => question.includes(keyword))) {
        return category;
      }
    }

    return 'general';
  }

  private generateSuggestions(answer: string): string[] {
    const suggestions = [
      '可以结合具体项目经验来回答',
      '注意突出你的技术能力',
      '保持回答简洁明了',
      '展示你的学习能力和成长经历',
      '适当提及相关的技术栈和工具'
    ];

    // 根据答案长度和内容调整建议
    if (answer.length > 200) {
      suggestions.unshift('回答可以更加简洁一些');
    }

    return suggestions.slice(0, 3);
  }

  private getKnowledgeBase(): Array<{keyword: string, answer: string}> {
    return [
      {
        keyword: 'JavaScript',
        answer: 'JavaScript是一种动态类型的编程语言，主要用于Web开发。它具有灵活的语法、事件驱动的特性，支持面向对象和函数式编程范式。'
      },
      {
        keyword: 'React',
        answer: 'React是Facebook开发的用于构建用户界面的JavaScript库。它采用组件化开发模式，使用虚拟DOM提高性能，支持单向数据流。'
      },
      {
        keyword: 'TypeScript',
        answer: 'TypeScript是JavaScript的超集，添加了静态类型检查。它能够在开发阶段发现错误，提高代码质量和开发效率。'
      },
      {
        keyword: '项目经验',
        answer: '在我之前的项目中，我主要负责前端开发工作。通过这些项目，我积累了丰富的技术经验，也提升了解决问题的能力。'
      }
    ];
  }

  public updateConfig(config: Partial<AIConfig>): void {
    this.config = { ...this.config, ...config };
  }

  public isActive(): boolean {
    return this.isAnalyzing;
  }
}

// 导出单例实例
export const aiService = new AIAnalysisEngine();