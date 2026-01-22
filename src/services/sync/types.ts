export type SyncStatus = 'idle' | 'syncing' | 'error' | 'offline';

export interface SyncProvider {
    name: string;
    sync(): Promise<void>;
    getStatus(): SyncStatus;
}

export interface SyncService {
    registerProvider(provider: SyncProvider): void;
    syncAll(): Promise<void>;
    getProviderStatus(providerName: string): SyncStatus;
}
