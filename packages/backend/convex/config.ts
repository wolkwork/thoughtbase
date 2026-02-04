import { query } from "./_generated/server";

export const isCloud = query({
  args: {},
  handler: async () => {
    return process.env.THOUGHTBASE_CLOUD === "1";
  },
});
