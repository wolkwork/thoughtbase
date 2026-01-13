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
    const client = new Pool({ connectionString: env.DATABASE_URL });

    drizzleNeon({ client, casing: "snake_case" });

    const db = drizzleNeon({ client, schema, casing: "snake_case" });

    return db;
  }

  const driver = postgres(env.DATABASE_URL);

  const db = drizzlePg({ client: driver, schema, casing: "snake_case" });

  return db;
});

export const db = getDatabase();
