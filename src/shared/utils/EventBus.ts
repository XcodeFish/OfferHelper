/**
 * 简单的事件总线实现
 * 用于组件间通信
 */
export class EventBus {
  private static listeners: { [key: string]: Function[] } = {};

  /**
   * 发射事件
   */
  static emit(event: string, data?: any): void {
    try {
      // 发射自定义事件系统
      if (this.listeners[event]) {
        this.listeners[event].forEach(callback => {
          try {
            callback(data);
          } catch (error) {
            console.error(`EventBus: 事件处理器执行失败 [${event}]:`, error);
          }
        });
      }
      
      // 直接发射DOM事件，不使用setTimeout
      if (typeof window !== 'undefined' && typeof document !== 'undefined') {
        try {
          // 将语音事件映射到DOM事件名称
          const domEventMap: { [key: string]: string } = {
            'speech:started': 'speechStart',
            'speech:ended': 'speechEnd', 
            'speech:error': 'speechError',
            'speech:result': 'speechTranscript',
            'speech:interim': 'speechInterimTranscript'
          };
          
          const domEventName = domEventMap[event] || event;
          const customEvent = new CustomEvent(domEventName, { detail: data });
          document.dispatchEvent(customEvent);
        } catch (error) {
          console.error(`EventBus: DOM事件发射失败 [${event}]:`, error);
        }
      }
    } catch (error) {
      console.error(`EventBus: emit方法执行失败 [${event}]:`, error);
    }
  }

  /**
   * 监听事件
   */
  static on(event: string, callback: Function): void {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  /**
   * 移除事件监听器
   */
  static off(event: string, callback: Function): void {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    }
  }

  /**
   * 移除所有事件监听器
   */
  static removeAllListeners(event?: string): void {
    if (event) {
      delete this.listeners[event];
    } else {
      this.listeners = {};
    }
  }

  /**
   * 获取事件监听器数量
   */
  static getListenerCount(event: string): number {
    return this.listeners[event] ? this.listeners[event].length : 0;
  }
}