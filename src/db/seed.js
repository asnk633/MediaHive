"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/db/seed.ts
var bcryptjs_1 = __importDefault(require("bcryptjs"));
var index_js_1 = require("./index.js");
var drizzle_orm_1 = require("drizzle-orm");
var schema_js_1 = require("./schema.js");
var now = function () { return new Date().toISOString(); };
// Small helper: safe cast for optional numeric fields where drizzle expects number | null
var maybe = function (v) { return v; };
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var tenantId, existingTenant, tenantResult, institutionId, existingInstitution, adminId, johnId, existingAdmin, existingJohn, adminPasswordHash, teamPasswordHash, existingTask1, existingTask2, existingEvent, existingNotification, existingAttendance, existingFile, err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 28, , 29]);
                    console.log("📦 Running DB seed...");
                    // 1) Check if tenant already exists, if not insert it
                    console.log(" - checking/inserting tenant...");
                    tenantId = 1;
                    return [4 /*yield*/, index_js_1.db.select({ id: schema_js_1.tenants.id }).from(schema_js_1.tenants).where((0, drizzle_orm_1.eq)(schema_js_1.tenants.id, 1)).limit(1)];
                case 1:
                    existingTenant = _a.sent();
                    if (!(existingTenant.length === 0)) return [3 /*break*/, 3];
                    return [4 /*yield*/, index_js_1.db.insert(schema_js_1.tenants).values({
                            name: "Thaiba Garden",
                            domain: "thaiba.local",
                            createdAt: now(),
                            updatedAt: now(),
                        })];
                case 2:
                    tenantResult = _a.sent();
                    tenantId = Number(tenantResult.lastInsertRowid);
                    _a.label = 3;
                case 3:
                    // 2) Check if institution already exists, if not insert it
                    console.log(" - checking/inserting institution...");
                    institutionId = 1;
                    return [4 /*yield*/, index_js_1.db.select({ id: schema_js_1.institutions.id }).from(schema_js_1.institutions).where((0, drizzle_orm_1.eq)(schema_js_1.institutions.id, 1)).limit(1)];
                case 4:
                    existingInstitution = _a.sent();
                    if (!(existingInstitution.length === 0)) return [3 /*break*/, 6];
                    return [4 /*yield*/, index_js_1.db.insert(schema_js_1.institutions).values({
                            name: "Thaiba Garden",
                            tenantId: tenantId,
                            createdAt: now(),
                        })];
                case 5:
                    _a.sent();
                    _a.label = 6;
                case 6:
                    // 2) Check if users already exist, if not insert them
                    console.log(" - checking/inserting users...");
                    adminId = 1;
                    johnId = 2;
                    return [4 /*yield*/, index_js_1.db.select({ id: schema_js_1.users.id }).from(schema_js_1.users).where((0, drizzle_orm_1.eq)(schema_js_1.users.email, "admin@thaiba.com")).limit(1)];
                case 7:
                    existingAdmin = _a.sent();
                    return [4 /*yield*/, index_js_1.db.select({ id: schema_js_1.users.id }).from(schema_js_1.users).where((0, drizzle_orm_1.eq)(schema_js_1.users.email, "john.doe@thaiba.com")).limit(1)];
                case 8:
                    existingJohn = _a.sent();
                    if (!(existingAdmin.length === 0 && existingJohn.length === 0)) return [3 /*break*/, 10];
                    adminPasswordHash = bcryptjs_1.default.hashSync("ChangeMe123!", 10);
                    teamPasswordHash = bcryptjs_1.default.hashSync("team-pass-123", 10);
                    return [4 /*yield*/, index_js_1.db.insert(schema_js_1.users).values([
                            {
                                email: "admin@thaiba.com",
                                passwordHash: adminPasswordHash,
                                fullName: "Admin User",
                                avatarUrl: null,
                                role: "admin",
                                institutionId: institutionId,
                                tenantId: tenantId,
                                createdAt: now(),
                                updatedAt: now(),
                            },
                            {
                                email: "john.doe@thaiba.com",
                                passwordHash: teamPasswordHash,
                                fullName: "John Doe",
                                avatarUrl: null,
                                role: "team",
                                institutionId: institutionId,
                                tenantId: tenantId,
                                createdAt: now(),
                                updatedAt: now(),
                            },
                        ])];
                case 9:
                    _a.sent();
                    return [3 /*break*/, 11];
                case 10:
                    // Users already exist, get their IDs
                    if (existingAdmin.length > 0) {
                        adminId = existingAdmin[0].id;
                    }
                    if (existingJohn.length > 0) {
                        johnId = existingJohn[0].id;
                    }
                    _a.label = 11;
                case 11:
                    // 3) Check if tasks already exist, if not insert them
                    console.log(" - checking/inserting tasks...");
                    return [4 /*yield*/, index_js_1.db.select({ id: schema_js_1.tasks.id }).from(schema_js_1.tasks).where((0, drizzle_orm_1.eq)(schema_js_1.tasks.title, "Welcome: Set up dashboard")).limit(1)];
                case 12:
                    existingTask1 = _a.sent();
                    return [4 /*yield*/, index_js_1.db.select({ id: schema_js_1.tasks.id }).from(schema_js_1.tasks).where((0, drizzle_orm_1.eq)(schema_js_1.tasks.title, "Prepare Playwright tests")).limit(1)];
                case 13:
                    existingTask2 = _a.sent();
                    if (!(existingTask1.length === 0 && existingTask2.length === 0)) return [3 /*break*/, 15];
                    return [4 /*yield*/, index_js_1.db.insert(schema_js_1.tasks).values([
                            {
                                title: "Welcome: Set up dashboard",
                                description: "Initial onboarding task for the admin user.",
                                status: "todo",
                                priority: "high",
                                assignedToId: maybe(johnId),
                                createdById: adminId,
                                institutionId: institutionId,
                                tenantId: tenantId,
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
                                institutionId: institutionId,
                                tenantId: tenantId,
                                dueDate: null,
                                reviewStatus: null,
                                lastUpdatedBy: null,
                                isArchived: 0,
                                version: 1,
                                createdAt: now(),
                                updatedAt: now(),
                            },
                        ])];
                case 14:
                    _a.sent();
                    _a.label = 15;
                case 15:
                    // 4) Check if event already exists, if not insert it
                    console.log(" - checking/inserting an event...");
                    return [4 /*yield*/, index_js_1.db.select({ id: schema_js_1.events.id }).from(schema_js_1.events).where((0, drizzle_orm_1.eq)(schema_js_1.events.title, "Project Kickoff")).limit(1)];
                case 16:
                    existingEvent = _a.sent();
                    if (!(existingEvent.length === 0)) return [3 /*break*/, 18];
                    return [4 /*yield*/, index_js_1.db.insert(schema_js_1.events).values({
                            title: "Project Kickoff",
                            description: "Initial kickoff meeting for the Orchids feature work.",
                            startTime: now(),
                            endTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // +1 hour
                            approvalStatus: "pending",
                            createdById: adminId,
                            institutionId: institutionId,
                            tenantId: tenantId,
                            createdAt: now(),
                            updatedAt: now(),
                        })];
                case 17:
                    _a.sent();
                    _a.label = 18;
                case 18:
                    // 5) Check if notification already exists, if not insert it
                    console.log(" - checking/inserting a notification...");
                    return [4 /*yield*/, index_js_1.db.select({ id: schema_js_1.notifications.id }).from(schema_js_1.notifications).where((0, drizzle_orm_1.eq)(schema_js_1.notifications.title, "Welcome")).limit(1)];
                case 19:
                    existingNotification = _a.sent();
                    if (!(existingNotification.length === 0)) return [3 /*break*/, 21];
                    // Cast to any to bypass strict typing mismatch in seed insertion.
                    return [4 /*yield*/, index_js_1.db.insert(schema_js_1.notifications).values({
                            userId: adminId,
                            type: "system",
                            title: "Welcome",
                            body: "Seed complete — welcome to Thaiba Garden Media Manager.",
                            read: 0, // boolean mode stored as integer per schema
                            metadata: JSON.stringify({ seed: true }),
                            createdAt: now(),
                            updatedAt: now(),
                        })];
                case 20:
                    // Cast to any to bypass strict typing mismatch in seed insertion.
                    _a.sent();
                    _a.label = 21;
                case 21:
                    // 6) Check if attendance row already exists, if not insert it
                    console.log(" - checking/inserting attendance...");
                    return [4 /*yield*/, index_js_1.db.select({ id: schema_js_1.attendance.id }).from(schema_js_1.attendance).where((0, drizzle_orm_1.eq)(schema_js_1.attendance.userId, johnId)).limit(1)];
                case 22:
                    existingAttendance = _a.sent();
                    if (!(existingAttendance.length === 0)) return [3 /*break*/, 24];
                    return [4 /*yield*/, index_js_1.db.insert(schema_js_1.attendance).values({
                            userId: johnId,
                            checkIn: now(),
                            checkOut: null,
                            institutionId: institutionId,
                            tenantId: tenantId,
                            createdAt: now(),
                        })];
                case 23:
                    _a.sent();
                    _a.label = 24;
                case 24:
                    // 7) Check if files row already exists, if not insert it
                    console.log(" - checking/inserting file entry...");
                    return [4 /*yield*/, index_js_1.db.select({ id: schema_js_1.files.id }).from(schema_js_1.files).where((0, drizzle_orm_1.eq)(schema_js_1.files.name, "example-doc.pdf")).limit(1)];
                case 25:
                    existingFile = _a.sent();
                    if (!(existingFile.length === 0)) return [3 /*break*/, 27];
                    return [4 /*yield*/, index_js_1.db.insert(schema_js_1.files).values({
                            name: "example-doc.pdf",
                            fileUrl: "/public/example-doc.pdf",
                            fileType: "application/pdf",
                            fileSize: 12345,
                            folder: "docs",
                            visibility: "all",
                            uploadedById: adminId,
                            institutionId: institutionId,
                            tenantId: tenantId,
                            createdAt: now(),
                        })];
                case 26:
                    _a.sent();
                    _a.label = 27;
                case 27:
                    console.log("✅ Seed finished.");
                    process.exit(0);
                    return [3 /*break*/, 29];
                case 28:
                    err_1 = _a.sent();
                    console.error("❌ Seed failed:", err_1);
                    process.exit(1);
                    return [3 /*break*/, 29];
                case 29: return [2 /*return*/];
            }
        });
    });
}
main();
