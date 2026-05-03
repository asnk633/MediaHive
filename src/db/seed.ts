// src/db/seed.ts
import bcrypt from "bcryptjs";
import { db } from "./index.js";
import { eq } from "drizzle-orm";
import {
  institutions,
  departments,
  users,
  tasks,
  events,
  notifications,
  attendance,
  files,
  tenants,
  userDepartments,
  userInstitutions
} from "./schema.js";

const now = () => new Date().toISOString();

// Small helper: safe cast for optional numeric fields where drizzle expects number | null
const maybe = <T>(v: T | null) => v as T | null;

async function main() {
  try {
    console.log("📦 Running DB seed...");

    // 1) Check if tenant already exists, if not insert it
    console.log(" - checking/inserting tenant...");
    let tenantId: number;
    const existingTenant = await db.select({id: tenants.id}).from(tenants).where(eq(tenants.id, 1)).limit(1);
    if (existingTenant.length === 0) {
      const [tenantResult] = await db.insert(tenants).values({
        name: "Thaiba Garden",
        domain: "thaiba.local",
        created_at: now(),
        updated_at: now(),
      }).returning({ id: tenants.id });
      tenantId = tenantResult.id;
    } else {
      tenantId = existingTenant[0].id;
    }

    // 2) Check if institution already exists, if not insert it
    console.log(" - checking/inserting institution...");
    let institution_id: number;
    const existingInstitution = await db.select({id: institutions.id}).from(institutions).where(eq(institutions.name, "Thaiba Garden")).limit(1);
    if (existingInstitution.length === 0) {
      const [institutionResult] = await db.insert(institutions).values({
        name: "Thaiba Garden",
        tenantId: tenantId,
        created_at: now(),
      }).returning({ id: institutions.id });
      institution_id = institutionResult.id;
    } else {
      institution_id = existingInstitution[0].id;
    }

    // 3) Check if departments already exist, if not insert them
    console.log(" - checking/inserting departments...");
    const departmentNames = [
      "Media & IT Office",
      "Director Office",
      "Join Director Office",
      "Project Department",
      "Accounts Department",
      "Vehicle Department",
      "Maintenance Department",
      "Food Department",
      "PR Department",
      "Feed The Needy",
      "Candle Of Hope International",
      "Al Siddiqia Trust",
      "Kahani From Thaiba",
      "Amar Thaiba"
    ];

    // Check if any departments exist
    const existingDepartments = await db.select({id: departments.id, name: departments.name}).from(departments).limit(1);
    
    if (existingDepartments.length === 0) {
      // Insert all departments
      for (const deptName of departmentNames) {
        await db.insert(departments).values({
          name: deptName,
          tenantId: tenantId,
          created_at: now(),
        });
      }
      console.log(`  - inserted ${departmentNames.length} departments`);
    } else {
      console.log("  - departments already exist, skipping");
    }

    // 4) Check if institutions already exist, if not insert them
    console.log(" - checking/inserting institutions...");
    const institutionNames = [
      "CIS Boys - Majhikhanda",
      "Banath - Baghait",
      "TPS - Majhikhanda",
      "TPS - Godda",
      "TPS - Antla",
      "TPS - Baleshwar",
      "TPS - Kosbagolla",
      "TPS – Mallikpur",
      "TPS – Raiganj",
      "TPS – Sagardighi",
      "TPS – Manipur",
      "New Katak Public School",
      "Thaiba Moral Academy Office",
      "Model School - Baghait",
      "Da'awra - Majhikhanda",
      "School Of Quran - Baghait",
      "School Of Quran - Mallikpur",
      "CIS Junior Boys – Choumini",
      "CIS Junior Boys - Bisfi",
      "Model Academy - Samsi",
      "Model Academy – Konar",
      "Model Academy - Chakolia",
      "Orphan Home - Baghait",
      "Spark Academy",
      "Edu Berry - UAE"
    ];

    // Check if any institutions exist (beyond the default one)
    const existingInstitutions = await db.select({id: institutions.id, name: institutions.name}).from(institutions);
    
    if (existingInstitutions.length <= 1) { // Only the default one exists
      // Insert all institutions
      for (const instName of institutionNames) {
        await db.insert(institutions).values({
          name: instName,
          tenantId: tenantId,
          created_at: now(),
        });
      }
      console.log(`  - inserted ${institutionNames.length} institutions`);
    } else {
      console.log("  - institutions already exist, skipping");
    }

    // 5) Check if users already exist, if not insert them
    console.log(" - checking/inserting users...");
    let adminId: number;
    let johnId: number;
    let guestId: number;
    
    // Check for existing users
    const existingAdmin = await db.select({id: users.id}).from(users).where(eq(users.email, "admin@thaiba.com")).limit(1);
    const existingJohn = await db.select({id: users.id}).from(users).where(eq(users.email, "john.doe@thaiba.com")).limit(1);
    const existingGuest = await db.select({id: users.id}).from(users).where(eq(users.email, "guest@thaiba.com")).limit(1);
    
    if (existingAdmin.length === 0 && existingJohn.length === 0 && existingGuest.length === 0) {
      // Insert new users and capture their IDs
      const adminPasswordHash = bcrypt.hashSync("ChangeMe123!", 10);
      const teamPasswordHash = bcrypt.hashSync("team-pass-123", 10);
      const guestPasswordHash = bcrypt.hashSync("guest-pass-123", 10);

      const insertedUsers = await db.insert(users).values([
        {
          email: "admin@thaiba.com",
          passwordHash: adminPasswordHash,
          fullName: "Admin User",
          avatar_url: null,
          role: "admin",
          institution_id,
          tenantId: tenantId,
          created_at: now(),
          updated_at: now(),
        },
        {
          email: "john.doe@thaiba.com",
          passwordHash: teamPasswordHash,
          fullName: "John Doe",
          avatar_url: null,
          role: "team",
          institution_id,
          tenantId: tenantId,
          created_at: now(),
          updated_at: now(),
        },
        {
          email: "guest@thaiba.com",
          passwordHash: guestPasswordHash,
          fullName: "Guest User",
          avatar_url: null,
          role: "guest",
          institution_id,
          tenantId: tenantId,
          created_at: now(),
          updated_at: now(),
        },
      ]).returning({ id: users.id, email: users.email });

      // Find the inserted users by email
      const adminUser = insertedUsers.find((u: { email: string; id: number }) => u.email === "admin@thaiba.com");
      const johnUser = insertedUsers.find((u: { email: string; id: number }) => u.email === "john.doe@thaiba.com");
      const guestUser = insertedUsers.find((u: { email: string; id: number }) => u.email === "guest@thaiba.com");

      adminId = adminUser?.id || 1;
      johnId = johnUser?.id || 2;
      guestId = guestUser?.id || 3;
    } else {
      // Users already exist, get their IDs
      adminId = existingAdmin.length > 0 ? existingAdmin[0].id : 1;
      johnId = existingJohn.length > 0 ? existingJohn[0].id : 2;
      guestId = existingGuest.length > 0 ? existingGuest[0].id : 3;
    }

    // 6) Seed user departments and institutions
    console.log(" - checking/inserting user departments and institutions...");
    
    // Get some departments and institutions for seeding
    const allDepartments = await db.select().from(departments).limit(5);
    const allInstitutions = await db.select().from(institutions).limit(5);
    
    if (allDepartments.length > 0 && allInstitutions.length > 0) {
      // Clear existing user departments and institutions
      await db.delete(userDepartments);
      await db.delete(userInstitutions);
      
      // Add sample user-department associations
      if (allDepartments.length >= 3) {
        await db.insert(userDepartments).values([
          { userId: adminId, department_id: allDepartments[0].id, created_at: now() },
          { userId: adminId, department_id: allDepartments[1].id, created_at: now() },
          { userId: johnId, department_id: allDepartments[1].id, created_at: now() },
          { userId: johnId, department_id: allDepartments[2].id, created_at: now() },
        ]);
      }
      
      // Add sample user-institution associations
      if (allInstitutions.length >= 3) {
        await db.insert(userInstitutions).values([
          { userId: adminId, institution_id: allInstitutions[0].id, created_at: now() },
          { userId: adminId, institution_id: allInstitutions[1].id, created_at: now() },
          { userId: johnId, institution_id: allInstitutions[1].id, created_at: now() },
          { userId: johnId, institution_id: allInstitutions[2].id, created_at: now() },
        ]);
      }
      
      console.log("  - inserted sample user departments and institutions");
    }

    // 7) Check if tasks already exist, if not insert them
    console.log(" - checking/inserting tasks...");
    const existingTask1 = await db.select({id: tasks.id}).from(tasks).where(eq(tasks.title, "Welcome: Set up dashboard")).limit(1);
    const existingTask2 = await db.select({id: tasks.id}).from(tasks).where(eq(tasks.title, "Prepare Playwright tests")).limit(1);
    
    if (existingTask1.length === 0 && existingTask2.length === 0) {
      await db.insert(tasks).values([
        {
          title: "Welcome: Set up dashboard",
          description: "Initial onboarding task for the admin user.",
          status: "todo",
          priority: "high",
          assignedToId: maybe(johnId),
          createdById: adminId,
          institution_id,
          tenantId: tenantId,
          due_date: null,
          reviewStatus: null,
          lastUpdatedBy: null,
          isArchived: 0,
          version: 1,
          created_at: now(),
          updated_at: now(),
        },
        {
          title: "Prepare Playwright tests",
          description: "Add e2e tests and CI integration.",
          status: "in_progress",
          priority: "medium",
          assignedToId: maybe(johnId),
          createdById: adminId,
          institution_id,
          tenantId: tenantId,
          due_date: null,
          reviewStatus: null,
          lastUpdatedBy: null,
          isArchived: 0,
          version: 1,
          created_at: now(),
          updated_at: now(),
        },
      ] as any);
    }

    // 8) Check if event already exists, if not insert it
    console.log(" - checking/inserting an event...");
    const existingEvent = await db.select({id: events.id}).from(events).where(eq(events.title, "Project Kickoff")).limit(1);
    if (existingEvent.length === 0) {
      await db.insert(events).values({
        title: "Project Kickoff",
        description: "Initial kickoff meeting for the Orchids feature work.",
        startTime: now(),
        endTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // +1 hour
        approval_status: "pending",
        createdById: adminId,
        institution_id,
        tenantId: tenantId,
        created_at: now(),
        updated_at: now(),
      });
    }

    // 9) Check if notification already exists, if not insert it
    console.log(" - checking/inserting a notification...");
    const existingNotification = await db.select({id: notifications.id}).from(notifications).where(eq(notifications.title, "Welcome")).limit(1);
    if (existingNotification.length === 0) {
      // Cast to any to bypass strict typing mismatch in seed insertion.
      await db.insert(notifications).values({
        userId: adminId,
        type: "system",
        title: "Welcome",
        body: "Seed complete — welcome to Thaiba Garden Media Manager.",
        readAt: null,
        channel: "ui",
        category: null,
        ttl: null,
        readReceipt: false,
        created_at: now(),
        updated_at: now(),
      } as any);
    }

    // 10) Check if attendance row already exists, if not insert it
    console.log(" - checking/inserting attendance...");
    const existingAttendance = await db.select({id: attendance.id}).from(attendance).where(eq(attendance.userId, johnId)).limit(1);
    if (existingAttendance.length === 0) {
      await db.insert(attendance).values({
        userId: johnId,
        checkIn: now(),
        checkOut: null,
        institution_id,
        tenantId: tenantId,
        created_at: now(),
      });
    }

    // 11) Check if files row already exists, if not insert it
    console.log(" - checking/inserting file entry...");
    const existingFile = await db.select({id: files.id}).from(files).where(eq(files.name, "example-doc.pdf")).limit(1);
    if (existingFile.length === 0) {
      await db.insert(files).values({
        name: "example-doc.pdf",
        fileUrl: "/public/example-doc.pdf",
        fileType: "application/pdf",
        fileSize: 12345,
        folder: "docs",
        visibility: "all",
        uploadedById: adminId,
        institution_id,
        tenantId: tenantId,
        created_at: now(),
      });
    }

    console.log("✅ Seed finished.");
    process.exit(0);
  } catch (err) {
    console.error("❌ Seed failed:", err);
    process.exit(1);
  }
}

main();
