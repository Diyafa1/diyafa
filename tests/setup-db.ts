import { execSync } from "node:child_process";
import { PrismaClient } from "@prisma/client";

/** Prepares the separate TEST database (never the real one): applies migrations, then empties every table. */
export default async function setup() {
  const url = process.env.TEST_DATABASE_URL ?? "postgresql://diyafa:diyafa@localhost:5432/diyafa_test";
  if (!/_test(\?|$)/.test(url)) throw new Error("Refusing to run tests on a database whose name does not end with _test");
  execSync("npx prisma migrate deploy", { env: { ...process.env, DATABASE_URL: url }, stdio: "ignore" });
  const db = new PrismaClient({ datasourceUrl: url });
  const tables = await db.$queryRaw<{ tablename: string }[]>`SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename <> '_prisma_migrations'`;
  await db.$executeRawUnsafe(`TRUNCATE ${tables.map((t) => `"${t.tablename}"`).join(", ")} CASCADE`);
  await db.$disconnect();
}
