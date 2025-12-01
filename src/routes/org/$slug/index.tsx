import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useLoaderData, useRouter } from "@tanstack/react-router";
import { MessageSquare, Search, ThumbsUp } from "lucide-react";
import { useState } from "react";
import { AuthForm } from "~/components/auth-form";
import { CreateIdeaDialog } from "~/components/create-idea-dialog";
import { ProfileForm } from "~/components/profile-form";
import { PublicHeader } from "~/components/public-header";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { $getIdeas, $getPublicCounts, $toggleReaction } from "~/lib/api/ideas";
import { cn } from "~/lib/utils";

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

  const { data: ideas } = useQuery({
    queryKey: ["public-ideas", org.id],
    queryFn: () => $getIdeas({ data: { organizationId: org.id } }),
  });
  
  const { data: counts } = useQuery({
      queryKey: ["public-counts", org.id],
      queryFn: () => $getPublicCounts({ data: { organizationId: org.id } })
  })

  const { mutate: toggleReaction } = useMutation({
    mutationFn: $toggleReaction,
    onMutate: async (newReaction) => {
        // Optimistic update for list
        queryClient.setQueryData(["public-ideas", org.id], (old: any[]) => {
            if (!old) return old;
            return old.map(idea => {
                if (idea.id !== newReaction.data.ideaId) return idea;
                
                const isExternal = user?.type === "external";
                const hasReacted = idea.reactions.some((r: any) => {
                    if (isExternal) return r.externalUserId === user?.id && r.type === "upvote";
                    return r.userId === user?.id && r.type === "upvote";
                });

                let newReactions = [...idea.reactions];
                
                if (hasReacted) {
                    newReactions = newReactions.filter((r: any) => {
                        if (isExternal) return !(r.externalUserId === user?.id && r.type === "upvote");
                        return !(r.userId === user?.id && r.type === "upvote");
                    });
                } else {
                    newReactions.push({
                        id: "optimistic-" + Math.random(),
                        userId: isExternal ? null : user?.id,
                        externalUserId: isExternal ? user?.id : null,
                        type: "upvote",
                    });
                }
                
                return {
                    ...idea,
                    reactions: newReactions,
                    reactionCount: newReactions.length
                };
            });
        });
    },
    onSuccess: () => {
        router.invalidate();
    },
    onError: () => {
        router.invalidate();
    }
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
  }

  const totalCount = counts ? counts.reduce((acc, curr) => acc + curr.count, 0) : 0;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <PublicHeader org={org} user={user} />

      <div className="container mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
           <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
               <div className="flex items-center gap-2">
                   <h1 className="text-2xl font-bold">All Feedback</h1>
                   <span className="text-muted-foreground">▼</span>
               </div>
               
               <div className="flex items-center gap-3">
                   <Button variant="outline" className="gap-2">
                       <span>Top</span>
                       <span>▼</span>
                   </Button>
                   <Button variant="outline" size="icon">
                       <Search className="h-4 w-4" />
                   </Button>
               </div>
           </div>

           <div className="space-y-4">
               {ideas?.map((idea) => {
                   const isExternal = user?.type === "external";
                   const hasReacted = user && idea.reactions.some((r: any) => {
                       if (isExternal) return r.externalUserId === user.id && r.type === "upvote";
                       return r.userId === user.id && r.type === "upvote";
                   });
                   
                   return (
                   <Link 
                     key={idea.id} 
                     to="/org/$slug/$ideaId"
                     params={{ slug: org.slug, ideaId: idea.id }} // Fixed: Added slug to params
                     className="block"
                   >
                   <div className="flex items-start gap-4 p-6 rounded-xl border bg-card hover:border-primary/50 transition-colors group">
                        <div className="flex flex-col items-center justify-center w-12 h-12 rounded-lg bg-muted/50">
                             {idea.author.image ? (
                                <img src={idea.author.image} alt={idea.author.name} className="w-full h-full object-cover rounded-lg" />
                             ) : (
                                <span className="text-lg font-bold">{idea.author.name.charAt(0)}</span>
                             )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-semibold mb-1 group-hover:text-primary transition-colors">{idea.title}</h3>
                            <p className="text-muted-foreground mb-3 line-clamp-2">{idea.description}</p>
                            
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                 <div className="flex items-center gap-2 font-medium text-foreground">
                                     <span>{idea.author.name}</span>
                                 </div>
                                 <span>•</span>
                                 <span>{new Date(idea.createdAt).toLocaleDateString()}</span>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                             <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-orange-50 text-orange-600 font-medium text-sm border border-orange-100">
                                 <span className="w-2 h-2 rounded-full bg-orange-500" />
                             </div>
                             
                             <div className="flex items-center gap-1 px-3 py-1.5 rounded-md border bg-background text-muted-foreground">
                                 <MessageSquare className="w-4 h-4" />
                                 <span>{idea.commentCount}</span>
                             </div>

                             <button 
                                onClick={(e) => handleUpvote(e, idea)}
                                className={cn(
                                    "flex items-center gap-1 px-3 py-1.5 rounded-md border transition-colors hover:bg-accent",
                                    hasReacted ? "bg-primary/10 border-primary text-primary" : "bg-background text-muted-foreground"
                                )}
                             >
                                 <ThumbsUp className={cn("w-4 h-4", hasReacted && "fill-current")} />
                                 <span>{idea.reactionCount}</span>
                             </button>
                        </div>
                   </div>
                   </Link>
               )})}
               
               {ideas?.length === 0 && (
                   <div className="text-center py-12 text-muted-foreground">
                       No feedback yet. Be the first to submit!
                   </div>
               )}
           </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
           <div className="rounded-xl border bg-card p-6 space-y-4">
               <div className="flex items-center gap-3">
                   <div className="w-5 h-5 text-muted-foreground">
                       {/* Lightbulb icon */}
                       <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-lightbulb"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-1 1.5-2 1.5-3.5A6 6 0 0 0 6 8c0 1 .5 2 1.5 3.5.8.8 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>
                   </div>
                   <h3 className="font-semibold">Got an idea?</h3>
               </div>
               
               <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white" onClick={handleSubmitClick}>
                   Submit a Post
               </Button>
           </div>

           <div className="rounded-xl border bg-card p-6 space-y-4">
               <div className="flex items-center gap-3 mb-2">
                    <div className="w-5 h-5 text-muted-foreground">
                         {/* Board icon */}
                         <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-clipboard-list"><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/></svg>
                    </div>
                   <h3 className="font-semibold">Boards</h3>
               </div>

               <div className="space-y-1">
                   <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-muted/50 font-medium text-sm">
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-gray-400" />
                            <span>All Feedback</span>
                        </div>
                        <span className="px-2 py-0.5 rounded-md bg-background text-xs">{totalCount}</span>
                   </div>
                   {/* We could list specific boards or statuses here, matching screenshot */}
                   {counts?.map((board) => {
                       if (!board.id) return null;
                       return (
                       <div key={board.id} className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-muted/30 transition-colors text-sm">
                           <div className="flex items-center gap-2">
                               <span className="w-2 h-2 rounded-full bg-blue-500" />
                               <span className="capitalize">{board.name}</span>
                           </div>
                           <span className="px-2 py-0.5 rounded-md bg-muted text-xs">{board.count}</span>
                       </div>
                   )})}
               </div>
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
    </div>
  );
}
