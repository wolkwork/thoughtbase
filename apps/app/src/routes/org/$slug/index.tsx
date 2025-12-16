import { LightbulbIcon } from "@phosphor-icons/react";
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { createFileRoute, Link, useLoaderData, useRouter } from "@tanstack/react-router";
import { format } from "date-fns";
import { ArrowDown, ArrowUp, Flame, Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { AuthForm } from "~/components/auth-form";
import { CreateIdeaDialog } from "~/components/create-idea-dialog";
import { CommentBadge, LikeBadge } from "~/components/engagement-badges";
import { ProfileForm } from "~/components/profile-form";
import { StatusBadge } from "~/components/status-badge";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { $getIdeasFeed, $getPublicCounts, $toggleReaction } from "~/lib/api/ideas";

export const Route = createFileRoute("/org/$slug/")({
  component: OrganizationIndexPage,
});

function OrganizationIndexPage() {
  const { org, user, profile } = useLoaderData({ from: "/org/$slug" });
  const router = useRouter();
  const queryClient = useQueryClient();

  const [loginOpen, setLoginOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
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

  const { data: counts } = useQuery({
    queryKey: ["public-counts", org.id],
    queryFn: () => $getPublicCounts({ data: { organizationId: org.id } }),
  });

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

  const handleSubmitClick = () => {
    if (!user) {
      setLoginOpen(true);
    } else if (!profile) {
      setProfileOpen(true);
    } else {
      setCreateOpen(true);
    }
  };

  const handleLoginSuccess = () => {
    setLoginOpen(false);
    router.invalidate();
  };

  const handleProfileSuccess = () => {
    setProfileOpen(false);
    router.invalidate();
    setCreateOpen(true); // Auto open create after profile setup
  };

  const totalCount = counts ? counts.reduce((acc, curr) => acc + curr.count, 0) : 0;

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
      <div className="mx-auto grid max-w-4xl grid-cols-1 border-r border-l lg:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-6 border-r py-8 lg:col-span-2">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
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

              <Button variant="outline" size="icon">
                <Search className="h-4 w-4" />
              </Button>
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
                  <div className="group flex flex-col items-start gap-4 p-6 transition-colors">
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
                        <Avatar className="size-8">
                          <AvatarImage src={idea.author.image} />
                          <AvatarFallback>
                            {idea.author.name?.charAt(0) || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col gap-0.5">
                          <div className="text-foreground flex items-center gap-2 font-medium">
                            <span>{idea.author.name}</span>
                          </div>
                          <span className="text-xs">
                            {format(new Date(idea.createdAt), "MMM d, yyyy")}
                          </span>
                        </div>
                      </div>

                      <div className="ml-auto flex gap-1.5">
                        <StatusBadge showLabel={false} status={idea.status} />

                        <CommentBadge count={idea.commentCount} />

                        <LikeBadge
                          count={idea.reactionCount}
                          hasReacted={hasReacted}
                          onClick={(e) => handleUpvote(e, idea)}
                        />
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

        {/* Sidebar */}
        <div className="sticky top-16 h-fit space-y-6 px-6 py-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <LightbulbIcon className="size-5" weight="bold" />
              <h3 className="font-medium">Got an idea?</h3>
            </div>

            <Button className="w-full" onClick={handleSubmitClick}>
              Submit an idea
            </Button>
          </div>

          <div className="text-muted-foreground bg-muted/20 border-t py-3 text-center text-xs">
            Powered by <span className="font-medium">Thoughtbase</span>
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

      <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Complete Profile</DialogTitle>
            <DialogDescription>
              Please set your display name to continue.
            </DialogDescription>
          </DialogHeader>
          <ProfileForm
            orgId={org.id}
            initialName={user?.name || ""}
            onSuccess={handleProfileSuccess}
          />
        </DialogContent>
      </Dialog>

      <CreateIdeaDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        organizationId={org.id}
      />
    </>
  );
}
