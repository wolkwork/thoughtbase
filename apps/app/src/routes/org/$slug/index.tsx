import { HeartIcon } from "@phosphor-icons/react";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useLoaderData, useRouter } from "@tanstack/react-router";
import { format } from "date-fns";
import { ArrowDown, ArrowUp, Flame } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { AuthForm } from "~/components/auth-form";
import { CommentBadge } from "~/components/engagement-badges";
import { IdeaStatus, StatusPill } from "~/components/status-badge";
import { Button } from "~/components/ui/button";
import { Dialog, DialogContent } from "~/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { UserAvatar } from "~/components/user-avatar";
import { $getIdeasFeed, $toggleReaction } from "~/lib/api/ideas";
import { cn } from "~/lib/utils";

export const Route = createFileRoute("/org/$slug/")({
  component: OrganizationIndexPage,
});

function OrganizationIndexPage() {
  const { org, user } = useLoaderData({ from: "/org/$slug" });
  const router = useRouter();
  const queryClient = useQueryClient();

  const [loginOpen, setLoginOpen] = useState(false);
  const [sortBy, setSortBy] = useState<"newest" | "top" | "trending">("newest");

  const {
    data: ideasData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
  } = useInfiniteQuery({
    queryKey: ["public-ideas", org.id, sortBy],
    queryFn: ({ pageParam }) =>
      $getIdeasFeed({
        data: {
          organizationId: org.id,
          sort: sortBy,
          page: pageParam,
          limit: 20,
        },
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });

  const ideas = ideasData?.pages.flatMap((page) => page.items) || [];

  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1, rootMargin: "100px" },
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const { mutate: toggleReaction } = useMutation({
    mutationFn: $toggleReaction,
    onMutate: async (newReaction) => {
      // Optimistic update for list
      await queryClient.cancelQueries({ queryKey: ["public-ideas", org.id, sortBy] });
      const previousData = queryClient.getQueryData(["public-ideas", org.id, sortBy]);

      queryClient.setQueryData(["public-ideas", org.id, sortBy], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            items: page.items.map((idea: any) => {
              if (idea.id !== newReaction.data.ideaId) return idea;

              const isExternal = user?.type === "external";
              const hasReacted = idea.reactions.some((r: any) => {
                if (isExternal)
                  return r.externalUserId === user?.id && r.type === "upvote";
                return r.userId === user?.id && r.type === "upvote";
              });

              let newReactions = [...idea.reactions];

              if (hasReacted) {
                newReactions = newReactions.filter((r: any) => {
                  if (isExternal)
                    return !(r.externalUserId === user?.id && r.type === "upvote");
                  return !(r.userId === user?.id && r.type === "upvote");
                });
              } else {
                newReactions.push({
                  id: "optimistic-" + Math.random(),
                  userId: isExternal ? null : user?.id,
                  externalUserId: isExternal ? user?.id : null,
                  type: "upvote",
                  createdAt: new Date().toISOString(),
                });
              }

              return {
                ...idea,
                reactions: newReactions,
                reactionCount: newReactions.length,
              };
            }),
          })),
        };
      });
      return { previousData };
    },
    onError: (err, newReaction, context) => {
      queryClient.setQueryData(["public-ideas", org.id, sortBy], context?.previousData);
      router.invalidate();
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["public-ideas", org.id, sortBy] });
    },
  });

  const handleUpvote = (e: React.MouseEvent, idea: any) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      setLoginOpen(true);
      return;
    }
    toggleReaction({ data: { ideaId: idea.id, type: "upvote" } });
  };

  const handleLoginSuccess = () => {
    setLoginOpen(false);
    router.invalidate();
  };

  const getSortLabel = (sort: typeof sortBy) => {
    switch (sort) {
      case "newest":
        return "Newest";
      case "top":
        return "Top";
      case "trending":
        return "Trending";
    }
  };

  return (
    <>
      <div className="mx-auto w-full max-w-3xl flex-1 border-r border-l">
        {/* Main Content */}
        <div className="py-8">
          <div className="flex flex-col justify-between gap-4 border-b pb-8 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2 px-6">
              <h1 className="text-2xl font-bold">All Feedback</h1>
            </div>

            <div className="flex items-center gap-3 px-6">
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button variant="outline" className="gap-2">
                      {sortBy === "trending" && <Flame className="h-4 w-4" />}
                      {sortBy === "top" && <ArrowUp className="h-4 w-4" />}
                      {sortBy === "newest" && <ArrowDown className="h-4 w-4" />}
                      <span>{getSortLabel(sortBy)}</span>
                    </Button>
                  }
                />

                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setSortBy("newest")}>
                    <ArrowDown className="mr-2 h-4 w-4" />
                    Newest
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy("top")}>
                    <ArrowUp className="mr-2 h-4 w-4" />
                    Top
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy("trending")}>
                    <Flame className="mr-2 h-4 w-4" />
                    Trending
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* <Button variant="outline" size="icon">
                <Search className="h-4 w-4" />
              </Button> */}
            </div>
          </div>

          <div className="divide-border divide-y">
            {ideas.map((idea) => {
              const isExternal = user?.type === "external";
              const hasReacted =
                !!user &&
                idea.reactions.some((r: any) => {
                  if (isExternal)
                    return r.externalUserId === user.id && r.type === "upvote";
                  return r.userId === user.id && r.type === "upvote";
                });

              return (
                <Link
                  key={idea.id}
                  to="/org/$slug/$ideaId"
                  params={{ slug: org.slug, ideaId: idea.id }}
                  className="block"
                >
                  <div className="group flex gap-6 p-6 py-8 transition-colors">
                    <div>
                      <button
                        onClick={(e) => handleUpvote(e, idea)}
                        className={cn(
                          "hover:bg-accent text-muted-foreground flex aspect-6/5 flex-col items-center gap-1 rounded-sm border px-3 py-1.5 pt-2 text-xs transition-colors",
                          "cursor-pointer",
                        )}
                      >
                        <HeartIcon
                          weight={hasReacted ? "fill" : "bold"}
                          className={cn("size-4", hasReacted && "fill-red-500")}
                        />
                        <span className="mt-px font-mono text-xs font-medium">
                          {idea.reactionCount}
                        </span>
                      </button>
                    </div>
                    <div className="flex flex-1 flex-col items-start gap-4">
                      <div className="min-w-0 flex-1">
                        <h3 className="group-hover:text-primary mb-1 font-medium transition-colors">
                          {idea.title}
                        </h3>
                        <p className="text-muted-foreground mb-3 line-clamp-3 text-sm text-ellipsis">
                          {idea.description}
                        </p>
                      </div>

                      <div className="flex w-full items-center gap-3">
                        <div className="text-muted-foreground flex w-full items-center gap-4 text-sm">
                          {/* TODO: fix */}
                          {/* @ts-expect-error - user is not typed */}
                          <UserAvatar user={idea.author} />
                          <div className="flex flex-col gap-0.5">
                            <div className="text-foreground flex items-center gap-2 font-medium">
                              <span>
                                {"name" in idea.author ? idea.author.name : "Unknown"}
                              </span>
                            </div>
                            <span className="text-xs">
                              {format(new Date(idea.createdAt), "MMM d, yyyy")}
                            </span>
                          </div>
                        </div>

                        <div className="ml-auto flex items-center gap-1.5">
                          {/* TODO: narrow types */}
                          <StatusPill variant={idea.status as IdeaStatus} />

                          <CommentBadge count={idea.commentCount} />
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}

            {ideas.length === 0 && status === "success" && (
              <div className="text-muted-foreground py-12 text-center">
                No feedback yet. Be the first to submit!
              </div>
            )}
            {status === "pending" && (
              <div className="text-muted-foreground py-12 text-center">
                Loading ideas...
              </div>
            )}
          </div>

          {/* Infinite Scroll Sentinel */}
          <div
            ref={loadMoreRef}
            className="text-muted-foreground py-4 text-center text-sm"
          >
            {isFetchingNextPage ? (
              <span>Loading more...</span>
            ) : hasNextPage ? (
              <span>Load more</span>
            ) : ideas.length > 0 ? (
              <span>You've reached the end</span>
            ) : null}
          </div>
        </div>
      </div>

      {/* Submission Flow Dialogs */}
      <Dialog open={loginOpen} onOpenChange={setLoginOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <AuthForm
            orgName={org.name}
            orgId={org.id}
            onSuccess={handleLoginSuccess}
            mode="dialog"
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
