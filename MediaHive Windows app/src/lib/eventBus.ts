type EventHandler = (...args: any[]) => void;

class EventBus {
  private handlers: Map<string, EventHandler[]> = new Map();

  /**
   * Subscribe to an event
   */
  on(event: string, handler: EventHandler) {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, []);
    }
    
    this.handlers.get(event)!.push(handler);
  }

  /**
   * Unsubscribe from an event
   */
  off(event: string, handler: EventHandler) {
    const handlers = this.handlers.get(event);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  /**
   * Emit an event
   */
  emit(event: string, ...args: any[]) {
    const handlers = this.handlers.get(event);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(...args);
        } catch (error) {
          console.error(`Error in event handler for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Clear all handlers for an event
   */
  clear(event: string) {
    this.handlers.delete(event);
  }
}

export const eventBus = new EventBus();
