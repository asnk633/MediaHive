"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = void 0;
// src/db/index.ts
var libsql_1 = require("drizzle-orm/libsql");
var client_1 = require("@libsql/client");
var better_sqlite3_1 = require("drizzle-orm/better-sqlite3");
var better_sqlite3_2 = __importDefault(require("better-sqlite3"));
var schema = __importStar(require("./schema")); // keep relative path to avoid alias issues
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
    var sqlite = new better_sqlite3_2.default(dbPath);
    exports.db = db = (0, better_sqlite3_1.drizzle)(sqlite, { schema: schema });
}
