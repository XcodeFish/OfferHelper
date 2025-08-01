import { EventBus } from '@/shared/utils/EventBus';
import { logger } from '@/shared/utils/Logger';

/**
 * 知识库项目接口
 */
export interface KnowledgeItem {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  frequency: number;
  lastUpdated: Date;
  createdAt: Date;
}

/**
 * 搜索选项接口
 */
export interface SearchOptions {
  query?: string;
  category?: string;
  tags?: string[];
  difficulty?: 'easy' | 'medium' | 'hard';
  limit?: number;
  offset?: number;
}

/**
 * 知识库服务
 * 负责管理面试知识库，包括增删改查、搜索、分类等功能
 */
export class KnowledgeService {
  private items: Map<string, KnowledgeItem> = new Map();
  private categories: Set<string> = new Set();
  private tags: Set<string> = new Set();

  constructor() {
    this.initializeDefaultData();
  }

  /**
   * 初始化默认数据
   */
  private initializeDefaultData(): void {
    const defaultItems: Omit<KnowledgeItem, 'id' | 'createdAt' | 'lastUpdated'>[] = [
      {
        title: 'JavaScript 闭包',
        content: '闭包是指有权访问另一个函数作用域中变量的函数。闭包的特点：1. 函数嵌套函数 2. 内部函数可以引用外部函数的参数和变量 3. 参数和变量不会被垃圾回收机制回收',
        category: '前端技术',
        tags: ['JavaScript', '闭包', '作用域'],
        difficulty: 'medium',
        frequency: 0
      },
      {
        title: 'React Hooks',
        content: 'React Hooks 是 React 16.8 引入的新特性，允许在函数组件中使用状态和其他 React 特性。常用的 Hooks：useState、useEffect、useContext、useReducer、useMemo、useCallback',
        category: '前端技术',
        tags: ['React', 'Hooks', '函数组件'],
        difficulty: 'medium',
        frequency: 0
      },
      {
        title: 'HTTP 状态码',
        content: 'HTTP 状态码表示服务器对请求的响应状态。常见状态码：200 成功、301 永久重定向、302 临时重定向、400 客户端错误、401 未授权、403 禁止访问、404 未找到、500 服务器错误',
        category: '网络协议',
        tags: ['HTTP', '状态码', '网络'],
        difficulty: 'easy',
        frequency: 0
      },
      {
        title: '数据库索引',
        content: '数据库索引是提高查询性能的数据结构。类型：主键索引、唯一索引、普通索引、复合索引。优点：加快查询速度。缺点：占用存储空间，影响插入、更新、删除性能',
        category: '数据库',
        tags: ['数据库', '索引', '性能优化'],
        difficulty: 'medium',
        frequency: 0
      },
      {
        title: '算法复杂度',
        content: '时间复杂度和空间复杂度是衡量算法效率的重要指标。常见时间复杂度：O(1) 常数时间、O(log n) 对数时间、O(n) 线性时间、O(n log n) 线性对数时间、O(n²) 平方时间',
        category: '算法',
        tags: ['算法', '复杂度', '性能'],
        difficulty: 'medium',
        frequency: 0
      }
    ];

    defaultItems.forEach(item => {
      this.addItem(item);
    });

    logger.info('知识库默认数据初始化完成');
  }

  /**
   * 添加知识库项目
   */
  public addItem(item: Omit<KnowledgeItem, 'id' | 'createdAt' | 'lastUpdated'>): string {
    const id = this.generateId();
    const now = new Date();
    
    const knowledgeItem: KnowledgeItem = {
      ...item,
      id,
      createdAt: now,
      lastUpdated: now
    };

    this.items.set(id, knowledgeItem);
    this.categories.add(item.category);
    item.tags.forEach(tag => this.tags.add(tag));

    EventBus.emit('knowledge:item-added', knowledgeItem);
    logger.info('添加知识库项目:', item.title);

    return id;
  }

  /**
   * 更新知识库项目
   */
  public updateItem(id: string, updates: Partial<Omit<KnowledgeItem, 'id' | 'createdAt'>>): boolean {
    const item = this.items.get(id);
    if (!item) {
      logger.warn('知识库项目不存在:', id);
      return false;
    }

    const updatedItem: KnowledgeItem = {
      ...item,
      ...updates,
      lastUpdated: new Date()
    };

    this.items.set(id, updatedItem);

    // 更新分类和标签
    if (updates.category) {
      this.categories.add(updates.category);
    }
    if (updates.tags) {
      updates.tags.forEach(tag => this.tags.add(tag));
    }

    EventBus.emit('knowledge:item-updated', updatedItem);
    logger.info('更新知识库项目:', updatedItem.title);

    return true;
  }

  /**
   * 删除知识库项目
   */
  public deleteItem(id: string): boolean {
    const item = this.items.get(id);
    if (!item) {
      logger.warn('知识库项目不存在:', id);
      return false;
    }

    this.items.delete(id);
    EventBus.emit('knowledge:item-deleted', item);
    logger.info('删除知识库项目:', item.title);

    return true;
  }

  /**
   * 获取知识库项目
   */
  public getItem(id: string): KnowledgeItem | null {
    return this.items.get(id) || null;
  }

  /**
   * 搜索知识库项目
   */
  public searchItems(options: SearchOptions = {}): KnowledgeItem[] {
    let results = Array.from(this.items.values());

    // 按查询关键词过滤
    if (options.query) {
      const query = options.query.toLowerCase();
      results = results.filter(item =>
        item.title.toLowerCase().includes(query) ||
        item.content.toLowerCase().includes(query) ||
        item.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // 按分类过滤
    if (options.category) {
      results = results.filter(item => item.category === options.category);
    }

    // 按标签过滤
    if (options.tags && options.tags.length > 0) {
      results = results.filter(item =>
        options.tags!.some(tag => item.tags.includes(tag))
      );
    }

    // 按难度过滤
    if (options.difficulty) {
      results = results.filter(item => item.difficulty === options.difficulty);
    }

    // 按频率排序（高频优先）
    results.sort((a, b) => b.frequency - a.frequency);

    // 分页
    const offset = options.offset || 0;
    const limit = options.limit || results.length;
    results = results.slice(offset, offset + limit);

    return results;
  }

  /**
   * 获取所有分类
   */
  public getCategories(): string[] {
    return Array.from(this.categories).sort();
  }

  /**
   * 获取所有标签
   */
  public getTags(): string[] {
    return Array.from(this.tags).sort();
  }

  /**
   * 增加项目使用频率
   */
  public incrementFrequency(id: string): void {
    const item = this.items.get(id);
    if (item) {
      item.frequency += 1;
      item.lastUpdated = new Date();
      EventBus.emit('knowledge:frequency-updated', item);
    }
  }

  /**
   * 获取热门项目
   */
  public getPopularItems(limit: number = 10): KnowledgeItem[] {
    return Array.from(this.items.values())
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, limit);
  }

  /**
   * 获取最近更新的项目
   */
  public getRecentItems(limit: number = 10): KnowledgeItem[] {
    return Array.from(this.items.values())
      .sort((a, b) => b.lastUpdated.getTime() - a.lastUpdated.getTime())
      .slice(0, limit);
  }

  /**
   * 导出知识库数据
   */
  public exportData(): KnowledgeItem[] {
    return Array.from(this.items.values());
  }

  /**
   * 导入知识库数据
   */
  public importData(items: KnowledgeItem[]): void {
    items.forEach(item => {
      this.items.set(item.id, item);
      this.categories.add(item.category);
      item.tags.forEach(tag => this.tags.add(tag));
    });

    EventBus.emit('knowledge:data-imported', items);
    logger.info(`导入知识库数据: ${items.length} 项`);
  }

  /**
   * 清空知识库
   */
  public clearAll(): void {
    this.items.clear();
    this.categories.clear();
    this.tags.clear();
    EventBus.emit('knowledge:cleared');
    logger.info('知识库已清空');
  }

  /**
   * 获取统计信息
   */
  public getStats(): {
    totalItems: number;
    totalCategories: number;
    totalTags: number;
    difficultyDistribution: Record<string, number>;
  } {
    const items = Array.from(this.items.values());
    const difficultyDistribution = items.reduce((acc, item) => {
      acc[item.difficulty] = (acc[item.difficulty] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalItems: this.items.size,
      totalCategories: this.categories.size,
      totalTags: this.tags.size,
      difficultyDistribution
    };
  }

  /**
   * 生成唯一ID
   */
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}

// 导出单例实例
export const knowledgeService = new KnowledgeService();