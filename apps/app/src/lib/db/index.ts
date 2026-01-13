import { Pool, neonConfig } from "@neondatabase/serverless";
import { createServerOnlyFn } from "@tanstack/react-start";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-serverless";
import { drizzle as drizzlePg } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import ws from "ws";
import { env } from "~/env/server";

import * as schema from "~/lib/db/schema";

neonConfig.webSocketConstructor = ws;

const getDatabase = createServerOnlyFn(() => {
  if (env.VERCEL === "1") {
    console.time("[DB] neon");
    const client = new Pool({ connectionString: env.DATABASE_URL });
    console.timeEnd("[DB] neon");

    console.time("[DB] Alternative");
    drizzleNeon({ client, casing: "snake_case" });
    console.timeEnd("[DB] Alternative");

    console.time("[DB] drizzleNeon");
    const db = drizzleNeon({ client, schema, casing: "snake_case" });
    console.timeEnd("[DB] drizzleNeon");

    return db;
  }

  const driver = postgres(env.DATABASE_URL);

  console.time("[DB] postgres");
  const db = drizzlePg({ client: driver, schema, casing: "snake_case" });
  console.timeEnd("[DB] postgres");

  return db;
});

export const db = getDatabase();
