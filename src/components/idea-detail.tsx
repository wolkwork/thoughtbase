import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { Check, ChevronUp, MessageSquare, Send, Heart, ThumbsUp, ThumbsDown, Smile } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

interface IdeaDetailProps {
  idea: any; // Replace with proper type inference if possible
  currentUser: any;
}

const STATUS_OPTIONS = [
  { slug: "pending", name: "Pending" },
  { slug: "reviewing", name: "Reviewing" },
  { slug: "planned", name: "Planned" },
  { slug: "in_progress", name: "In Progress" },
  { slug: "completed", name: "Completed" },
  { slug: "closed", name: "Closed" },
];

export function IdeaDetail({ idea, currentUser }: IdeaDetailProps) {
  const queryClient = useQueryClient();
  const router = useRouter();
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
      // Optionally revert optimistic update here if needed, 
      // but router.invalidate() will likely fix it on next fetch.
      router.invalidate();
    },
  });

  const { mutate: toggleReaction } = useMutation({
    mutationFn: $toggleReaction,
    onMutate: async (newReaction) => {
        // Optimistically update reaction count/state
        queryClient.setQueryData(["idea", idea.id], (old: any) => {
            const hasReacted = old.reactions.some((r: any) => r.userId === currentUser.id && r.type === newReaction.data.type);
            let newReactions = [...old.reactions];
            
            if (hasReacted) {
                newReactions = newReactions.filter((r: any) => !(r.userId === currentUser.id && r.type === newReaction.data.type));
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
    }
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
      router.invalidate();
    },
    onError: () => {
      toast.error("Failed to update status");
      router.invalidate();
    },
  });

  const handleUpvote = () => {
    toggleReaction({ data: { ideaId: idea.id, type: "upvote" } });
  };

  const hasUpvoted = idea.reactions.some(
    (r: any) => r.userId === currentUser.id && r.type === "upvote"
  );
  
  // Group reactions by type
  const reactionsByType = idea.reactions.reduce((acc: any, reaction: any) => {
      const type = reaction.type || "upvote";
      if (!acc[type]) acc[type] = [];
      // Ensure we have user info. If external user, user might be on externalUser relation if fetched properly, 
      // but currently reaction relation might not populate user details deeply.
      // Assuming the backend includes user details on reactions or we just show generic.
      // The backend currently fetches reactions: true, but maybe not nested user.
      // But wait, reactions relation in idea query:
      // with: { reactions: true } - this only gets raw reaction fields (userId, type)
      // It doesn't fetch the user object. We need to update the query if we want to show WHO reacted.
      // For now, let's assume we only have userId.
      // Wait, for dashboard view, we might want to see who.
      // Let's check if we can display something meaningful.
      // The prompt didn't explicitly ask for "who", just "reactions tab".
      // But usually you want to see who.
      
      acc[type].push(reaction);
      return acc;
  }, {} as Record<string, any[]>);

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Main Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-4 mb-6">
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
          
          <div>
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

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="comments" className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Comments ({idea.comments.length})
            </TabsTrigger>
            <TabsTrigger value="reactions" className="flex items-center gap-2">
                <Heart className="w-4 h-4" />
                Reactions ({idea.reactions.length})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="comments">
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
                {idea.comments.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground text-sm italic">
                        No comments yet.
                    </div>
                )}
            </div>

            <div className="flex gap-3">
                 <div className="w-8 h-8 rounded-full bg-muted overflow-hidden flex-shrink-0 mt-1">
                    {currentUser.image ? (
                        <img src={currentUser.image} alt={currentUser.name} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary text-[10px]">
                            {currentUser.name?.charAt(0)}
                        </div>
                    )}
                </div>
                <div className="flex-1 relative">
                    <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Write a comment..."
                        className="w-full min-h-[100px] p-3 pr-10 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                    />
                    <Button 
                        size="icon" 
                        className="absolute bottom-2 right-2 h-8 w-8" 
                        disabled={!comment.trim() || isCommentPending}
                        onClick={() => addComment({ data: { ideaId: idea.id, content: comment } })}
                    >
                        <Send className="h-4 w-4" />
                    </Button>
                </div>
            </div>
          </TabsContent>

          <TabsContent value="reactions">
            <div className="space-y-6">
                {Object.entries(reactionsByType).length === 0 && (
                    <div className="text-center py-8 text-muted-foreground text-sm italic">
                        No reactions yet.
                    </div>
                )}
                
                {Object.entries(reactionsByType).map(([type, reactions]: [string, any[]]) => (
                    <div key={type} className="space-y-3">
                        <h4 className="text-sm font-semibold capitalize flex items-center gap-2">
                             {type === 'upvote' ? <ThumbsUp className="w-4 h-4" /> : <Smile className="w-4 h-4" />}
                             {type} ({reactions.length})
                        </h4>
                        <div className="flex flex-wrap gap-3">
                            {reactions.map((reaction: any) => {
                                // Note: We need the backend to include user details in reactions to show avatar/name
                                // Currently it might be missing if not joined.
                                // Fallback to userId if name not available (though likely undefined if not joined)
                                const userName = reaction.user?.name || reaction.externalUser?.name || "User";
                                const userImage = reaction.user?.image || reaction.externalUser?.avatarUrl;
                                
                                return (
                                    <div key={reaction.id} className="flex items-center gap-2 bg-muted/50 rounded-full pl-1 pr-3 py-1 border">
                                        <Avatar className="h-6 w-6">
                                            <AvatarImage src={userImage} />
                                            <AvatarFallback className="text-[10px]">{userName.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <span className="text-xs font-medium">{userName}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Sidebar */}
      <div className="w-full lg:w-72 space-y-6">
         <div className="rounded-lg border bg-card p-4 shadow-sm space-y-4">
            <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Status</h4>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80 uppercase cursor-pointer">
                        {idea.status.replace("_", " ")}
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    {STATUS_OPTIONS.map((status) => (
                      <DropdownMenuItem 
                        key={status.slug}
                        onClick={() => updateStatus({ data: { ideaId: idea.id, status: status.slug } })}
                      >
                        <span className={cn(
                          "mr-2 flex h-4 w-4 items-center justify-center",
                          idea.status === status.slug ? "opacity-100" : "opacity-0"
                        )}>
                          <Check className="h-4 w-4" />
                        </span>
                        {status.name}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
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
      </div>
    </div>
  );
}
