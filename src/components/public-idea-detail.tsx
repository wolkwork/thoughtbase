import { ChatsCircleIcon, HeartIcon } from "@phosphor-icons/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { formatDistanceToNow } from "date-fns";
import { useState } from "react";
import { toast } from "sonner";
import { $createComment, $toggleReaction } from "~/lib/api/ideas";
import { cn } from "~/lib/utils";
import { StatusBadge } from "./status-badge";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";

interface PublicIdeaDetailProps {
  idea: any;
  currentUser: any;
  onLoginRequired?: () => void;
}

// Simplified statuses for public view if needed, but reuse full list for now or read-only
const STATUS_OPTIONS = [
  { slug: "pending", name: "Pending" },
  { slug: "reviewing", name: "Reviewing" },
  { slug: "planned", name: "Planned" },
  { slug: "in_progress", name: "In Progress" },
  { slug: "completed", name: "Completed" },
  { slug: "closed", name: "Closed" },
];

export function PublicIdeaDetail({
  idea,
  currentUser,
  onLoginRequired,
}: PublicIdeaDetailProps) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [comment, setComment] = useState("");

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
        const isExternal = currentUser?.type === "external";
        const hasReacted = old.reactions.some((r: any) => {
          if (isExternal)
            return (
              r.externalUserId === currentUser.id && r.type === newReaction.data.type
            );
          return r.userId === currentUser.id && r.type === newReaction.data.type;
        });

        let newReactions = [...old.reactions];

        if (hasReacted) {
          newReactions = newReactions.filter((r: any) => {
            if (isExternal)
              return !(
                r.externalUserId === currentUser.id && r.type === newReaction.data.type
              );
            return !(r.userId === currentUser.id && r.type === newReaction.data.type);
          });
        } else {
          newReactions.push({
            id: "optimistic-" + Math.random(),
            userId: isExternal ? null : currentUser.id,
            externalUserId: isExternal ? currentUser.id : null,
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

  // We generally don't allow public users to change status unless they are admins,
  // but for this implementation we'll assume read-only status for public detail.

  const handleUpvote = () => {
    if (!currentUser) {
      onLoginRequired?.();
      return;
    }
    toggleReaction({ data: { ideaId: idea.id, type: "upvote" } });
  };

  const handleSubmitComment = () => {
    if (!currentUser) {
      onLoginRequired?.();
      return;
    }
    addComment({ data: { ideaId: idea.id, content: comment } });
  };

  const hasUpvoted =
    currentUser &&
    idea.reactions.some((r: any) => {
      if (currentUser.type === "external") {
        return r.externalUserId === currentUser.id && r.type === "upvote";
      }
      return r.userId === currentUser.id && r.type === "upvote";
    });

  return (
    <div className="flex flex-col lg:flex-row">
      {/* Main Content */}
      <div className="min-w-0 flex-1 border-r py-8 pr-4">
        <h1 className="text-foreground mb-2 text-2xl font-bold">{idea.title}</h1>

        <div className="prose prose-sm text-muted-foreground mb-8 max-w-none text-sm font-medium">
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
            onClick={(e) => handleUpvote()}
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
            disabled={!comment.trim() || isCommentPending || !currentUser}
            onClick={handleSubmitComment}
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
                  {comment.author.image ? (
                    <img
                      src={comment.author.image}
                      alt={comment.author.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="bg-primary/10 text-primary flex h-full w-full items-center justify-center text-[10px]">
                      {comment.author.name.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">{comment.author.name}</span>
                    <span className="text-muted-foreground text-xs font-medium">
                      {formatDistanceToNow(comment.createdAt, { addSuffix: true })}
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
          <Avatar className="size-8">
            <AvatarImage src={idea.author.image} />
            <AvatarFallback>{idea.author.name?.charAt(0) || "?"}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col gap-0.5">
            <div className="text-foreground flex items-center gap-2 font-medium">
              <span>{idea.author.name}</span>
            </div>
            <span className="text-xs">
              {formatDistanceToNow(idea.createdAt, { addSuffix: true })}
            </span>
          </div>
        </div>

        <div>
          <StatusBadge
            status={idea.status}
            className="text-muted-foreground text-sm font-medium"
          />
        </div>

        {idea.board && (
          <div>
            <h4 className="text-muted-foreground mb-2 text-xs font-semibold uppercase">
              Board
            </h4>
            <span className="text-sm">{idea.board.name}</span>
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

        {/* Voting/Action Card similar to public index? Or just details. */}
      </div>
    </div>
  );
}
