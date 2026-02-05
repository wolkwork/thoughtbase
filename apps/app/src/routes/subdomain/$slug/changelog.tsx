import { createFileRoute, Link, useLoaderData } from "@tanstack/react-router";
import { api } from "@thoughtbase/backend/convex/_generated/api";
import { Image } from "@unpic/react";
import { usePaginatedQuery } from "convex/react";
import { format } from "date-fns";
import type { ReactNode } from "react";
import { useEffect, useRef } from "react";
import { LikeBadge } from "~/components/engagement-badges";

export const Route = createFileRoute("/subdomain/$slug/changelog")({
  component: ChangelogPage,
});

// Helper to render Tiptap JSON content as HTML
function renderTiptapContent(content: string | null): ReactNode {
  if (!content) return null;

  try {
    const json = JSON.parse(content);
    return renderNode(json);
  } catch {
    return <p>{content}</p>;
  }
}

function renderNode(node: any): ReactNode {
  if (!node) return null;

  if (node.type === "doc") {
    return (
      <>
        {node.content?.map((child: any, i: number) => renderNode({ ...child, key: i }))}
      </>
    );
  }

  if (node.type === "paragraph") {
    return (
      <p key={node.key} className="mb-4 last:mb-0">
        {node.content?.map((child: any, i: number) => renderNode({ ...child, key: i }))}
      </p>
    );
  }

  if (node.type === "heading") {
    const level = node.attrs?.level || 2;
    const className =
      level === 1 ? "text-2xl font-bold mb-4" : "text-xl font-semibold mb-3";
    const content = node.content?.map((child: any, i: number) =>
      renderNode({ ...child, key: i }),
    );

    if (level === 1)
      return (
        <h1 key={node.key} className={className}>
          {content}
        </h1>
      );
    if (level === 2)
      return (
        <h2 key={node.key} className={className}>
          {content}
        </h2>
      );
    return (
      <h3 key={node.key} className={className}>
        {content}
      </h3>
    );
  }

  if (node.type === "bulletList") {
    return (
      <ul key={node.key} className="mb-4 list-disc pl-6">
        {node.content?.map((child: any, i: number) => renderNode({ ...child, key: i }))}
      </ul>
    );
  }

  if (node.type === "orderedList") {
    return (
      <ol key={node.key} className="mb-4 list-decimal pl-6">
        {node.content?.map((child: any, i: number) => renderNode({ ...child, key: i }))}
      </ol>
    );
  }

  if (node.type === "listItem") {
    return (
      <li key={node.key}>
        {node.content?.map((child: any, i: number) => renderNode({ ...child, key: i }))}
      </li>
    );
  }

  if (node.type === "blockquote") {
    return (
      <blockquote key={node.key} className="border-muted mb-4 border-l-4 pl-4 italic">
        {node.content?.map((child: any, i: number) => renderNode({ ...child, key: i }))}
      </blockquote>
    );
  }

  if (node.type === "codeBlock") {
    return (
      <pre key={node.key} className="bg-muted mb-4 overflow-x-auto rounded p-4">
        <code>
          {node.content?.map((child: any, i: number) => renderNode({ ...child, key: i }))}
        </code>
      </pre>
    );
  }

  if (node.type === "text") {
    let content: ReactNode = node.text;

    if (node.marks) {
      for (const mark of node.marks) {
        if (mark.type === "bold") {
          content = <strong key={node.key}>{content}</strong>;
        }
        if (mark.type === "italic") {
          content = <em key={node.key}>{content}</em>;
        }
        if (mark.type === "strike") {
          content = <s key={node.key}>{content}</s>;
        }
        if (mark.type === "code") {
          content = (
            <code key={node.key} className="bg-muted rounded px-1">
              {content}
            </code>
          );
        }
        if (mark.type === "link") {
          content = (
            <a
              key={node.key}
              href={mark.attrs?.href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline"
            >
              {content}
            </a>
          );
        }
      }
    }

    return content;
  }

  if (node.type === "hardBreak") {
    return <br key={node.key} />;
  }

  return null;
}

function ChangelogPage() {
  const { org } = useLoaderData({ from: "/subdomain/$slug" });

  const {
    results: changelogs,
    status,
    loadMore,
  } = usePaginatedQuery(
    api.changelogs.getPublishedChangelogs,
    { organizationSlug: org.slug },
    { initialNumItems: 10 },
  );

  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && status === "CanLoadMore") {
          loadMore(10);
        }
      },
      { threshold: 0.1, rootMargin: "100px" },
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [status, loadMore]);

  return (
    <div className="bg-background text-foreground relative min-h-screen">
      <div className="mx-auto max-w-3xl px-4 py-12">
        <div className="mb-12">
          <h1 className="text-4xl font-bold">Changelog</h1>
          <p className="text-muted-foreground mt-2">
            New updates and improvements to {org.name}
          </p>
        </div>

        {status === "LoadingFirstPage" && (
          <div className="text-muted-foreground py-12 text-center">
            Loading updates...
          </div>
        )}

        {status !== "LoadingFirstPage" && changelogs.length === 0 && (
          <div className="text-muted-foreground py-12 text-center">
            No updates yet. Check back soon!
          </div>
        )}

        <div>
          {changelogs.map((changelog) => (
            <article
              key={changelog.id}
              className="border-muted relative border-l-2 pb-20 pl-8"
            >
              {/* Timeline dot */}
              <div className="border-primary bg-background absolute top-0 -left-[9px] h-4 w-4 rounded-full border-2" />

              {/* Date */}
              <time className="text-muted-foreground mb-2 block text-sm">
                {changelog.publishedAt
                  ? format(new Date(changelog.publishedAt), "MMMM d, yyyy")
                  : ""}
              </time>

              {/* Title */}
              <h2 className="mb-4 text-2xl font-bold">{changelog.title}</h2>

              {/* Featured Image */}
              {changelog.featuredImage && (
                <Image
                  src={changelog.featuredImage}
                  alt={changelog.title}
                  aspectRatio={16 / 9}
                  className="mb-6 rounded-lg"
                  fallback="wsrv"
                  width={702}
                />
              )}

              {/* Content */}
              <div className="prose prose-sm dark:prose-invert max-w-none">
                {renderTiptapContent(changelog.content)}
              </div>

              {/* Linked Ideas */}
              {changelog.ideas.length > 0 && (
                <div className="mt-6 rounded-lg border">
                  <h3 className="text-muted-foreground px-3 py-2.5 text-xs font-medium tracking-wider uppercase">
                    Related Ideas
                  </h3>
                  <div className="">
                    {changelog.ideas.map(
                      (idea: {
                        id: string;
                        title: string;
                        description: string | null;
                        reactionCount: number;
                      }) => (
                        <Link
                          key={idea.id}
                          to="/subdomain/$slug/$ideaId"
                          params={{ slug: org.slug, ideaId: idea.id }}
                          className="hover:bg-muted/50 flex items-center justify-between gap-3 border-t px-3 py-3"
                        >
                          <div className="min-w-0 flex-1">
                            <h4 className="text-sm font-medium">{idea.title}</h4>
                            {idea.description && (
                              <p className="text-muted-foreground mt-1 line-clamp-1 text-xs">
                                {idea.description}
                              </p>
                            )}
                          </div>
                          <LikeBadge count={idea.reactionCount} />
                        </Link>
                      ),
                    )}
                  </div>
                </div>
              )}
            </article>
          ))}
        </div>

        {/* Infinite Scroll Sentinel */}
        <div ref={loadMoreRef} className="text-muted-foreground py-4 text-center text-sm">
          {status === "LoadingMore" ? (
            <span>Loading more...</span>
          ) : status === "CanLoadMore" ? (
            <span>Load more</span>
          ) : status === "Exhausted" && changelogs.length > 0 ? (
            <span>You've reached the beginning</span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
