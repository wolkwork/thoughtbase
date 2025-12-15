import { useEffect, useState } from "react";
import {
  getWidgetChangelogs,
  type Changelog,
} from "../../lib/api/widget-client";

interface ChangelogViewProps {
  organizationId: string;
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
function formatDate(dateString: string | null): string {
  if (!dateString) return "";

  const date = new Date(dateString);
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

export function ChangelogView({ organizationId }: ChangelogViewProps) {
  const [changelogs, setChangelogs] = useState<Changelog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!organizationId) return;

    setLoading(true);
    getWidgetChangelogs(organizationId)
      .then((data) => {
        setChangelogs(data);
        setError(null);
      })
      .catch((err) => {
        console.error("Failed to load changelogs", err);
        setError("Failed to load updates");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [organizationId]);

  if (loading) {
    return (
      <div className="flex flex-col">
        <div className="border-b px-6 pb-6">
          <h2 className="text-2xl font-bold">Updates</h2>
          <p className="text-muted-foreground">Latest changelog</p>
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
          <h2 className="text-2xl font-bold">Updates</h2>
          <p className="text-muted-foreground">Latest changelog</p>
        </div>
        <div className="text-muted-foreground py-12 text-center text-sm">
          {error}
        </div>
      </div>
    );
  }

  if (changelogs.length === 0) {
    return (
      <div className="flex flex-col">
        <div className="border-b px-6 pb-6">
          <h2 className="text-2xl font-bold">Updates</h2>
          <p className="text-muted-foreground">Latest changelog</p>
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
        <h2 className="text-2xl font-bold">Updates</h2>
        <p className="text-muted-foreground">Latest changelog</p>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="divide-y">
          {changelogs.map((changelog) => (
            <article key={changelog.id} className="px-6 py-5">
              {changelog.featuredImage && (
                <img
                  src={changelog.featuredImage}
                  alt={changelog.title}
                  className="mb-3 h-32 w-full rounded-lg object-cover"
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

              {changelog.ideas && changelog.ideas.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {changelog.ideas.slice(0, 3).map((idea) => (
                    <span
                      key={idea.id}
                      className="bg-muted rounded px-2 py-0.5 text-xs"
                    >
                      {idea.title}
                    </span>
                  ))}
                  {changelog.ideas.length > 3 && (
                    <span className="text-muted-foreground text-xs">
                      +{changelog.ideas.length - 3} more
                    </span>
                  )}
                </div>
              )}
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
