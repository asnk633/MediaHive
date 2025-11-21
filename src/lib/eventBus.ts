// src/lib/eventBus.ts
// Simple event bus for client-side event handling

type EventHandler = (...args: any[]) => void;

class EventBus {
  private handlers: Map<string, EventHandler[]> = new Map();

  /**
   * Subscribe to an event
   * 
   * @param event Event name
   * @param handler Event handler function
   */
  on(event: string, handler: EventHandler) {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, []);
    }
    
    this.handlers.get(event)!.push(handler);
  }

  /**
   * Unsubscribe from an event
   * 
   * @param event Event name
   * @param handler Event handler function
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
   * 
   * @param event Event name
   * @param args Event arguments
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
   * 
   * @param event Event name
   */
  clear(event: string) {
    this.handlers.delete(event);
  }
}

// Export a singleton instance
export const eventBus = new EventBus();