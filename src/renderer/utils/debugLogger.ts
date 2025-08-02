/**
 * 调试日志系统
 * 用于跟踪应用运行状态，帮助诊断闪退问题
 */

interface LogEntry {
  timestamp: number;
  level: 'info' | 'warn' | 'error' | 'debug';
  category: string;
  message: string;
  data?: any;
}

class DebugLogger {
  private logs: LogEntry[] = [];
  private maxLogs = 500; // 最多保存500条日志
  private isEnabled = true;

  constructor() {
    this.setupGlobalErrorHandling();
  }

  private setupGlobalErrorHandling() {
    // 捕获未处理的错误
    window.addEventListener('error', (event) => {
      this.error('global', `未捕获的错误: ${event.error?.message || event.message}`, {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error?.stack
      });
    });

    // 捕获未处理的Promise拒绝
    window.addEventListener('unhandledrejection', (event) => {
      this.error('global', `未处理的Promise拒绝: ${event.reason}`, {
        reason: event.reason,
        stack: event.reason?.stack
      });
    });

    // 监听页面卸载
    window.addEventListener('beforeunload', () => {
      this.info('global', '页面即将卸载');
      this.saveToStorage();
    });
  }

  private addLog(level: LogEntry['level'], category: string, message: string, data?: any) {
    if (!this.isEnabled) return;

    const entry: LogEntry = {
      timestamp: Date.now(),
      level,
      category,
      message,
      data
    };

    this.logs.push(entry);

    // 限制日志数量
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // 输出到控制台
    const timestamp = new Date(entry.timestamp).toLocaleTimeString();
    const logMessage = `[${timestamp}] [${level.toUpperCase()}] [${category}] ${message}`;
    
    switch (level) {
      case 'error':
        console.error(logMessage, data);
        break;
      case 'warn':
        console.warn(logMessage, data);
        break;
      case 'debug':
        console.debug(logMessage, data);
        break;
      default:
        console.log(logMessage, data);
    }

    // 自动保存关键错误
    if (level === 'error') {
      this.saveToStorage();
    }
  }

  info(category: string, message: string, data?: any) {
    this.addLog('info', category, message, data);
  }

  warn(category: string, message: string, data?: any) {
    this.addLog('warn', category, message, data);
  }

  error(category: string, message: string, data?: any) {
    this.addLog('error', category, message, data);
  }

  debug(category: string, message: string, data?: any) {
    this.addLog('debug', category, message, data);
  }

  // 获取所有日志
  getAllLogs(): LogEntry[] {
    return [...this.logs];
  }

  // 获取特定类别的日志
  getLogsByCategory(category: string): LogEntry[] {
    return this.logs.filter(log => log.category === category);
  }

  // 获取特定级别的日志
  getLogsByLevel(level: LogEntry['level']): LogEntry[] {
    return this.logs.filter(log => log.level === level);
  }

  // 清除日志
  clear() {
    this.logs = [];
    localStorage.removeItem('debug-logs');
  }

  // 保存到本地存储
  saveToStorage() {
    try {
      // 只保存最近的100条日志到存储中
      const recentLogs = this.logs.slice(-100);
      localStorage.setItem('debug-logs', JSON.stringify(recentLogs));
    } catch (error) {
      console.error('保存调试日志失败:', error);
    }
  }

  // 从本地存储加载
  loadFromStorage() {
    try {
      const stored = localStorage.getItem('debug-logs');
      if (stored) {
        const logs = JSON.parse(stored) as LogEntry[];
        this.logs = [...logs, ...this.logs]; // 合并历史日志和当前日志
        
        // 限制总数量
        if (this.logs.length > this.maxLogs) {
          this.logs = this.logs.slice(-this.maxLogs);
        }
      }
    } catch (error) {
      console.error('加载调试日志失败:', error);
    }
  }

  // 导出日志为文本
  exportAsText(): string {
    return this.logs.map(log => {
      const timestamp = new Date(log.timestamp).toLocaleString(); 
      const dataStr = log.data ? ` | ${JSON.stringify(log.data)}` : '';
      return `[${timestamp}] [${log.level.toUpperCase()}] [${log.category}] ${log.message}${dataStr}`;
    }).join('\n');
  }

  // 启用/禁用日志
  setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
  }

  // 记录用户操作
  trackUserAction(action: string, details?: any) {
    this.info('user-action', action, details);
  }

  // 记录组件生命周期
  trackComponentLifecycle(componentName: string, lifecycle: string, details?: any) {
    this.debug('component', `${componentName}: ${lifecycle}`, details);
  }

  // 记录API调用
  trackApiCall(method: string, url: string, status?: number, error?: any) {
    const level = error ? 'error' : 'info';
    this.addLog(level, 'api', `${method} ${url}`, { status, error });
  }

  // 记录性能指标
  trackPerformance(metric: string, value: number, unit: string = 'ms') {
    this.info('performance', `${metric}: ${value}${unit}`);
  }
}

// 创建全局实例
export const debugLogger = new DebugLogger();

// 在开发环境中自动加载历史日志
if (process.env.NODE_ENV === 'development') {
  debugLogger.loadFromStorage();
}

// 暴露到全局，方便调试
(window as any).debugLogger = debugLogger;