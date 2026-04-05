/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('node:fs');
const path = require('node:path');
const { execSync } = require('node:child_process');
const { DatabaseSync } = require('node:sqlite');

const root = process.cwd();
const dbPath = path.join(root, 'prisma', 'dev.db');
const sqlPath = path.join(root, 'prisma', 'bootstrap.sql');

function run(command) {
  console.log(`> ${command}`);
  return execSync(command, {
    cwd: root,
    stdio: ['ignore', 'pipe', 'inherit'],
    encoding: 'utf8',
  });
}

const diffSql = run('npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script');
fs.writeFileSync(sqlPath, diffSql, 'utf8');

if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);
const db = new DatabaseSync(dbPath);
db.exec('PRAGMA foreign_keys = ON;');
db.exec(diffSql);
db.close();

run('npx prisma generate');
run('npm run db:seed');

console.log(`Veritabanı hazır: ${dbPath}`);
