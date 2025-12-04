/**
 * @jest-environment node
 */

import fs from "fs";
import path from "path";
import { initializeTestEnvironment, RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { createTask, updateTask, deleteTask } from "../services/taskService";
import { arrayUnion } from "firebase/firestore";
import { seedRoles } from "../test/firestoreTestUtils";

let testEnv: RulesTestEnvironment;

beforeAll(async () => {
    const rulesFile = path.resolve(__dirname, "../../firestore.rules");
    const rules = fs.readFileSync(rulesFile, "utf8");

    testEnv = await initializeTestEnvironment({ projectId: "thaiba-integration", firestore: { rules } });
});

afterAll(async () => {
    await testEnv.cleanup();
});

afterEach(async () => {
    await testEnv.clearFirestore();
});

test("createTask creates task and notification (injected firestore)", async () => {
    const aliceCtx = testEnv.authenticatedContext("alice", { uid: "alice" });
    const db = aliceCtx.firestore();

    // seed role
    await seedRoles(db, { alice: { role: "guest" } });

    const res = await createTask({
        title: "Integration create",
        description: "desc",
        priority: "high",
        status: "pending",
        createdBy: "alice",
        assignedTo: []
    }, db as any);

    const taskSnap = await db.collection("tasks").doc(res.id).get();
    const task = taskSnap.data();
    expect(task).toBeDefined();
    expect(task.title).toBe("Integration create");

    const notifs = await db.collection("notifications").orderBy("createdAt", "desc").limit(1).get();
    expect(notifs.empty).toBe(false);
    const n = notifs.docs[0].data();
    expect(n.title).toBe("New task created");
    expect(n.body).toBe("Integration create");
});

test("updateTask creates update notification", async () => {
    const aliceCtx = testEnv.authenticatedContext("alice2", { uid: "alice2" });
    const db = aliceCtx.firestore();

    await seedRoles(db, { alice2: { role: "team" } });

    const createdRef = await db.collection("tasks").add({
        title: "To edit",
        description: "x",
        priority: "medium",
        status: "pending",
        createdBy: "alice2",
        assignedTo: [],
        createdAt: Date.now(),
        updatedAt: Date.now()
    });

    await updateTask(createdRef.id, { title: "Edited now", priority: "high" }, db as any);

    const updatedSnap = await db.collection("tasks").doc(createdRef.id).get();
    const updated = updatedSnap.data();
    expect(updated.title).toBe("Edited now");

    const notifs = await db.collection("notifications").orderBy("createdAt", "desc").limit(1).get();
    expect(notifs.empty).toBe(false);
    expect(notifs.docs[0].data().title).toBe("Task updated");
});

test("deleteTask removes the task", async () => {
    const bobCtx = testEnv.authenticatedContext("bob", { uid: "bob" });
    const db = bobCtx.firestore();

    await seedRoles(db, { bob: { role: "team" } });

    const createdRef = await db.collection("tasks").add({
        title: "Delete me",
        createdBy: "bob",
        priority: "low",
        status: "pending",
        createdAt: Date.now(),
        updatedAt: Date.now()
    });

    let snap = await db.collection("tasks").doc(createdRef.id).get();
    expect(snap.exists).toBe(true);

    await deleteTask(createdRef.id, db as any);

    snap = await db.collection("tasks").doc(createdRef.id).get();
    expect(snap.exists).toBe(false);
});

test("mark-as-read via arrayUnion works", async () => {
    const adminCtx = testEnv.authenticatedContext("admin", { uid: "admin" });
    const userCtx = testEnv.authenticatedContext("reader", { uid: "reader" });

    const adminDb = adminCtx.firestore();
    const userDb = userCtx.firestore();

    await seedRoles(adminDb, { admin: { role: "admin" }, reader: { role: "team" } });

    const notifRef = await adminDb.collection("notifications").add({
        title: "Broadcast",
        body: "Hello",
        createdAt: Date.now(),
        readBy: []
    });

    // user marks as read using arrayUnion (client style)
    await userDb.collection("notifications").doc(notifRef.id).update({ readBy: arrayUnion("reader") });

    const updated = await adminDb.collection("notifications").doc(notifRef.id).get();
    expect(updated.data().readBy.includes("reader")).toBe(true);
});
