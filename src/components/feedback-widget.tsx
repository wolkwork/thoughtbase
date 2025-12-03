import { HeartIcon } from "@phosphor-icons/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Clock8, Gift, Map as MapIcon, MessageCircleHeart, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { $createIdea, $getIdeas } from "~/lib/api/ideas";
import { $signInWithSSO } from "~/lib/api/sso";
import { authClient } from "~/lib/auth/auth-client";
import { cn } from "~/lib/utils";

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
    <div className="bg-background animate-in slide-in-from-bottom-4 fade-in fixed top-4 right-4 bottom-4 z-50 flex w-[380px] flex-col overflow-hidden rounded-2xl border shadow-2xl duration-100">
      {/* Content */}
      <div className="flex flex-1 grow flex-col overflow-hidden">
        <div className="flex items-center justify-end px-4 py-4">
          <Button variant="outline" size="icon" className="size-7" onClick={onClose}>
            <X />
          </Button>
        </div>

        {activeTab === "feedback" && (
          <div className="flex flex-1 flex-col gap-8">
            <div className="border-b px-6 pb-6">
              <h2 className="text-2xl font-bold">Submit Idea</h2>
              <p className="text-muted-foreground">Share your ideas or suggestions</p>
            </div>

            <form
              onSubmit={handleSubmit}
              className="flex flex-1 flex-col gap-8 px-6 pb-6"
            >
              <textarea
                placeholder="Type your idea here..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="placeholder:text-muted-foreground field-sizing-content w-full resize-none text-base outline-none md:text-sm"
                required
              />

              {description.length > 0 && (
                <div className="animate-in fade-in mt-auto pt-2 duration-200">
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isPending || !description}
                  >
                    {isPending ? "Sending..." : "Submit Idea"}
                  </Button>
                </div>
              )}
            </form>
          </div>
        )}

        {activeTab === "roadmap" && (
          <div className="flex flex-col overflow-hidden">
            <div className="border-b px-6 pb-6">
              <h2 className="text-2xl font-bold">Coming Soon</h2>
              <p className="text-muted-foreground">See what we're working on</p>
            </div>

            <div className="flex-1 overflow-y-auto">
              {inProgressIdeas.length > 0 && (
                <div className="flex flex-1 flex-col gap-4 px-6 pt-6 pb-2">
                  <div className="flex w-full flex-col gap-2">
                    <span className="text-muted-foreground mb-3 text-[10px] tracking-widest uppercase">
                      In progress
                    </span>
                    {inProgressIdeas.map((idea, index) => (
                      <div key={idea.id} className="group relative w-full cursor-pointer">
                        <a
                          href={`/org/${idea.organization?.slug || "unknown"}/${idea.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex w-full gap-3"
                        >
                          <div className="flex flex-col">
                            <div className="flex size-5 shrink-0 items-center justify-center rounded-full bg-purple-100 text-purple-500">
                              <Clock8 className="size-3" />
                            </div>
                            {index !== inProgressIdeas.length - 1 && (
                              <div className="mt-2 ml-2.5 h-full w-px -translate-x-1/2 border-l border-dashed" />
                            )}
                          </div>
                          <div className="w-full flex-1 pb-5">
                            <div className="justify flex items-center justify-between gap-2">
                              <h4 className="text-sm leading-none font-medium">
                                {idea.title}
                              </h4>
                              <div className="text-muted-foreground flex items-center gap-1">
                                <HeartIcon weight="bold" className="size-3.5" />
                                <span className="mt-0.5 text-xs">
                                  {idea.reactionCount}
                                </span>
                              </div>
                            </div>
                            <p className="text-muted-foreground mt-2 line-clamp-2 text-xs font-light">
                              {idea.description}
                            </p>
                          </div>
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {plannedIdeas.length > 0 && (
                <div className="flex flex-1 flex-col gap-4 border-t px-6 pt-6 pb-2">
                  <div className="flex w-full flex-col gap-2">
                    <span className="text-muted-foreground mb-3 text-[10px] tracking-widest uppercase">
                      Planned
                    </span>
                    {plannedIdeas.map((idea, index) => (
                      <div key={idea.id} className="group relative w-full cursor-pointer">
                        <a
                          href={`/org/${idea.organization?.slug || "unknown"}/${idea.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex w-full gap-3"
                        >
                          <div className="flex flex-col">
                            <div className="flex size-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-500">
                              <Clock8 className="size-3" />
                            </div>
                            {index !== plannedIdeas.length - 1 && (
                              <div className="mt-2 ml-2.5 h-full w-px -translate-x-1/2 border-l border-dashed" />
                            )}
                          </div>
                          <div className="w-full flex-1 pb-5">
                            <div className="justify flex items-center justify-between gap-2">
                              <h4 className="text-sm leading-none font-medium">
                                {idea.title}
                              </h4>
                              <div className="text-muted-foreground flex items-center gap-1">
                                <HeartIcon weight="bold" className="size-3.5" />
                                <span className="mt-0.5 text-xs">
                                  {idea.reactionCount}
                                </span>
                              </div>
                            </div>
                            <p className="text-muted-foreground mt-2 line-clamp-2 text-xs font-light">
                              {idea.description}
                            </p>
                          </div>
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {inProgressIdeas.length === 0 && plannedIdeas.length === 0 && (
              <div className="text-muted-foreground py-8 text-center text-sm">
                Nothing on the roadmap yet.
              </div>
            )}
          </div>
        )}

        {activeTab === "updates" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold">Updates</h2>
              <p className="text-muted-foreground">Latest changelog</p>
            </div>
            <div className="text-muted-foreground py-12 text-center">No updates yet.</div>
          </div>
        )}
      </div>

      {/* Footer Tabs */}
      <div className="bg-muted/20 border-t p-2">
        <div className="flex justify-around">
          <button
            onClick={() => setActiveTab("feedback")}
            className={cn(
              "hover:bg-muted flex flex-col items-center gap-1 rounded-lg p-2 text-xs font-medium transition-colors",
              activeTab === "feedback" ? "text-foreground" : "text-muted-foreground",
            )}
          >
            <MessageCircleHeart className="size-5" />
            Feedback
          </button>
          <button
            onClick={() => setActiveTab("roadmap")}
            className={cn(
              "hover:bg-muted flex flex-col items-center gap-1 rounded-lg p-2 text-xs font-medium transition-colors",
              activeTab === "roadmap" ? "text-foreground" : "text-muted-foreground",
            )}
          >
            <MapIcon className="h-5 w-5" />
            Roadmap
          </button>
          <button
            onClick={() => setActiveTab("updates")}
            className={cn(
              "hover:bg-muted flex flex-col items-center gap-1 rounded-lg p-2 text-xs font-medium transition-colors",
              activeTab === "updates" ? "text-foreground" : "text-muted-foreground",
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
