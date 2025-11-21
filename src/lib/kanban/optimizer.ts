// src/lib/kanban/optimizer.ts
// Kanban board optimization utilities

// Batch update queue
let batchUpdateQueue: Array<{
  taskId: number;
  updates: Record<string, any>;
  resolve: (value: any) => void;
  reject: (reason?: any) => void;
}> = [];

// Batch update timer
let batchUpdateTimer: NodeJS.Timeout | null = null;

// Batch update delay in milliseconds
const BATCH_UPDATE_DELAY = 100;

// Batch update tasks
export async function batchUpdateTasks(
  updates: Array<{ taskId: number; updates: Record<string, any> }>
): Promise<any[]> {
  try {
    const response = await fetch('/api/tasks/batch', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ updates }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to batch update tasks');
    }
    
    const data = await response.json();
    return data.updatedTasks || [];
  } catch (error) {
    console.error('Batch update failed:', error);
    throw error;
  }
}

// Queue a task update for batching
export function queueTaskUpdate(
  taskId: number,
  updates: Record<string, any>
): Promise<any> {
  return new Promise((resolve, reject) => {
    // Add update to queue
    batchUpdateQueue.push({ taskId, updates, resolve, reject });
    
    // Clear existing timer
    if (batchUpdateTimer) {
      clearTimeout(batchUpdateTimer);
    }
    
    // Set new timer
    batchUpdateTimer = setTimeout(async () => {
      await processBatchUpdates();
    }, BATCH_UPDATE_DELAY);
  });
}

// Process batch updates
async function processBatchUpdates(): Promise<void> {
  // Clear timer reference
  batchUpdateTimer = null;
  
  // If queue is empty, nothing to do
  if (batchUpdateQueue.length === 0) {
    return;
  }
  
  // Copy current queue and clear it
  const currentQueue = [...batchUpdateQueue];
  batchUpdateQueue = [];
  
  try {
    // Prepare batch update data
    const updates = currentQueue.map(item => ({
      taskId: item.taskId,
      updates: item.updates
    }));
    
    // Perform batch update
    const updatedTasks = await batchUpdateTasks(updates);
    
    // Resolve all promises with their respective updated tasks
    currentQueue.forEach((item, index) => {
      const updatedTask = updatedTasks[index];
      if (updatedTask) {
        item.resolve(updatedTask);
      } else {
        item.reject(new Error(`Failed to update task ${item.taskId}`));
      }
    });
  } catch (error) {
    // Reject all promises with the error
    currentQueue.forEach(item => {
      item.reject(error);
    });
  }
}

// Debounce function for search optimization
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout) {
      clearTimeout(timeout);
    }
    
    timeout = setTimeout(later, wait);
  };
}

// Throttle function for scroll optimization
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): T {
  let inThrottle: boolean = false;
  
  return function (this: any, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  } as T;
}

// Virtual scrolling helper
export class VirtualScroller {
  private container: HTMLElement;
  private itemHeight: number;
  private totalItems: number;
  private visibleItems: number;
  private startIndex: number = 0;
  
  constructor(
    container: HTMLElement,
    itemHeight: number,
    totalItems: number,
    visibleItems: number
  ) {
    this.container = container;
    this.itemHeight = itemHeight;
    this.totalItems = totalItems;
    this.visibleItems = visibleItems;
  }
  
  // Update scroll position
  updateScrollPosition(scrollTop: number): void {
    const newStartIndex = Math.floor(scrollTop / this.itemHeight);
    const clampedStartIndex = Math.max(
      0,
      Math.min(newStartIndex, this.totalItems - this.visibleItems)
    );
    
    if (clampedStartIndex !== this.startIndex) {
      this.startIndex = clampedStartIndex;
      this.render();
    }
  }
  
  // Render visible items
  render(): void {
    // In a real implementation, this would render only the visible items
    // and update their positions based on startIndex
    this.container.style.transform = `translateY(${this.startIndex * this.itemHeight}px)`;
  }
  
  // Get current start index
  getStartIndex(): number {
    return this.startIndex;
  }
  
  // Get end index
  getEndIndex(): number {
    return Math.min(this.startIndex + this.visibleItems, this.totalItems);
  }
}