import { api, getConvexClient } from "~/lib/convex/client";

export type Member = {
  id: string;
  name: string;
  email: string | null;
  image: string | null;
  type: "internal" | "external";
  revenue: number;
  commentCount: number;
  likeCount: number;
  lastActiveAt: number | null; // timestamp in milliseconds
  createdAt: number; // timestamp in milliseconds
};

export async function getMembers(organizationId: string): Promise<Member[]> {
  const convexClient = getConvexClient();
  const members = await convexClient.query(api.members.getMembers, {
    organizationId,
  });
  
  return members;
}
