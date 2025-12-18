const BASE_URL =
  process.env.NODE_ENV === "development"
    ? "http://thoughtbase.localhost:3000"
    : "https://app.thoughtbase.app";

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

export interface Changelog {
  id: string;
  title: string;
  content: string | null;
  featuredImage: string | null;
  publishedAt: string | null;
  status: string;
  organizationId: string;
  createdAt: string;
  ideas: Idea[];
}

export async function getWidgetIdeas(organizationId: string): Promise<Idea[]> {
  const res = await fetch(
    `${BASE_URL}/api/widget/ideas?organizationId=${organizationId}`,
    {
      mode: "cors",
    }
  );
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

export async function getWidgetChangelogs(
  organizationId: string
): Promise<Changelog[]> {
  const res = await fetch(
    `${BASE_URL}/api/widget/changelog?organizationId=${organizationId}`,
    {
      mode: "cors",
    }
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to fetch changelogs: ${text}`);
  }
  return res.json();
}
