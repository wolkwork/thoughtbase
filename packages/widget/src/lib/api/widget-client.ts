const BASE_URL = import.meta.env.VITE_BASE_URL || "http://localhost:3000";

export interface Idea {
  id: string;
  title: string;
  description: string | null;
  status: string;
  organizationId: string;
  createdAt: string;
  reactionCount: number;
  organization?: {
    slug: string;
  };
}

export async function getWidgetIdeas(organizationId: string): Promise<Idea[]> {
  const res = await fetch(`${BASE_URL}/api/widget/ideas?organizationId=${organizationId}`, {
    mode: "cors",
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to fetch ideas: ${text}`);
  }
  return res.json();
}

export async function createWidgetIdea(data: {
  title: string;
  description: string;
  organizationId: string;
  token?: string;
}) {
  const res = await fetch(`${BASE_URL}/api/widget/ideas`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    mode: "cors",
    credentials: "include", // Send cookies for auth
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to create idea: ${text}`);
  }
  return res.json();
}

