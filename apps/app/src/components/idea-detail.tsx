import { ChatsCircleIcon, HeartIcon } from "@phosphor-icons/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useRouter } from "@tanstack/react-router";
import { format, formatDistanceToNow } from "date-fns";
import { lowerCase } from "lodash";
import { ArrowLeftIcon, CalendarIcon, Trash2, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  $createComment,
  $deleteIdea,
  $toggleReaction,
  $updateIdeaEta,
  $updateIdeaStatus,
} from "~/lib/api/ideas";
import { cn } from "~/lib/utils";
import { IdeaStatus, StatusPill } from "./status-badge";
import { Button } from "./ui/button";
import { Calendar } from "./ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Textarea } from "./ui/textarea";
import { UserAvatar } from "./user-avatar";

interface IdeaDetailProps {
  idea: any; // Replace with proper type inference if possible
  currentUser: any;
  orgSlug?: string;
  organizationId?: string;
}

const STATUS_OPTIONS = [
  { slug: "pending", name: "Pending" },
  { slug: "reviewing", name: "Reviewing" },
  { slug: "planned", name: "Planned" },
  { slug: "in_progress", name: "In Progress" },
  { slug: "completed", name: "Completed" },
  { slug: "closed", name: "Closed" },
];

export function IdeaDetail({
  idea,
  currentUser,
  orgSlug,
  organizationId,
}: IdeaDetailProps) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const navigate = useNavigate();
  const [comment, setComment] = useState("");
  const [activeTab, setActiveTab] = useState("comments");

  const { mutate: addComment, isPending: isCommentPending } = useMutation({
    mutationFn: $createComment,
    onMutate: async (newComment) => {
      const tempId = crypto.randomUUID();
      const optimisticComment = {
        id: tempId,
        content: newComment.data.content,
        createdAt: new Date(),
        author: {
          name: currentUser.name,
          image: currentUser.image,
        },
        reactions: [],
      };

      queryClient.setQueryData(["idea", idea.id], (old: any) => ({
        ...old,
        comments: [optimisticComment, ...old.comments],
      }));

      return { tempId };
    },
    onSuccess: () => {
      setComment("");
      toast.success("Comment added");
      router.invalidate();
    },
    onError: () => {
      toast.error("Failed to add comment");
      router.invalidate();
    },
  });

  const { mutate: toggleReaction } = useMutation({
    mutationFn: $toggleReaction,
    onMutate: async (newReaction) => {
      // Optimistically update reaction count/state
      queryClient.setQueryData(["idea", idea.id], (old: any) => {
        const hasReacted = old.reactions.some(
          (r: any) => r.userId === currentUser.id && r.type === newReaction.data.type,
        );
        let newReactions = [...old.reactions];

        if (hasReacted) {
          newReactions = newReactions.filter(
            (r: any) =>
              !(r.userId === currentUser.id && r.type === newReaction.data.type),
          );
        } else {
          newReactions.push({
            id: "optimistic-" + Math.random(),
            userId: currentUser.id,
            type: newReaction.data.type,
          });
        }

        return {
          ...old,
          reactions: newReactions,
        };
      });
    },
    onSuccess: () => {
      router.invalidate();
    },
    onError: () => {
      router.invalidate();
    },
  });

  const { mutate: updateStatus } = useMutation({
    mutationFn: $updateIdeaStatus,
    onMutate: async (newData) => {
      queryClient.setQueryData(["idea", idea.id], (old: any) => ({
        ...old,
        status: newData.data.status,
      }));
    },
    onSuccess: () => {
      toast.success("Status updated");
      // Invalidate sidebar counts and ideas list
      if (organizationId) {
        queryClient.invalidateQueries({ queryKey: ["sidebar-counts", organizationId] });
        queryClient.invalidateQueries({ queryKey: ["ideas", "all"] });
      }
      router.invalidate();
    },
    onError: () => {
      toast.error("Failed to update status");
      router.invalidate();
    },
  });

  const { mutate: updateEta } = useMutation({
    mutationFn: $updateIdeaEta,
    onMutate: async (newData) => {
      queryClient.setQueryData(["idea", idea.id], (old: any) => ({
        ...old,
        eta: newData.data.eta ? new Date(newData.data.eta) : null,
      }));
    },
    onSuccess: () => {
      toast.success("ETA updated");
      // Invalidate ideas list (ETA doesn't affect sidebar counts)
      queryClient.invalidateQueries({ queryKey: ["ideas", "all"] });
      router.invalidate();
    },
    onError: () => {
      toast.error("Failed to update ETA");
      router.invalidate();
    },
  });

  const { mutate: deleteIdea, isPending: isDeleting } = useMutation({
    mutationFn: $deleteIdea,
    onSuccess: () => {
      toast.success("Idea deleted");
      // Invalidate sidebar counts and ideas list
      if (organizationId) {
        queryClient.invalidateQueries({ queryKey: ["sidebar-counts", organizationId] });
        queryClient.invalidateQueries({ queryKey: ["ideas", "all"] });
      }
      navigate({ to: ".." });
    },
    onError: () => {
      toast.error("Failed to delete idea");
    },
  });

  const handleDelete = () => {
    if (!organizationId) return;
    if (
      window.confirm(
        "Are you sure you want to delete this idea? This action cannot be undone.",
      )
    ) {
      deleteIdea({ data: { ideaId: idea.id, organizationId } });
    }
  };

  const handleUpdateStatus = (status: string) => {
    if (!organizationId) return;
    updateStatus({ data: { ideaId: idea.id, status, organizationId } });
  };

  const handleUpdateEta = (eta: string | null) => {
    if (!organizationId) return;
    updateEta({ data: { ideaId: idea.id, eta, organizationId } });
  };

  const handleUpvote = () => {
    toggleReaction({ data: { ideaId: idea.id, type: "upvote" } });
  };

  const hasUpvoted = idea.reactions.some(
    (r: any) => r.userId === currentUser.id && r.type === "upvote",
  );

  return (
    <div className="flex h-full flex-col lg:flex-row">
      {/* Main Content */}
      <div className="h-full min-w-0 flex-1 py-6 pr-4 lg:border-r lg:border-b-0">
        <div className="flex items-center justify-between px-8 pb-6">
          <Button
            variant="outline"
            size="icon"
            render={
              <Link to="..">
                <ArrowLeftIcon className="size-4" />
              </Link>
            }
          />

          {organizationId && (
            <Button
              variant="outline"
              size="icon"
              onClick={handleDelete}
              disabled={isDeleting}
              aria-label="Delete idea"
            >
              <Trash2 className="size-4" />
            </Button>
          )}
        </div>
        <div className="mx-auto max-w-4xl px-8">
          <h1 className="text-foreground mb-5 text-xl font-medium">{idea.title}</h1>

          <div className="prose prose-sm text-muted-foreground mb-8 max-w-none text-sm">
            <p>{idea.description || "No description provided."}</p>
          </div>

          <div className="flex w-full items-center justify-end gap-1.5">
            <div
              className={cn(
                "hover:bg-accent flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs transition-colors",
              )}
            >
              <ChatsCircleIcon weight="bold" className="size-4" />
              <span className="mt-px font-mono text-xs">{idea.comments.length}</span>
            </div>

            <button
              onClick={handleUpvote}
              className={cn(
                "hover:bg-accent flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs transition-colors",
              )}
            >
              <HeartIcon
                weight={hasUpvoted ? "fill" : "bold"}
                className={cn("size-4", hasUpvoted && "fill-red-500")}
              />
              <span className="mt-px font-mono text-xs">{idea.reactions.length}</span>
            </button>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="comments" className="flex items-center gap-2">
                Comments
              </TabsTrigger>
              <TabsTrigger value="reactions" className="flex items-center gap-2">
                Reactions
              </TabsTrigger>
            </TabsList>

            <TabsContent value="comments">
              <div className="relative mb-8 flex-1">
                <Textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Write a comment..."
                  className="field-sizing-content min-h-[100px] w-full resize-none"
                />
                <Button
                  size="sm"
                  className="absolute right-2 bottom-2"
                  disabled={!comment.trim() || isCommentPending}
                  onClick={() =>
                    addComment({ data: { ideaId: idea.id, content: comment } })
                  }
                >
                  Comment
                </Button>
              </div>

              <div className="relative">
                <div className="mt-8">
                  {idea.comments.map((comment: any, index: number) => (
                    <div key={comment.id} className="relative flex gap-3 pb-10">
                      {index !== idea.comments.length - 1 && (
                        <div className="bg-border absolute top-10 bottom-2 left-4 w-px" />
                      )}

                      <div className="bg-muted h-8 w-8 shrink-0 overflow-hidden rounded-full">
                        <UserAvatar user={comment.author} />
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold">
                            {comment.author.name}
                          </span>
                          <span className="text-muted-foreground text-xs font-medium">
                            {formatDistanceToNow(new Date(comment.createdAt), {
                              addSuffix: true,
                            })}
                          </span>
                        </div>
                        <p className="text-muted-foreground text-sm">{comment.content}</p>
                      </div>
                    </div>
                  ))}
                  {idea.comments.length === 0 && (
                    <div className="text-muted-foreground py-8 text-center text-sm italic">
                      No comments yet.
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="reactions">
              <div className="mt-8">
                {idea.reactions.length === 0 && (
                  <div className="text-muted-foreground py-8 text-center text-sm italic">
                    No reactions yet.
                  </div>
                )}

                {idea.reactions.map((reaction: any, index: number) => {
                  const userName =
                    reaction.user?.name || reaction.externalUser?.name || "User";
                  const reactionDate = reaction.createdAt
                    ? formatDistanceToNow(new Date(reaction.createdAt), {
                        addSuffix: true,
                      })
                    : null;

                  return (
                    <div
                      key={reaction.id}
                      className="relative flex items-center gap-3 pb-8"
                    >
                      {index !== idea.reactions.length - 1 && (
                        <div className="bg-border absolute top-6 -bottom-3 left-3 z-0 w-px" />
                      )}

                      <div className="relative flex size-6 shrink-0 items-center justify-center rounded-full bg-white">
                        <HeartIcon weight="fill" className="size-3 text-red-500" />
                      </div>

                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-medium">{userName}</span>
                        {reactionDate && (
                          <span className="text-muted-foreground text-xs">
                            {reactionDate}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Sidebar */}
      <div className="w-full space-y-6 px-6 py-8 lg:w-72">
        <div className="text-muted-foreground flex w-full items-center gap-4 text-sm">
          <UserAvatar user={idea.author} />
          <div className="flex flex-col gap-0.5">
            <div className="text-foreground flex items-center gap-2 font-medium">
              <span>{idea.author.name}</span>
            </div>
            <span className="text-xs">
              {formatDistanceToNow(new Date(idea.createdAt), { addSuffix: true })}
            </span>
          </div>
        </div>

        <div>
          <Select value={idea.status} onValueChange={handleUpdateStatus}>
            <SelectTrigger className="w-full" aria-label="Status">
              <SelectValue>
                <StatusPill variant={idea.status as IdeaStatus} />
              </SelectValue>
            </SelectTrigger>
            <SelectContent align="start">
              {STATUS_OPTIONS.map((status) => (
                <SelectItem key={status.slug} value={status.slug}>
                  <StatusPill variant={status.slug as IdeaStatus} />
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <h4 className="text-muted-foreground mb-2 text-xs font-semibold uppercase">
            ETA
          </h4>
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger
                render={
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full shrink justify-start text-left font-normal",
                      !idea.eta && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {idea.eta ? format(new Date(idea.eta), "PPP") : "Select ETA"}
                  </Button>
                }
              />
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={idea.eta ? new Date(idea.eta) : undefined}
                  onSelect={(date) => handleUpdateEta(date ? date.toISOString() : null)}
                />
              </PopoverContent>
            </Popover>
            {idea.eta && (
              <button
                onClick={() => handleUpdateEta(null)}
                className="text-muted-foreground hover:text-foreground hover:bg-accent rounded p-1 transition-colors"
                title="Clear ETA"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {idea.board && (
          <div>
            <h4 className="text-muted-foreground mb-2 text-xs font-semibold uppercase">
              Board
            </h4>
            <span className="text-sm">{idea.board.name}</span>
          </div>
        )}

        {idea.author.revenue !== null && idea.author.revenue !== undefined && (
          <div>
            <h4 className="text-muted-foreground mb-2 text-xs font-semibold uppercase">
              Revenue
            </h4>
            <span className="font-mono text-sm">
              {new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
              }).format(idea.author.revenue)}
            </span>
          </div>
        )}

        {idea.author.metadata &&
          Object.keys(idea.author.metadata as object).length > 0 && (
            <div>
              <h4 className="text-muted-foreground mb-2 text-xs font-semibold uppercase">
                Metadata
              </h4>
              <div className="grid gap-3">
                {Object.entries(idea.author.metadata as object)
                  .filter(
                    ([key, value]) =>
                      value !== undefined && value !== null && typeof value !== "object",
                  )
                  .map(([key, value]) => (
                    <div key={key} className="flex flex-col gap-0.5">
                      <span className="text-muted-foreground text-xs capitalize">
                        {lowerCase(key)}
                      </span>
                      <span
                        className="truncate text-sm font-medium"
                        title={String(value)}
                      >
                        {String(value)}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}

        {idea.tags.length > 0 && (
          <div>
            <h4 className="text-muted-foreground mb-2 text-xs font-semibold uppercase">
              Tags
            </h4>
            <div className="flex flex-wrap gap-2">
              {idea.tags.map((t: any) => (
                <span
                  key={t.tag.id}
                  className="rounded bg-blue-50 px-2 py-1 text-xs font-medium text-blue-600"
                >
                  {t.tag.name}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
