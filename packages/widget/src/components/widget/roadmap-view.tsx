import { Clock8, Heart } from "lucide-react";
import { useEffect, useState } from "react";
import { getWidgetIdeas, type Idea } from "../../lib/api/widget-client";

interface RoadmapViewProps {
  organizationId: string;
  ssoToken?: string;
}

export function RoadmapView({ organizationId, ssoToken }: RoadmapViewProps) {
  const [ideas, setIdeas] = useState<Idea[]>([]);

  useEffect(() => {
    getWidgetIdeas(organizationId)
      .then(setIdeas)
      .catch((err) => console.error("Failed to load ideas", err));
  }, [organizationId]);

  const inProgressIdeas =
    ideas?.filter((i) => i.status === "in_progress") || [];
  const plannedIdeas = ideas?.filter((i) => i.status === "planned") || [];

  const getIdeaUrl = (idea: any) => {
    const baseUrl = `${import.meta.env.VITE_VERCEL_BRANCH_URL || "http://localhost:3000"}/org/${idea.organization?.slug || "unknown"}/${idea.id}`;
    if (ssoToken) {
      return `${baseUrl}?sso_token=${encodeURIComponent(ssoToken)}`;
    }
    return baseUrl;
  };

  return (
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
                <div
                  key={idea.id}
                  className="group relative w-full cursor-pointer"
                >
                  <a
                    href={getIdeaUrl(idea)}
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
                          <Heart className="size-3.5 fill-current" />
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
                <div
                  key={idea.id}
                  className="group relative w-full cursor-pointer"
                >
                  <a
                    href={getIdeaUrl(idea)}
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
                          <Heart className="size-3.5 fill-current" />
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
  );
}
