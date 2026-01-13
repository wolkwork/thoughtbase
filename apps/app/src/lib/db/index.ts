import { neon } from "@neondatabase/serverless";
import { createServerOnlyFn } from "@tanstack/react-start";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-http";
import { drizzle as drizzlePg } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "~/env/server";

import * as schema from "~/lib/db/schema";

const getDatabase = createServerOnlyFn(() => {
  if (env.VERCEL === "1") {
    console.time("[DB] neon");
    const client = neon(env.DATABASE_URL);
    console.timeEnd("[DB] neon");

    console.time("[DB] drizzleNeon");
    const db = drizzleNeon({ client, schema, casing: "snake_case" });
    console.timeEnd("[DB] drizzleNeon");
    return db;
  }

  const driver = postgres(env.DATABASE_URL);

  return drizzlePg({ client: driver, schema, casing: "snake_case" });
});

export const db = getDatabase();
