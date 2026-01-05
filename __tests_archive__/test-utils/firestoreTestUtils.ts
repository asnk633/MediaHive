// src/__tests__/test-utils/firestoreTestUtils.ts
import { Firestore } from "firebase/firestore";

/**
 * Seed roles documents in the test firestore quickly.
 * roles: Record<uid, { role: string; tags?: string[] }>
 */
export async function seedRoles(db: any, roles: Record<string, { role: string; tags?: string[] }>) {
    const writes: Promise<any>[] = [];
    for (const uid of Object.keys(roles)) {
        const data = roles[uid];
        writes.push(db.collection("roles").doc(uid).set({ role: data.role, tags: data.tags || [] }));
    }
    await Promise.all(writes);
}

/**
 * Shortcut: create a task with required fields for tests using an injected db.
 * Returns the created DocumentReference.
 */
export async function createTaskForTest(db: any, params: {
    title: string;
    createdBy: string;
    priority?: string;
    status?: string;
    assignedTo?: string[];
}) {
    const docRef = await db.collection("tasks").add({
        title: params.title,
        createdBy: params.createdBy,
        priority: params.priority || "medium",
        status: params.status || "pending",
        createdAt: Date.now(),
        assignedTo: params.assignedTo || []
    });
    return docRef;
}