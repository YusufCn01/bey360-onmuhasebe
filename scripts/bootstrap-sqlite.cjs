/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');

const dbPath = path.join(process.cwd(), 'prisma', 'dev.db');
const sqlPath = path.join(process.cwd(), 'prisma', 'bootstrap.sql');

fs.mkdirSync(path.dirname(dbPath), { recursive: true });
if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);
const db = new DatabaseSync(dbPath);
db.exec('PRAGMA foreign_keys = ON;');
const sql = fs.readFileSync(sqlPath, 'utf8');
db.exec(sql);
db.close();
console.log(`SQLite hazir: ${dbPath}`);
