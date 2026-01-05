const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');

// Connect to the database
const db = new Database('dev.db');

// Helper function to get current timestamp
const now = () => new Date().toISOString();

try {
  console.log("📦 Running simple DB seed...");

  // Check if tenant already exists, if not insert it
  console.log(" - checking/inserting tenant...");
  let tenantId;
  const existingTenant = db.prepare('SELECT id FROM tenants WHERE id = 1').get();
  if (!existingTenant) {
    const result = db.prepare('INSERT INTO tenants (name, domain, created_at, updated_at) VALUES (?, ?, ?, ?)').run(
      "Thaiba Garden",
      "thaiba.local",
      now(),
      now()
    );
    tenantId = result.lastInsertRowid;
    console.log("  - inserted tenant with ID:", tenantId);
  } else {
    tenantId = existingTenant.id;
    console.log("  - using existing tenant with ID:", tenantId);
  }

  // Check if institution already exists, if not insert it
  console.log(" - checking/inserting institution...");
  let institutionId;
  const existingInstitution = db.prepare('SELECT id FROM institutions WHERE name = ?').get("Thaiba Garden");
  if (!existingInstitution) {
    const result = db.prepare('INSERT INTO institutions (name, tenant_id, created_at) VALUES (?, ?, ?)').run(
      "Thaiba Garden",
      tenantId,
      now()
    );
    institutionId = result.lastInsertRowid;
    console.log("  - inserted institution with ID:", institutionId);
  } else {
    institutionId = existingInstitution.id;
    console.log("  - using existing institution with ID:", institutionId);
  }

  // Check if departments already exist, if not insert them
  console.log(" - checking/inserting departments...");
  const departmentNames = [
    "Media & IT Office",
    "Director Office",
    "Join Director Office",
    "Project Department",
    "Accounts Department"
  ];

  // Check if any departments exist
  const existingDepartments = db.prepare('SELECT id FROM departments LIMIT 1').all();
  
  if (existingDepartments.length === 0) {
    // Insert all departments
    for (const deptName of departmentNames) {
      db.prepare('INSERT INTO departments (name, tenant_id, created_at) VALUES (?, ?, ?)').run(
        deptName,
        tenantId,
        now()
      );
    }
    console.log(`  - inserted ${departmentNames.length} departments`);
  } else {
    console.log("  - departments already exist, skipping");
  }

  // Check if institutions already exist, if not insert them
  console.log(" - checking/inserting institutions...");
  const institutionNames = [
    "CIS Boys - Majhikhanda",
    "Banath - Baghait",
    "TPS - Majhikhanda",
    "TPS - Godda",
    "TPS - Antla"
  ];

  // Check if any institutions exist (beyond the default one)
  const allInstitutions = db.prepare('SELECT id FROM institutions').all();
  
  if (allInstitutions.length <= 1) { // Only the default one exists
    // Insert all institutions
    for (const instName of institutionNames) {
      db.prepare('INSERT INTO institutions (name, tenant_id, created_at) VALUES (?, ?, ?)').run(
        instName,
        tenantId,
        now()
      );
    }
    console.log(`  - inserted ${institutionNames.length} institutions`);
  } else {
    console.log("  - institutions already exist, skipping");
  }

  console.log("✅ Simple seed finished.");
} catch (err) {
  console.error("❌ Simple seed failed:", err);
  process.exit(1);
}