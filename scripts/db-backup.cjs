#!/usr/bin/env node
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const out = `backup-${Date.now()}.sql`;
execSync("turso db dump > " + out);

console.log("Backup created:", out);