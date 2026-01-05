/**
 * @jest-environment node
 */

import fs from "fs";
import path from "path";
import {
  initializeTestEnvironment,
  RulesTestEnvironment,
  assertSucceeds,
  assertFails
} from "@firebase/rules-unit-testing";
import { arrayUnion } from "firebase/firestore";
import { seedRoles } from "../test-utils/firestoreTestUtils";

jest.unmock("firebase/firestore");

let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  const rulesPath = path.resolve(__dirname, "../../../firestore.rules");
  const rules = fs.readFileSync(rulesPath, "utf8");

  testEnv = await initializeTestEnvironment({
    projectId: "thaiba-rules-test",
    firestore: { rules }
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

afterEach(async () => {
  await testEnv.clearFirestore();
});

describe("Explicit Firestore security rule tests (loaded from firestore.rules)", () => {
  test("guest can create task; guest who created it can update and delete it", async () => {
    const guestCtx = testEnv.authenticatedContext("guest1");
    const dbGuest = guestCtx.firestore();

    // seed roles using helper (admin + guest doc)
    const adminCtx = testEnv.authenticatedContext("sysadmin");
    const adminDb = adminCtx.firestore();
    await seedRoles(adminDb, {
      sysadmin: { role: "admin" },
      guest1: { role: "guest" }
    });

    // guest creates (createdBy must equal request.auth.uid)
    await assertSucceeds(dbGuest.collection("tasks").add({
      title: "Guest task",
      createdBy: "guest1",
      priority: "low",
      status: "pending",
      createdAt: Date.now()
    }));

    // get the created doc id
    const snap = await dbGuest.collection("tasks").where("createdBy", "==", "guest1").get();
    const docRef = snap.docs[0].ref;

    // guest updates their own task
    await assertSucceeds(docRef.update({ title: "Guest task updated" }));

    // guest deletes their own task
    await assertSucceeds(docRef.delete());
  });

  test("team can create, admin can delete other's tasks but team cannot delete others' tasks", async () => {
    const adminCtx = testEnv.authenticatedContext("admin");
    const teamCtx = testEnv.authenticatedContext("teamA");
    const otherTeamCtx = testEnv.authenticatedContext("teamB");

    const adminDb = adminCtx.firestore();
    const teamDb = teamCtx.firestore();
    const otherTeamDb = otherTeamCtx.firestore();

    await seedRoles(adminDb, { admin: { role: 'admin' }, teamA: { role: 'team' }, teamB: { role: 'team' } });

    // teamA creates a task
    await assertSucceeds(teamDb.collection("tasks").add({
      title: "Owned by teamA",
      createdBy: "teamA",
      priority: "medium",
      status: "pending",
      createdAt: Date.now()
    }));

    const createdRef = (await teamDb.collection("tasks").where("createdBy", "==", "teamA").get()).docs[0].ref;

    // teamB cannot delete teamA's task
    await assertFails(otherTeamDb.collection("tasks").doc(createdRef.id).delete());

    // admin can delete it
    await assertSucceeds(adminDb.collection("tasks").doc(createdRef.id).delete());
  });

  test("notifications: only admin can create; authenticated users can mark-as-read via arrayUnion", async () => {
    const adminCtx = testEnv.authenticatedContext("adminN");
    const userCtx = testEnv.authenticatedContext("userN");

    const adminDb = adminCtx.firestore();
    const userDb = userCtx.firestore();

    await seedRoles(adminDb, { adminN: { role: 'admin' }, userN: { role: 'team' } });

    // admin creates notification
    await assertSucceeds(adminDb.collection("notifications").add({
      title: "Broadcast",
      body: "Hello everyone",
      createdAt: Date.now(),
      readBy: []
    }));

    // user attempts to create notification -> should fail
    await assertFails(userDb.collection("notifications").add({
      title: "User tries",
      body: "No",
      createdAt: Date.now(),
      readBy: []
    }));

    // get the notif doc
    const nSnap = await adminDb.collection("notifications").limit(1).get();
    const nRef = nSnap.docs[0].ref;

    // user marks-as-read using arrayUnion
    await assertSucceeds(nRef.update({ readBy: arrayUnion("userN") }));
  });

  test("roles: only admin can write role docs", async () => {
    const adminCtx = testEnv.authenticatedContext("adminR");
    const teamCtx = testEnv.authenticatedContext("teamR");

    const adminDb = adminCtx.firestore();
    const teamDb = teamCtx.firestore();

    await seedRoles(adminDb, { adminR: { role: 'admin' }, teamR: { role: 'team' } });

    // admin can write role for another user
    await assertSucceeds(adminDb.collection("roles").doc("someone").set({ role: "team", tags: [] }));

    // team cannot write roles
    await assertFails(teamDb.collection("roles").doc("other").set({ role: "guest", tags: [] }));
  });

  test("unauthenticated cannot access (read/write) anything", async () => {
    const unauthDb = testEnv.unauthenticatedContext().firestore();
    await assertFails(unauthDb.collection("tasks").add({ title: "x", createdBy: "anon", priority: "low", status: "pending", createdAt: Date.now() }));
    await assertFails(unauthDb.collection("notifications").add({ title: "x", body: "x", createdAt: Date.now(), readBy: [] }));
  });
});