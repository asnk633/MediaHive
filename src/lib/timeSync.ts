/**
 * MediaHive Server Time Synchronization
 * 
 * Maintains a clock offset between the client and server to ensure
 * consistency in timestamps, especially for gap filling and audit logs.
 */

class TimeSyncManager {
  private offsets: number[] = [];
  private readonly MAX_SAMPLES = 5;

  /**
   * Updates the offset based on server response headers
   */
  syncWithServer(serverDateStr: string | null) {
    if (!serverDateStr) return;

    const serverTime = new Date(serverDateStr).getTime();
    const clientTime = Date.now();
    
    // Offset = Server Time - Client Time
    const newOffset = serverTime - clientTime;
    
    this.offsets.push(newOffset);
    if (this.offsets.length > this.MAX_SAMPLES) {
      this.offsets.shift();
    }

    if (Math.abs(newOffset) > 1000) {
      console.debug(`[TimeSync] 🕒 New offset sample: ${newOffset}ms. Stable median applied.`);
    }
  }

  /**
   * Returns the median offset to filter out network jitter
   */
  private getMedianOffset(): number {
    if (this.offsets.length === 0) return 0;
    const sorted = [...this.offsets].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  }

  /**
   * Returns the current synced server time
   */
  now(): number {
    return Date.now() + this.getMedianOffset();
  }

  /**
   * Returns the synced date object
   */
  getSyncedDate(): Date {
    return new Date(this.now());
  }
}

export const timeSync = new TimeSyncManager();
