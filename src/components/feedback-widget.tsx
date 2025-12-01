import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ChevronRight,
  Gift,
  Map as MapIcon,
  MessageSquare,
  X,
} from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { $createIdea, $getIdeas } from "~/lib/api/ideas";
import { $signInWithSSO } from "~/lib/api/sso";
import { cn } from "~/lib/utils";
import { authClient } from "~/lib/auth/auth-client";

interface FeedbackWidgetProps {
  organizationId: string;
  isOpen: boolean;
  onClose: () => void;
  ssoToken?: string;
}

type Tab = "feedback" | "roadmap" | "updates";

export function FeedbackWidget({
  organizationId,
  isOpen,
  onClose,
  ssoToken,
}: FeedbackWidgetProps) {
  const [activeTab, setActiveTab] = useState<Tab>("feedback");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const queryClient = useQueryClient();
  
  const { data: session, refetch: refetchSession } = authClient.useSession();

  useEffect(() => {
    const loginWithSSO = async () => {
      if (ssoToken && !session?.user) {
        try {
          await $signInWithSSO({ data: { token: ssoToken, organizationId } });
          await refetchSession();
          toast.success("Automatically logged in via SSO");
        } catch (e) {
          console.error("SSO Login failed", e);
        }
      }
    };
    
    if (isOpen) {
        loginWithSSO();
    }
  }, [isOpen, ssoToken, session?.user, refetchSession, organizationId]);

  const { data: ideas } = useQuery({
    queryKey: ["widget-ideas", organizationId],
    queryFn: () => $getIdeas({ data: { organizationId } }),
    enabled: isOpen && activeTab === "roadmap",
  });

  const { mutate: createIdea, isPending } = useMutation({
    mutationFn: $createIdea,
    onSuccess: () => {
      toast.success("Feedback submitted!");
      setTitle("");
      setDescription("");
      // Optionally switch to roadmap or close? 
      // For now, just clear form.
    },
    onError: () => {
      toast.error("Failed to submit feedback");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createIdea({
      data: {
        title,
        description,
        organizationId,
      },
    });
  };

  if (!isOpen) return null;

  const inProgressIdeas = ideas?.filter((i) => i.status === "in_progress") || [];
  const plannedIdeas = ideas?.filter((i) => i.status === "planned") || [];

  return (
    <div className="fixed bottom-4 right-4 z-50 flex h-[600px] w-[380px] flex-col rounded-2xl border bg-background shadow-2xl animate-in slide-in-from-bottom-4 fade-in duration-200">
      {/* Header */}
      <div className="flex items-center justify-end p-4">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-full hover:bg-muted"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 pb-6">
        {activeTab === "feedback" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold">Submit Feedback</h2>
              <p className="text-muted-foreground">
                Share your ideas and suggestions
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Textarea
                placeholder="Type here..."
                value={description} // Using description as main input based on design "Type here..."
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-[150px] resize-none border-none bg-transparent p-0 text-base placeholder:text-muted-foreground focus-visible:ring-0"
                required
              />
              
              <Input 
                 placeholder="Title (optional)"
                 value={title}
                 onChange={(e) => setTitle(e.target.value)}
                 className="border-none bg-muted/50 px-3" 
              />
              <p className="text-xs text-muted-foreground">Title is required by backend currently, user can fill it or we auto-fill.</p>

              <div className="flex justify-start pt-4">
                 {/* Upload image icon placeholder */}
                 <Button variant="outline" size="icon" className="h-10 w-10 rounded-full text-muted-foreground" type="button">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-image"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                 </Button>
              </div>
              
              <div className="pt-2">
                  <Button type="submit" className="w-full" disabled={isPending || !description}>
                      {isPending ? "Sending..." : "Send Feedback"}
                  </Button>
              </div>
            </form>
          </div>
        )}

        {activeTab === "roadmap" && (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold">Coming Soon</h2>
              <p className="text-muted-foreground">
                See what we're working on
              </p>
            </div>

            <div className="space-y-6">
              {inProgressIdeas.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    In Progress
                  </h3>
                  <div className="space-y-6 relative pl-4 border-l-2 border-dashed border-muted">
                    {inProgressIdeas.map((idea) => (
                      <div key={idea.id} className="relative group cursor-pointer">
                        <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full border-2 border-background bg-foreground ring-1 ring-muted" />
                        
                        <a 
                            href={`/org/${idea.organization?.slug || 'unknown'}/${idea.id}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="block space-y-1"
                        >
                            <h4 className="font-medium leading-none group-hover:underline">{idea.title}</h4>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                                {idea.description}
                            </p>
                            <div className="flex items-center gap-3 pt-1">
                                <span className="text-xs font-bold text-purple-600 uppercase">
                                In Progress
                                </span>
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <span className="text-red-500">♥</span> {idea.reactionCount}
                                </div>
                            </div>
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {plannedIdeas.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Planned
                  </h3>
                  <div className="space-y-6 relative pl-4 border-l-2 border-dashed border-muted">
                    {plannedIdeas.map((idea) => (
                      <div key={idea.id} className="relative group cursor-pointer">
                        <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full border-2 border-background bg-muted-foreground ring-1 ring-muted" />
                        
                        <a 
                            href={`/org/${idea.organization?.slug || 'unknown'}/${idea.id}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="block space-y-1"
                        >
                            <h4 className="font-medium leading-none group-hover:underline">{idea.title}</h4>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                                {idea.description}
                            </p>
                            <div className="flex items-center gap-3 pt-1">
                                <span className="text-xs font-bold text-blue-600 uppercase">
                                Planned
                                </span>
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <span className="text-red-500">♥</span> {idea.reactionCount}
                                </div>
                            </div>
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {inProgressIdeas.length === 0 && plannedIdeas.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                      Nothing on the roadmap yet.
                  </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "updates" && (
            <div className="space-y-6">
                <div>
                    <h2 className="text-2xl font-bold">Updates</h2>
                    <p className="text-muted-foreground">Latest changelog</p>
                </div>
                <div className="text-center py-12 text-muted-foreground">
                    No updates yet.
                </div>
            </div>
        )}
      </div>

      {/* Footer Tabs */}
      <div className="border-t bg-muted/20 p-2">
        <div className="flex justify-around">
          <button
            onClick={() => setActiveTab("feedback")}
            className={cn(
              "flex flex-col items-center gap-1 rounded-lg p-2 text-xs font-medium transition-colors hover:bg-muted",
              activeTab === "feedback"
                ? "text-foreground"
                : "text-muted-foreground"
            )}
          >
            <MessageSquare className="h-5 w-5" />
            Feedback
          </button>
          <button
            onClick={() => setActiveTab("roadmap")}
            className={cn(
              "flex flex-col items-center gap-1 rounded-lg p-2 text-xs font-medium transition-colors hover:bg-muted",
              activeTab === "roadmap"
                ? "text-foreground"
                : "text-muted-foreground"
            )}
          >
            <MapIcon className="h-5 w-5" />
            Roadmap
          </button>
          <button
            onClick={() => setActiveTab("updates")}
            className={cn(
              "flex flex-col items-center gap-1 rounded-lg p-2 text-xs font-medium transition-colors hover:bg-muted",
              activeTab === "updates"
                ? "text-foreground"
                : "text-muted-foreground"
            )}
          >
            <Gift className="h-5 w-5" />
            Updates
          </button>
        </div>
      </div>
    </div>
  );
}
