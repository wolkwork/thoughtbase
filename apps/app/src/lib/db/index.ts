import { neon } from "@neondatabase/serverless";
import { createServerOnlyFn } from "@tanstack/react-start";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-http";
import { env } from "~/env/server";

import * as schema from "~/lib/db/schema";

const getDatabase = createServerOnlyFn(async () => {
  if (env.VERCEL === "1") {
    const client = neon(env.DATABASE_URL);
    return drizzleNeon({ client, schema, casing: "snake_case" });
  }

  const { drizzle: drizzlePg } = await import("drizzle-orm/postgres-js");
  const { default: postgres } = await import("postgres");

  const driver = postgres(env.DATABASE_URL);

  return drizzlePg({ client: driver, schema, casing: "snake_case" });
});

export const db = await getDatabase();
