
import {
    collection,
    onSnapshot,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    Timestamp,
    query,
    orderBy,
    getDocs,
    runTransaction
} from 'firebase/firestore';
import { db } from '@/firebase/client';
import { Task } from '@/types/task';

const TASKS_COLLECTION = 'tasks';
const LOCAL_STORAGE_KEY = 'mediahive_offline_tasks';

// Helper to determine if we should fallback
const isMockEnvironment = !process.env.NEXT_PUBLIC_FIREBASE_API_KEY && !process.env.FIREBASE_CONFIG;
// Or simply always fallback if db operations fail? Let's try hybrid.

// In-Memory fallback for immediate state
let memoryTasks: Task[] = [];

// Helper to save to local storage
const saveToLocal = (tasks: Task[]) => {
    if (typeof window !== 'undefined') {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(tasks));
        // Dispatch event for other tabs
        window.dispatchEvent(new Event('storage'));
        window.dispatchEvent(new Event('task-update'));
    }
    memoryTasks = tasks;
};

// Helper to load from local storage
const loadFromLocal = (): Task[] => {
    if (typeof window !== 'undefined') {
        const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (raw) {
            try {
                const parsed = JSON.parse(raw);
                // Rehydrate Timestamps if needed (simple JSON parse makes dates strings)
                // But our UI checks for .seconds, so we might need to mock that structure
                return parsed.map((t: any) => ({
                    ...t,
                    dueDate: t.dueDate?.seconds ? t.dueDate : { seconds: new Date(t.dueDate).getTime() / 1000, nanoseconds: 0 },
                    createdAt: t.createdAt?.seconds ? t.createdAt : { seconds: Date.now() / 1000, nanoseconds: 0 }
                }));
            } catch (e) { console.error(e); }
        }
    }
    return [];
};


export const TaskService = {
    subscribeToTasks: (callback: (tasks: Task[]) => void) => {
        // Try Firestore first, if it fails/timeouts, use LocalStorage
        let unsubscribe: () => void = () => { };

        try {
            const q = query(collection(db, TASKS_COLLECTION), orderBy('createdAt', 'desc'));
            unsubscribe = onSnapshot(q, (snapshot) => {
                const tasks = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                } as Task));
                // If we got data, update local cache too? Maybe.
                callback(tasks);
            }, (err) => {
                console.warn("Firestore subscription failed (using offline mode):", err);
                // Fallback to LocalStorage
                const localTasks = loadFromLocal();
                callback(localTasks);
            });
        } catch (e) {
            console.warn("Firestore init failed (using offline mode):", e);
            const localTasks = loadFromLocal();
            callback(localTasks);
        }

        // Also listen to local events for immediate UI updates in offline mode
        if (typeof window !== 'undefined') {
            const handleStorage = () => {
                const localTasks = loadFromLocal();
                // We only callback if we are in fallback mode or if we want hybrid?
                // Simple approach: Always callback local if firestore is empty/broken
                // But this might cause jitter. 
                // Let's just assume if onSnapshot didn't fire, we rely on this.
                // Ideally we track connection status.
                callback(localTasks);
            };
            window.addEventListener('task-update', handleStorage);
            return () => {
                if (unsubscribe) unsubscribe();
                window.removeEventListener('task-update', handleStorage);
            };
        }

        return unsubscribe;
    },

    addTask: async (task: Omit<Task, 'id' | 'createdAt'>) => {
        try {
            // Attempt Firestore
            // Add a timeout because it might hang indefinitely if config is mock
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Firestore timeout')), 2000)
            );

            await Promise.race([
                addDoc(collection(db, TASKS_COLLECTION), {
                    ...task,
                    createdAt: Timestamp.now()
                }),
                timeoutPromise
            ]);

        } catch (err) {
            console.warn("Firestore add failed, saving locally:", err);
            // Fallback
            const current = loadFromLocal();
            const newTask: Task = {
                id: 'local_' + Date.now(),
                ...task,
                createdAt: { seconds: Date.now() / 1000, nanoseconds: 0 },
                dueDate: { seconds: task.dueDate.seconds || Date.now() / 1000, nanoseconds: 0 } // Simpler compat
            };
            saveToLocal([newTask, ...current]);
            return { id: newTask.id };
        }
    },

    updateTask: async (id: string, updates: Partial<Task>) => {
        try {
            const taskRef = doc(db, TASKS_COLLECTION, id);
            await updateDoc(taskRef, updates);
        } catch (err) {
            console.warn("Firestore update failed, updating locally:", err);
            const current = loadFromLocal();
            const updated = current.map(t => t.id === id ? { ...t, ...updates } : t);
            saveToLocal(updated);
        }
    },

    deleteTask: async (id: string) => {
        try {
            const taskRef = doc(db, TASKS_COLLECTION, id);
            await deleteDoc(taskRef);
        } catch (err) {
            console.warn("Firestore delete failed, deleting locally:", err);
            const current = loadFromLocal();
            saveToLocal(current.filter(t => t.id !== id));
        }
    },

    toggleTaskAssignee: async (taskId: string, member: { uid: string; name: string }) => {
        try {
            const taskRef = doc(db, TASKS_COLLECTION, taskId);
            // Use transaction to ensure atomic update of the array
            // preventing overwrite race conditions from rapid UI clicks
            await runTransaction(db, async (transaction) => {
                const taskDoc = await transaction.get(taskRef);
                if (!taskDoc.exists()) throw new Error("Task does not exist!");

                const data = taskDoc.data();
                const currentAssignees: { uid: string; name: string }[] = Array.isArray(data.assignedTo) ? data.assignedTo : [];

                const exists = currentAssignees.some(a => a.uid === member.uid);
                let newAssignees;

                if (exists) {
                    newAssignees = currentAssignees.filter(a => a.uid !== member.uid);
                } else {
                    newAssignees = [...currentAssignees, member];
                }

                transaction.update(taskRef, { assignedTo: newAssignees });
            });
        } catch (err) {
            console.warn("Firestore toggle assignee failed, trying fallback:", err);
            // Fallback for offline/mock
            const current = loadFromLocal();
            const taskIndex = current.findIndex(t => t.id === taskId);
            if (taskIndex > -1) {
                const task = current[taskIndex];
                const currentAssignees = Array.isArray(task.assignedTo) ? task.assignedTo : [];
                const exists = currentAssignees.some(a => a.uid === member.uid);
                let newAssignees;
                if (exists) {
                    newAssignees = currentAssignees.filter(a => a.uid !== member.uid);
                } else {
                    newAssignees = [...currentAssignees, member];
                }
                current[taskIndex] = { ...task, assignedTo: newAssignees };
                saveToLocal([...current]);
            }
        }
    },

    seedDummyTasks: async () => {
        const dummyTasks: Omit<Task, 'id' | 'createdAt'>[] = [
            {
                title: "Review Q3 Marketing Plan",
                description: "Analyze the Q3 performing assets and propose a new strategy for Q4.",
                status: "todo",
                priority: "high",
                dueDate: Timestamp.fromDate(new Date(Date.now() + 86400000 * 2)), // 2 days from now
                department: "Marketing",
                assignedBy: { uid: "u3", name: "Shukoor Rahman", role: "admin" },
                createdBy: { uid: "u3", name: "Shukoor Rahman" },
                assignedTo: [{ uid: "u2", name: "KMS Pallikkunnu" }],
            },
            {
                title: "Update Client Database",
                description: "Ensure all new client entries from the last event are logged.",
                status: "in-progress",
                priority: "medium",
                dueDate: Timestamp.fromDate(new Date(Date.now() + 86400000 * 5)),
                department: "Operations",
                assignedBy: { uid: "u3", name: "Shukoor Rahman", role: "admin" },
                createdBy: { uid: "u3", name: "Shukoor Rahman" },
                assignedTo: [{ uid: "u2", name: "KMS Pallikkunnu" }, { uid: "u4", name: "Sarah Designer" }],
            },
            {
                title: "Prepare Monthly Financial Report",
                description: "Compile expenses and earnings for the last month.",
                status: "review",
                priority: "high",
                dueDate: Timestamp.fromDate(new Date(Date.now() + 86400000 * 1)),
                department: "Finance",
                assignedBy: { uid: "u3", name: "Shukoor Rahman", role: "admin" },
                createdBy: { uid: "u3", name: "Shukoor Rahman" },
                assignedTo: [{ uid: "u2", name: "KMS Pallikkunnu" }],
            }
        ];

        try {
            // Try to clear first?
            // Just add
            for (const task of dummyTasks) {
                await TaskService.addTask(task); // Use our own wrapper to handle fallback
            }
        } catch (e) {
            console.error("Seed failed", e);
        }
    }
};
