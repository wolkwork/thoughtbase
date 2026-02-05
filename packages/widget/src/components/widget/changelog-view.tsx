import { api } from "@thoughtbase/backend/convex/_generated/api";
import { Image } from "@unpic/react";
import { useQuery } from "convex/react";

interface ChangelogViewProps {
  organizationSlug: string;
}

interface Changelog {
  id: string;
  title: string;
  content: string | null;
  featuredImage: string | null;
  publishedAt: number | null;
  status: string;
  organizationId: string;
  createdAt: number;
  ideas: Array<{
    id: string;
    title: string;
    description: string | null;
    reactionCount: number;
  }>;
}

// Helper to render Tiptap JSON content as plain text for the widget
function renderTiptapAsText(content: string | null, maxLength = 150): string {
  if (!content) return "";

  try {
    const json = JSON.parse(content);
    const text = extractText(json);
    if (text.length > maxLength) {
      return text.substring(0, maxLength).trim() + "...";
    }
    return text;
  } catch {
    return content.substring(0, maxLength);
  }
}

function extractText(node: any): string {
  if (!node) return "";

  if (node.type === "text") {
    return node.text || "";
  }

  if (node.content && Array.isArray(node.content)) {
    return node.content.map(extractText).join(" ");
  }

  return "";
}

// Format date in a relative way
function formatDate(dateString: string | number | null): string {
  if (!dateString) return "";

  const date = typeof dateString === "number" ? new Date(dateString) : new Date(dateString);
  const now = new Date();
  const diffInDays = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffInDays === 0) return "Today";
  if (diffInDays === 1) return "Yesterday";
  if (diffInDays < 7) return `${diffInDays} days ago`;
  if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

export function ChangelogView({ organizationSlug }: ChangelogViewProps) {
  const changelogs = useQuery(api.widget.getWidgetChangelogs, {
    organizationSlug,
  }) as Changelog[] | undefined;

  const loading = changelogs === undefined;
  const error = changelogs === null ? "Failed to load updates" : null;

  if (loading) {
    return (
      <div className="flex flex-col">
        <div className="border-b px-6 pb-6">
          <h2 className="text-2xl font-bold">Changelog</h2>
          <p className="text-muted-foreground">Our latest updates</p>
        </div>
        <div className="text-muted-foreground py-12 text-center text-sm">
          Loading updates...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col">
        <div className="border-b px-6 pb-6">
          <h2 className="text-2xl font-bold">Changelog</h2>
          <p className="text-muted-foreground">Our latest updates</p>
        </div>
        <div className="text-muted-foreground py-12 text-center text-sm">
          {error}
        </div>
      </div>
    );
  }

  if (!changelogs || changelogs.length === 0) {
    return (
      <div className="flex flex-col">
        <div className="border-b px-6 pb-6">
          <h2 className="text-2xl font-bold">Changelog</h2>
          <p className="text-muted-foreground">Our latest updates</p>
        </div>
        <div className="text-muted-foreground py-12 text-center text-sm">
          No updates yet.
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col overflow-hidden">
      <div className="border-b px-6 pb-6">
        <h2 className="text-2xl font-bold">Changelog</h2>
        <p className="text-muted-foreground">Our latest updates</p>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="divide-y">
          {changelogs.map((changelog) => (
            <article key={changelog.id} className="px-6 py-5">
              {changelog.featuredImage && (
                <Image
                  src={changelog.featuredImage}
                  alt={changelog.title}
                  aspectRatio={16 / 9}
                  width={330}
                  fallback="wsrv"
                  className="mb-3 rounded-lg"
                />
              )}

              <div className="mb-2 flex items-center gap-2">
                <time className="text-muted-foreground text-xs">
                  {formatDate(changelog.publishedAt)}
                </time>
              </div>

              <h3 className="mb-2 font-semibold leading-tight">
                {changelog.title}
              </h3>

              <p className="text-muted-foreground text-sm leading-relaxed">
                {renderTiptapAsText(changelog.content)}
              </p>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
