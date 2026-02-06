import { convexQuery, useConvexMutation } from "@convex-dev/react-query";
import { ChatsCircleIcon, HeartIcon } from "@phosphor-icons/react";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { useLoaderData } from "@tanstack/react-router";
import { api } from "@thoughtbase/backend/convex/_generated/api";
import { FunctionReturnType } from "convex/server";
import { format, formatDistanceToNow } from "date-fns";
import { PencilIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { usePermissionsPublic } from "~/hooks/use-permissions-public";
import { cn } from "~/lib/utils";
import { StatusBadge } from "./status-badge";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { UserAvatar } from "./user-avatar";

interface PublicIdeaDetailProps {
  idea: NonNullable<FunctionReturnType<typeof api.ideas.getIdeaPublic>>;
  currentUser: FunctionReturnType<typeof api.auth.getUnifiedUser>;
  organizationId?: string;
  onLoginRequired?: () => void;
}

export function PublicIdeaDetail({
  idea,
  currentUser,
  onLoginRequired,
}: PublicIdeaDetailProps) {
  const [comment, setComment] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(idea.title);
  const [editDescription, setEditDescription] = useState(idea.description || "");
  const canWrite = usePermissionsPublic().canWrite();

  // Check if current user is the author (internal or external)
  const isAuthor = currentUser && idea.authorId === currentUser._id;

  const addComment = useConvexMutation(api.ideas.createComment);

  const toggleReactionMutation = useConvexMutation(api.ideas.toggleReaction);

  const updateIdea = useConvexMutation(api.ideas.updateIdea);

  const { sessionId } = useLoaderData({ from: "/subdomain/$slug" });

  const { data: comments } = useSuspenseQuery(
    convexQuery(api.ideas.getCommentsByIdea, {
      ideaId: idea._id,
    }),
  );

  const { data: reactions } = useSuspenseQuery(
    convexQuery(api.ideas.getReactionsByIdea, {
      ideaId: idea._id,
    }),
  );

  const { data: tags } = useSuspenseQuery(
    convexQuery(api.ideas.getTagsByIdea, {
      ideaId: idea._id,
    }),
  );

  const handleSaveEdit = async () => {
    if (!editTitle.trim()) {
      toast.error("Title is required");
      return;
    }

    await updateIdea({
      ideaId: idea._id,
      title: editTitle,
      description: editDescription,
      sessionId,
    });

    setIsEditing(false);
    toast.success("Idea updated");
  };

  const handleCancelEdit = () => {
    setEditTitle(idea.title);
    setEditDescription(idea.description || "");
    setIsEditing(false);
  };

  const handleUpvote = () => {
    if (!currentUser) {
      onLoginRequired?.();
      return;
    }
    if (!canWrite) {
      toast.error("Your trial has ended. Upgrade to interact with ideas.");
      return;
    }
    toggleReactionMutation({ ideaId: idea._id, type: "upvote", sessionId });
  };

  const handleSubmitComment = async () => {
    if (!currentUser) {
      onLoginRequired?.();
      return;
    }

    try {
      await addComment({
        ideaId: idea._id,
        content: comment,
        sessionId,
      });
      setComment("");
    } catch (error) {
      toast.error("Failed to add comment");
    }
  };

  const { data: hasUpvoted } = useQuery(
    convexQuery(api.ideas.hasUserUpvotedIdea, {
      ideaId: idea._id,
      sessionId,
    }),
  );

  return (
    <div className="flex flex-1 flex-col lg:flex-row">
      {/* Main Content */}
      <div className="min-w-0 flex-1 border-r py-8 pr-4">
        {isEditing ? (
          <div className="mb-8 space-y-4">
            <Input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              placeholder="Idea title"
              className="text-lg font-bold"
              autoFocus
            />
            <Textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              placeholder="Idea description"
              className="field-sizing-content min-h-[100px] resize-none"
            />
            <div className="flex items-center gap-1.5">
              <Button size="sm" onClick={handleSaveEdit} disabled={!editTitle.trim()}>
                Save
              </Button>
              <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-2 flex items-center gap-2">
              <h1 className="text-foreground text-2xl font-bold">{idea.title}</h1>
              {isAuthor && canWrite && (
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setIsEditing(true)}
                        className="ml-auto size-7"
                      >
                        <PencilIcon className="size-3.5" />
                      </Button>
                    }
                  />
                  <TooltipContent>Edit idea</TooltipContent>
                </Tooltip>
              )}
            </div>

            <div className="prose prose-sm text-muted-foreground mb-8 max-w-none text-sm font-medium">
              <p>{idea.description || "No description provided."}</p>
            </div>
          </>
        )}

        <div className="flex w-full items-center justify-end gap-1.5">
          <div
            className={cn(
              "hover:bg-accent flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs transition-colors",
            )}
          >
            <ChatsCircleIcon weight="bold" className="size-4" />
            <span className="mt-px font-mono text-xs">{comments.length}</span>
          </div>

          <button
            onClick={handleUpvote}
            disabled={!canWrite}
            className={cn(
              "flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs transition-colors",
              canWrite ? "hover:bg-accent" : "cursor-not-allowed",
            )}
          >
            <HeartIcon
              weight={hasUpvoted ? "fill" : "bold"}
              className={cn("size-4", hasUpvoted && "fill-red-500")}
            />
            <span className="mt-px font-mono text-xs">{reactions.length}</span>
          </button>
        </div>

        {canWrite ? (
          <div className="relative mt-8 flex-1">
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={currentUser ? "Write a comment..." : "Login to comment..."}
              disabled={!currentUser}
              className="field-sizing-content min-h-[100px] w-full resize-none"
            />
            <Button
              size="sm"
              className="absolute right-2 bottom-2"
              disabled={!comment.trim() || !currentUser}
              onClick={handleSubmitComment}
            >
              Comment
            </Button>
          </div>
        ) : null}

        <div className="relative">
          <div className="mt-8">
            {comments.map((comment, index) => (
              <div key={comment._id} className="relative flex gap-3 pb-10">
                {index !== comments.length - 1 && (
                  <div className="bg-border absolute top-10 bottom-2 left-4 w-px" />
                )}

                <div className="bg-muted h-8 w-8 shrink-0 overflow-hidden rounded-full">
                  <UserAvatar user={comment.author} />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">{comment.author?.name}</span>
                    <span className="text-muted-foreground text-xs font-medium">
                      {formatDistanceToNow(comment._creationTime, { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-muted-foreground text-sm">{comment.content}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div className="w-full space-y-6 px-4 py-8 lg:w-72">
        <div className="text-muted-foreground flex w-full items-center gap-4 text-sm">
          <UserAvatar user={idea.author} />
          <div className="flex flex-col gap-0.5">
            <div className="text-foreground flex items-center gap-2 font-medium">
              <span>{idea.author?.name || "Unknown"}</span>
            </div>
            <span className="text-xs">
              {formatDistanceToNow(idea._creationTime, { addSuffix: true })}
            </span>
          </div>
        </div>

        <div>
          <StatusBadge
            status={idea.status}
            className="text-muted-foreground text-sm font-medium"
          />
        </div>

        {idea.eta && (
          <div>
            <h4 className="text-muted-foreground mb-2 text-xs font-semibold uppercase">
              ETA
            </h4>
            <span className="text-sm">{format(new Date(idea.eta), "MMMM d, yyyy")}</span>
          </div>
        )}

        {tags.length > 0 && (
          <div>
            <h4 className="text-muted-foreground mb-2 text-xs font-semibold uppercase">
              Tags
            </h4>
            <div className="flex flex-wrap gap-2">
              {tags.map((t) => (
                <span
                  key={t._id}
                  className="rounded bg-blue-50 px-2 py-1 text-xs font-medium text-blue-600"
                >
                  {t.name}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
