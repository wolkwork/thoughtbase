import { useConvexMutation } from "@convex-dev/react-query";
import { ChatsCircleIcon, HeartIcon } from "@phosphor-icons/react";
import { useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { api } from "@thoughtbase/backend/convex/_generated/api";
import { FunctionReturnType } from "convex/server";
import { format, formatDistanceToNow } from "date-fns";
import { lowerCase } from "lodash";
import { ArrowLeftIcon, CalendarIcon, Trash2, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { usePermissions } from "~/hooks/use-permissions";
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";
import { UserAvatar } from "./user-avatar";

interface IdeaDetailProps {
  idea: NonNullable<FunctionReturnType<typeof api.ideas.getIdea>>;
  currentUser: NonNullable<FunctionReturnType<typeof api.auth.getSafeCurrentUser>>;
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

export function IdeaDetail({ idea, currentUser, organizationId }: IdeaDetailProps) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [comment, setComment] = useState("");
  const [activeTab, setActiveTab] = useState("comments");
  const canWrite = usePermissions().canWrite();

  const createComment = useConvexMutation(api.ideas.createComment);
  const [isCommentPending, setIsCommentPending] = useState(false);

  const handleAddComment = async () => {
    if (!comment.trim()) return;

    setIsCommentPending(true);
    try {
      const newComment = await createComment({
        ideaId: idea.id as any, // Convert string to Id<"idea">
        content: comment,
      });

      // Optimistic update
      const optimisticComment = {
        id: String(newComment.id),
        content: newComment.content,
        createdAt: new Date(newComment.createdAt),
        author: {
          name: currentUser.name,
          email: currentUser.email,
          image: currentUser.image,
        },
        reactions: [],
      };

      // Optimistic update - add the comment to the query cache
      queryClient.setQueryData(
        [api.ideas.getIdea, { ideaId: idea.id as any }],
        (old: any) => {
          if (!old) return old;
          return {
            ...old,
            comments: [optimisticComment, ...(old.comments || [])],
          };
        },
      );

      setComment("");
      toast.success("Comment added");
    } catch (error) {
      console.error("Failed to add comment:", error);
      toast.error("Failed to add comment");
    } finally {
      setIsCommentPending(false);
    }
  };

  const toggleReaction = useConvexMutation(api.ideas.toggleReaction);

  const updateStatus = useConvexMutation(api.ideas.updateIdeaStatus);
  const updateEta = useConvexMutation(api.ideas.updateIdeaEta);

  const deleteIdea = useConvexMutation(api.ideas.deleteIdea);

  const handleDelete = async () => {
    if (!organizationId) return;
    if (
      window.confirm(
        "Are you sure you want to delete this idea? This action cannot be undone.",
      )
    ) {
      await deleteIdea({ ideaId: idea.id, organizationId });
      navigate({ to: ".." });
    }
  };

  const handleUpdateStatus = (status: string | null) => {
    if (!organizationId) return;
    updateStatus({ ideaId: idea.id, status: status as IdeaStatus, organizationId });
  };

  const handleUpdateEta = (eta: number | undefined) => {
    if (!organizationId || !eta) return;
    updateEta({ ideaId: idea.id, eta, organizationId });
  };

  const handleUpvote = () => {
    toggleReaction({ ideaId: idea.id, type: "upvote" });
  };

  const hasUpvoted = idea.reactions.some(
    (r) => r.userId === currentUser._id && r.type === "upvote",
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
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleDelete}
                      disabled={!canWrite}
                      aria-label="Delete idea"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  }
                />

                {!canWrite && (
                  <TooltipContent>
                    <p>Upgrade to delete ideas</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
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
              {canWrite ? (
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
                    onClick={() => handleAddComment()}
                  >
                    Comment
                  </Button>
                </div>
              ) : (
                <div className="bg-muted/50 text-muted-foreground mb-8 rounded-lg border border-dashed p-4 text-center text-sm">
                  Upgrade to add comments
                </div>
              )}

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
              <span>{idea.author?.name || "Unknown"}</span>
            </div>
            <span className="text-xs">
              {formatDistanceToNow(new Date(idea.createdAt), { addSuffix: true })}
            </span>
          </div>
        </div>

        <div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger
                render={
                  <Select
                    value={idea.status}
                    onValueChange={handleUpdateStatus}
                    disabled={!canWrite}
                  >
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
                }
              />
              {!canWrite && (
                <TooltipContent>
                  <p>Upgrade to change idea status</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        </div>

        <div>
          <h4 className="text-muted-foreground mb-2 text-xs font-semibold uppercase">
            ETA
          </h4>
          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Popover>
                      <PopoverTrigger
                        render={
                          <Button
                            variant="outline"
                            disabled={!canWrite}
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
                      <PopoverContent align="start">
                        <Calendar
                          mode="single"
                          selected={idea.eta ? new Date(idea.eta) : undefined}
                          onSelect={(date) =>
                            canWrite
                              ? handleUpdateEta(date ? date.getTime() : undefined)
                              : undefined
                          }
                        />
                      </PopoverContent>
                    </Popover>
                  }
                />
                {!canWrite && (
                  <TooltipContent>
                    <p>Upgrade to set ETA</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
            {idea.eta && canWrite && (
              <button
                onClick={() => handleUpdateEta(undefined)}
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

        {typeof idea.author?.revenue === "number" && (
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

        {idea.author?.metadata &&
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
