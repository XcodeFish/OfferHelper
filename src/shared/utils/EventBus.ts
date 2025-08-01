type EventCallback = (...args: any[]) => void;

class EventBusClass {
  private static instance: EventBusClass;
  private events: Map<string, EventCallback[]> = new Map();

  public static getInstance(): EventBusClass {
    if (!EventBusClass.instance) {
      EventBusClass.instance = new EventBusClass();
    }
    return EventBusClass.instance;
  }

  public on(event: string, callback: EventCallback): void {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    this.events.get(event)!.push(callback);
  }

  public off(event: string, callback?: EventCallback): void {
    if (!this.events.has(event)) return;

    if (callback) {
      const callbacks = this.events.get(event)!;
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    } else {
      this.events.delete(event);
    }
  }

  public emit(event: string, ...args: any[]): void {
    if (!this.events.has(event)) return;

    const callbacks = this.events.get(event)!;
    callbacks.forEach(callback => {
      try {
        callback(...args);
      } catch (error) {
        console.error(`事件处理错误 [${event}]:`, error);
      }
    });
  }

  public once(event: string, callback: EventCallback): void {
    const onceCallback = (...args: any[]) => {
      callback(...args);
      this.off(event, onceCallback);
    };
    this.on(event, onceCallback);
  }

  public removeAllListeners(event?: string): void {
    if (event) {
      this.events.delete(event);
    } else {
      this.events.clear();
    }
  }

  public listenerCount(event: string): number {
    return this.events.get(event)?.length || 0;
  }

  public eventNames(): string[] {
    return Array.from(this.events.keys());
  }
}

// 导出单例实例
export const EventBus = EventBusClass.getInstance();
