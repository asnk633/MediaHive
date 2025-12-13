
import {
    collection,
    onSnapshot,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    Timestamp,
    query,
    orderBy
} from 'firebase/firestore';
import { db } from '@/firebase/client';
import type { Event } from '@/types/event';

const EVENTS_COLLECTION = 'events';
const LOCAL_STORAGE_KEY = 'mediahive_offline_events';

// In-Memory fallback
let memoryEvents: Event[] = [];

const saveToLocal = (events: Event[]) => {
    if (typeof window !== 'undefined') {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(events));
        window.dispatchEvent(new Event('event-update'));
    }
    memoryEvents = events;
};

const loadFromLocal = (): Event[] => {
    if (typeof window !== 'undefined') {
        const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (raw) {
            try {
                const parsed = JSON.parse(raw);
                return parsed.map((t: any) => ({
                    ...t,
                    date: t.date?.seconds ? t.date : { seconds: new Date(t.date).getTime() / 1000, nanoseconds: 0 },
                    createdAt: t.createdAt?.seconds ? t.createdAt : { seconds: Date.now() / 1000, nanoseconds: 0 }
                }));
            } catch (e) { console.error(e); }
        }
    }
    return [];
};

export const EventService = {
    subscribeToEvents: (callback: (events: Event[]) => void) => {
        let unsubscribe: () => void = () => { };

        try {
            const q = query(collection(db, EVENTS_COLLECTION), orderBy('date', 'asc'));
            unsubscribe = onSnapshot(q, (snapshot) => {
                const events = snapshot.docs.map(doc => {
                    const data = doc.data();
                    return {
                        id: doc.id,
                        ...data,
                        startTime: data.startTime instanceof Timestamp
                            ? data.startTime
                            : (data.startTime ? new Timestamp(data.startTime.seconds, data.startTime.nanoseconds) : undefined),
                        endTime: data.endTime instanceof Timestamp
                            ? data.endTime
                            : (data.endTime ? new Timestamp(data.endTime.seconds, data.endTime.nanoseconds) : undefined),
                    };
                }) as unknown as Event[];
                callback(events);
            }, (err) => {
                console.warn("Firestore subscription failed (offline):", err);
                callback(loadFromLocal());
            });
        } catch (e) {
            console.warn("Firestore init failed (offline):", e);
            callback(loadFromLocal());
        }

        if (typeof window !== 'undefined') {
            const handleStorage = () => callback(loadFromLocal());
            window.addEventListener('event-update', handleStorage);
            return () => {
                if (unsubscribe) unsubscribe();
                window.removeEventListener('event-update', handleStorage);
            };
        }

        return unsubscribe;
    },

    addEvent: async (event: Omit<Event, 'id' | 'createdAt'>) => {
        try {
            const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 2000));
            await Promise.race([
                addDoc(collection(db, EVENTS_COLLECTION), {
                    ...event,
                    createdAt: Timestamp.now()
                }),
                timeoutPromise
            ]);
        } catch (err) {
            console.warn("Saving event locally:", err);
            const current = loadFromLocal();
            const newEvent: Event = {
                id: 'local_' + Date.now(),
                ...event,
                createdAt: Timestamp.fromMillis(Date.now()),
                date: Timestamp.fromMillis(Date.now())
            };
            saveToLocal([newEvent, ...current]);
        }
    },

    deleteEvent: async (id: string) => {
        try {
            await deleteDoc(doc(db, EVENTS_COLLECTION, id));
        } catch (err) {
            const current = loadFromLocal();
            saveToLocal(current.filter(t => t.id !== id));
        }
    }
};
