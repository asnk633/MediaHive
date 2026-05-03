import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister"

export const reactQueryPersister = typeof window !== 'undefined'
    ? createSyncStoragePersister({
        storage: window.localStorage,
    })
    : undefined;
