import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { MessageSquare, ThumbsUp } from "lucide-react";
import { z } from "zod";
import { $getIdeas } from "~/lib/api/ideas";
import { cn } from "~/lib/utils";

const ideasSearchSchema = z.object({
  status: z.string().optional(),
  boardId: z.string().optional(),
});

export const Route = createFileRoute("/(authenticated)/dashboard/ideas/")({
  validateSearch: ideasSearchSchema,
  loaderDeps: ({ search }) => ({ search }),
  loader: async ({ deps: { search } }) => {
    // Prefetch or just let useQuery handle it. 
    // For SSR support we should prefetch, but for now useQuery is fine.
    // Returning data here allows access in component via useLoaderData
    const ideas = await $getIdeas({ data: search });
    return { ideas };
  },
  component: IdeasPage,
});

function IdeasPage() {
  const { ideas: initialIdeas } = Route.useLoaderData();
  const search = Route.useSearch();
  
  const { data: ideas } = useQuery({
    queryKey: ["ideas", search],
    queryFn: () => $getIdeas({ data: search }),
    initialData: initialIdeas,
  });

  const statusLabels: Record<string, string> = {
    pending: "Pending",
    reviewing: "Reviewing",
    planned: "Planned",
    in_progress: "In Progress",
    completed: "Completed",
    closed: "Closed",
  };

  const title = search.status ? statusLabels[search.status] || "Ideas" : "All Ideas";

  return (
    <div className="container mx-auto py-6 px-4 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{title}</h1>
      </div>

      <div className="space-y-4">
        {ideas.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground bg-muted/30 rounded-lg border border-dashed">
            No ideas found with this status.
          </div>
        ) : (
          ideas.map((idea) => (
            <Link
              key={idea.id}
              to="/dashboard/ideas/$ideaId"
              params={{ ideaId: idea.id }}
              className="block group"
            >
              <div className="flex items-start gap-4 p-4 rounded-lg border bg-card text-card-foreground hover:border-primary/50 transition-colors shadow-sm">
                <div className="flex flex-col items-center gap-1 min-w-[3rem] pt-1">
                  <div className="flex flex-col items-center justify-center w-10 h-10 rounded-md bg-muted group-hover:bg-accent transition-colors">
                    <ThumbsUp className="w-4 h-4 text-muted-foreground" />
                    <span className="text-xs font-semibold mt-0.5">{idea.reactionCount}</span>
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold truncate group-hover:text-primary transition-colors">
                      {idea.title}
                    </h3>
                    {idea.board && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                            {idea.board.name}
                        </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                    {idea.description || "No description provided."}
                  </p>
                  
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                       <MessageSquare className="w-3 h-3" />
                       {idea.commentCount} comments
                    </div>
                    <span>•</span>
                    <span>{new Date(idea.createdAt).toLocaleDateString()}</span>
                    <span>•</span>
                    <div className="flex items-center gap-1">
                       <div className="w-4 h-4 rounded-full bg-muted overflow-hidden">
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
                    {idea.tags.map(t => (
                         <span key={t.tag.id} className="ml-2 px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 font-medium">
                             {t.tag.name}
                         </span>
                    ))}
                  </div>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}

