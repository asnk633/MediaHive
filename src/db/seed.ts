// src/db/seed.ts
import bcrypt from "bcryptjs";
import { db } from "./index";
import {
  institutions,
  users,
  tasks,
  events,
  notifications,
  attendance,
  files,
} from "./schema";

const now = () => new Date().toISOString();

// Small helper: safe cast for optional numeric fields where drizzle expects number | null
const maybe = <T>(v: T | null) => v as T | null;

async function main() {
  try {
    console.log("📦 Running DB seed...");

    // 1) Insert institution
    console.log(" - inserting institution...");
    await db.insert(institutions).values({
      name: "Thaiba Garden",
      tenantId: 1, // Default tenant ID
      createdAt: now(),
    });

    // We assume the institution id will be 1 on a fresh DB. If not, change accordingly.
    const institutionId = 1;

    // 2) Insert users (admin + example team user)
    console.log(" - inserting users...");
    const adminPasswordHash = bcrypt.hashSync("ChangeMe123!", 10);
    const teamPasswordHash = bcrypt.hashSync("team-pass-123", 10);

    await db.insert(users).values([
      {
        email: "admin@thaiba.com",
        passwordHash: adminPasswordHash,
        fullName: "Admin User",
        avatarUrl: null,
        role: "admin",
        institutionId,
        tenantId: 1, // Default tenant ID
        createdAt: now(),
        updatedAt: now(),
      },
      {
        email: "john.doe@thaiba.com",
        passwordHash: teamPasswordHash,
        fullName: "John Doe",
        avatarUrl: null,
        role: "team",
        institutionId,
        tenantId: 1, // Default tenant ID
        createdAt: now(),
        updatedAt: now(),
      },
    ]);

    // For simplicity assume admin id = 1 and john doe id = 2 on a fresh DB
    // If your DB already has rows, fetch IDs programmatically (see note below)
    const adminId = 1;
    const johnId = 2;

    // 3) Insert example tasks
    console.log(" - inserting tasks...");
    await db.insert(tasks).values([
      {
        title: "Welcome: Set up dashboard",
        description: "Initial onboarding task for the admin user.",
        status: "todo",
        priority: "high",
        assignedToId: maybe(johnId),
        createdById: adminId,
        institutionId,
        tenantId: 1, // Default tenant ID
        dueDate: null,
        reviewStatus: null,
        lastUpdatedBy: null,
        isArchived: 0,
        version: 1,
        createdAt: now(),
        updatedAt: now(),
      },
      {
        title: "Prepare Playwright tests",
        description: "Add e2e tests and CI integration.",
        status: "in_progress",
        priority: "medium",
        assignedToId: maybe(johnId),
        createdById: adminId,
        institutionId,
        tenantId: 1, // Default tenant ID
        dueDate: null,
        reviewStatus: null,
        lastUpdatedBy: null,
        isArchived: 0,
        version: 1,
        createdAt: now(),
        updatedAt: now(),
      },
    ] as any);

    // 4) Insert an event
    console.log(" - inserting an event...");
    await db.insert(events).values({
      title: "Project Kickoff",
      description: "Initial kickoff meeting for the Orchids feature work.",
      startTime: now(),
      endTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // +1 hour
      approvalStatus: "pending",
      createdById: adminId,
      institutionId,
      tenantId: 1, // Default tenant ID
      createdAt: now(),
      updatedAt: now(),
    });

    // 5) Insert a notification
    console.log(" - inserting a notification...");
    // Cast to any to bypass strict typing mismatch in seed insertion.
    await db.insert(notifications).values({
      userId: adminId,
      type: "system",
      title: "Welcome",
      message: "Seed complete — welcome to Thaiba Garden Media Manager.",
      read: 0, // boolean mode stored as integer per schema
      metadata: JSON.stringify({ seed: true }),
      createdAt: now(),
    } as any);

    // 6) Insert an attendance row
    console.log(" - inserting attendance...");
    await db.insert(attendance).values({
      userId: johnId,
      checkIn: now(),
      checkOut: null,
      institutionId,
      tenantId: 1, // Default tenant ID
      createdAt: now(),
    });

    // 7) Insert a files row
    console.log(" - inserting file entry...");
    await db.insert(files).values({
      name: "example-doc.pdf",
      fileUrl: "/public/example-doc.pdf",
      fileType: "application/pdf",
      fileSize: 12345,
      folder: "docs",
      visibility: "all",
      uploadedById: adminId,
      institutionId,
      tenantId: 1, // Default tenant ID
      createdAt: now(),
    });

    console.log("✅ Seed finished.");
    process.exit(0);
  } catch (err) {
    console.error("❌ Seed failed:", err);
    process.exit(1);
  }
}

main();