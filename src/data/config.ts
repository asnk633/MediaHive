export type DataMode = 'firebase' | 'emulator' | 'local';

export const DATA_MODE: DataMode =
    (process.env.NEXT_PUBLIC_DATA_MODE as DataMode) || 'firebase';

export const IS_DEV = process.env.NODE_ENV === 'development';
export const IS_EMULATOR = DATA_MODE === 'emulator';
export const IS_LOCAL_MOCK = DATA_MODE === 'local';
export const IS_FIREBASE = DATA_MODE === 'firebase';

console.log(`[CONFIG] Data Mode: ${DATA_MODE}`);
