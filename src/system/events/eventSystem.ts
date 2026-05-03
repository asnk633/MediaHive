type EventCallback<T = any> = (data: T) => void;

export type MediaHiveEvent =
    | { type: 'task.created'; data: { taskId: string; title: string } }
    | { type: 'task.updated'; data: { taskId: string; changes: any } }
    | { type: 'task.completed'; data: { taskId: string; userId: string } }
    | { type: 'inventory.updated'; data: { itemId: string; quantity: number } }
    | { type: 'inventory.issued'; data: { itemId: string; userId: string; issueId: string } }
    | { type: 'inventory.returned'; data: { itemId: string; issueId: string } }
    | { type: 'event.created'; data: { eventId: string; title: string } };

class EventBus {
    private listeners: Map<string, Set<EventCallback>> = new Map();

    subscribe<T extends MediaHiveEvent['type']>(
        type: T,
        callback: EventCallback<Extract<MediaHiveEvent, { type: T }>['data']>
    ) {
        if (!this.listeners.has(type)) {
            this.listeners.set(type, new Set());
        }
        this.listeners.get(type)!.add(callback);

        return () => this.unsubscribe(type, callback);
    }

    private unsubscribe(type: string, callback: EventCallback) {
        const typeListeners = this.listeners.get(type);
        if (typeListeners) {
            typeListeners.delete(callback);
            if (typeListeners.size === 0) {
                this.listeners.delete(type);
            }
        }
    }

    emit<T extends MediaHiveEvent['type']>(
        type: T,
        data: Extract<MediaHiveEvent, { type: T }>['data']
    ) {
        console.log(`[EventBus] Emitting: ${type}`, data);
        const typeListeners = this.listeners.get(type);
        if (typeListeners) {
            typeListeners.forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`[EventBus] Error in subscriber for ${type}:`, error);
                }
            });
        }
    }
}

export const eventBus = new EventBus();
