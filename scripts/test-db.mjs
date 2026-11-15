// Database tests on a fresh, throwaway SQLite file (prisma/test.db), never the dev database.
import { execSync } from "node:child_process";
import { rmSync } from "node:fs";

const env = { ...process.env, DATABASE_URL: "file:./test.db" };
rmSync("prisma/test.db", { force: true });
rmSync("prisma/test.db-journal", { force: true });

const run = (cmd) => execSync(cmd, { stdio: "inherit", env });
try {
  run("npx prisma migrate deploy");
  run("node --import tsx --test lib/*.dbtest.ts");
} finally {
  rmSync("prisma/test.db", { force: true });
  rmSync("prisma/test.db-journal", { force: true });
}
