import { neon } from "@neondatabase/serverless";
import { createServerOnlyFn } from "@tanstack/react-start";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-http";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import { drizzle as drizzlePg } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "~/env/server";

import { PGlite } from "@electric-sql/pglite";
import { pushSchema } from "drizzle-kit/api";

import * as schema from "~/lib/db/schema";

// Create pglite instance for playwright tests (in-memory)
let pgliteInstance: PGlite | null = null;

const getPgliteInstance = () => {
  if (!pgliteInstance) {
    pgliteInstance = new PGlite();
  }
  return pgliteInstance;
};

const driver = postgres(env.DATABASE_URL);

const getDatabase = createServerOnlyFn(async () => {
  // Use pglite for playwright tests
  if (env.VERCEL_ENV === "playwright") {
    const pglite = getPgliteInstance();

    const pgliteDb = drizzlePglite(pglite, { schema, casing: "snake_case" });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { apply } = await pushSchema(schema, pgliteDb as any);
    await apply();

    return pgliteDb;
  }

  if (env.VERCEL_ENV === "development") {
    return drizzlePg({ client: driver, schema, casing: "snake_case" });
  }

  const client = neon(env.DATABASE_URL);
  return drizzleNeon({ client, schema, casing: "snake_case" });
});

export const db = await getDatabase();
