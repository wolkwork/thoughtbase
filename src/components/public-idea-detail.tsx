import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { Check, ChevronUp, MessageSquare, Send, ThumbsUp } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { $createComment, $toggleReaction, $updateIdeaStatus } from "~/lib/api/ideas";
import { cn } from "~/lib/utils";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Separator } from "./ui/separator";

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

export function PublicIdeaDetail({ idea, currentUser, onLoginRequired }: PublicIdeaDetailProps) {
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
                if (isExternal) return r.externalUserId === currentUser.id && r.type === newReaction.data.type;
                return r.userId === currentUser.id && r.type === newReaction.data.type;
            });
            
            let newReactions = [...old.reactions];
            
            if (hasReacted) {
                newReactions = newReactions.filter((r: any) => {
                    if (isExternal) return !(r.externalUserId === currentUser.id && r.type === newReaction.data.type);
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
    }
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
  }

  const hasUpvoted = currentUser && idea.reactions.some(
    (r: any) => {
        if (currentUser.type === "external") {
            return r.externalUserId === currentUser.id && r.type === "upvote";
        }
        return r.userId === currentUser.id && r.type === "upvote";
    }
  );

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Main Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-4 mb-6">
          <div className="flex flex-col items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className={cn(
                  "flex flex-col h-14 w-10 rounded-lg gap-1 border-2",
                  hasUpvoted ? "border-primary bg-primary/10 text-primary" : "border-muted"
                )}
                onClick={handleUpvote}
              >
                <ChevronUp className="h-4 w-4" />
                <span className="text-xs font-bold">{idea.reactions.length}</span>
              </Button>
          </div>
          
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground mb-2">{idea.title}</h1>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
               <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-muted overflow-hidden">
                        {idea.author.image ? (
                            <img src={idea.author.image} alt={idea.author.name} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary text-[8px]">
                                {idea.author.name.charAt(0)}
                            </div>
                        )}
                    </div>
                    <span>{idea.author.name}</span>
                </div>
                <span>•</span>
                <span>{new Date(idea.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        <div className="prose prose-sm max-w-none text-foreground mb-8">
          <p>{idea.description || "No description provided."}</p>
        </div>

        <Separator className="mb-6" />

        <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Comments ({idea.comments.length})
            </h3>
            
            <div className="space-y-6 mb-8">
                {idea.comments.map((comment: any) => (
                    <div key={comment.id} className="flex gap-3">
                         <div className="w-8 h-8 rounded-full bg-muted overflow-hidden flex-shrink-0">
                            {comment.author.image ? (
                                <img src={comment.author.image} alt={comment.author.name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary text-[10px]">
                                    {comment.author.name.charAt(0)}
                                </div>
                            )}
                        </div>
                        <div className="flex-1 space-y-1">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-semibold">{comment.author.name}</span>
                                <span className="text-xs text-muted-foreground">{new Date(comment.createdAt).toLocaleDateString()}</span>
                            </div>
                            <p className="text-sm text-muted-foreground">{comment.content}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex gap-3">
                 <div className="w-8 h-8 rounded-full bg-muted overflow-hidden flex-shrink-0 mt-1">
                    {currentUser?.image ? (
                        <img src={currentUser.image} alt={currentUser.name} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary text-[10px]">
                            {currentUser?.name?.charAt(0) || "?"}
                        </div>
                    )}
                </div>
                <div className="flex-1 relative">
                    <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder={currentUser ? "Write a comment..." : "Login to comment..."}
                        disabled={!currentUser}
                        className="w-full min-h-[100px] p-3 pr-10 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none disabled:opacity-60 disabled:cursor-not-allowed"
                    />
                    <Button 
                        size="icon" 
                        className="absolute bottom-2 right-2 h-8 w-8" 
                        disabled={!comment.trim() || isCommentPending || !currentUser}
                        onClick={handleSubmitComment}
                    >
                        <Send className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
      </div>

      {/* Sidebar */}
      <div className="w-full lg:w-72 space-y-6">
         <div className="rounded-lg border bg-card p-4 shadow-sm space-y-4">
            <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Status</h4>
                {/* Read-only status for public view */}
                <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80 uppercase">
                    {idea.status.replace("_", " ")}
                </div>
            </div>
            
            {idea.board && (
                <div>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Board</h4>
                    <span className="text-sm">{idea.board.name}</span>
                </div>
            )}

            {idea.tags.length > 0 && (
                 <div>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Tags</h4>
                    <div className="flex flex-wrap gap-2">
                        {idea.tags.map((t: any) => (
                            <span key={t.tag.id} className="text-xs px-2 py-1 rounded bg-blue-50 text-blue-600 font-medium">
                                {t.tag.name}
                            </span>
                        ))}
                    </div>
                </div>
            )}
         </div>
         
         {/* Voting/Action Card similar to public index? Or just details. */}
      </div>
    </div>
  );
}
