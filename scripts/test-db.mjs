// Database tests in a throwaway Postgres schema (wedcount_test) next to the dev data, never touching it.
// Uses DATABASE_URL_UNPOOLED from the environment or .env (local `npx prisma dev`, or a Neon branch made for tests).
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";

const fromDotEnv = (key) => readFileSync(".env", "utf8").match(new RegExp(`^${key}="?([^"\\n]+)"?`, "m"))?.[1];
const base = process.env.DATABASE_URL_UNPOOLED ?? fromDotEnv("DATABASE_URL_UNPOOLED");
if (!base) throw new Error("Set DATABASE_URL_UNPOOLED (see .env.example)");

const url = new URL(base);
url.searchParams.set("schema", "wedcount_test");
const env = { ...process.env, DATABASE_URL: url.toString(), DATABASE_URL_UNPOOLED: url.toString() };

const run = (cmd, input) => execSync(cmd, { stdio: input ? ["pipe", "inherit", "inherit"] : "inherit", env, input });
const drop = () => run(`npx prisma db execute --url "${url}" --stdin`, "DROP SCHEMA IF EXISTS wedcount_test CASCADE;");

drop();
try {
  run("npx prisma migrate deploy");
  run("node --import tsx --test lib/*.dbtest.ts");
} finally {
  drop();
}
