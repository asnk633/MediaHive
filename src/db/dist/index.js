"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = void 0;
// src/db/index.ts
var libsql_1 = require("drizzle-orm/libsql");
var client_1 = require("@libsql/client");
var better_sqlite3_1 = require("drizzle-orm/better-sqlite3");
var Database = require("better-sqlite3");
var schema = require("./schema"); // keep relative path to avoid alias issues
var TURSO_URL = process.env.TURSO_CONNECTION_URL;
var TURSO_PLACEHOLDER = 'your_turso_connection_url_here';
var db;
// If we have a valid Turso/LibSQL URL, use the HTTP libsql client
if (TURSO_URL && TURSO_URL !== TURSO_PLACEHOLDER) {
    var client = (0, client_1.createClient)({
        url: TURSO_URL,
        authToken: process.env.TURSO_AUTH_TOKEN,
    });
    exports.db = db = (0, libsql_1.drizzle)(client, { schema: schema });
}
else {
    // Local SQLite via better-sqlite3
    var dbPath = (process.env.DATABASE_URL || 'file:./dev.db').replace(/^file:/, '');
    var sqlite = new Database.default(dbPath);
    exports.db = db = (0, better_sqlite3_1.drizzle)(sqlite, { schema: schema });
}
