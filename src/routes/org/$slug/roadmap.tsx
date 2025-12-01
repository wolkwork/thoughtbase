import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useLoaderData } from "@tanstack/react-router";
import { PublicHeader } from "~/components/public-header";
import { RoadmapBoard } from "~/components/roadmap-board";
import { $getIdeas } from "~/lib/api/ideas";

export const Route = createFileRoute("/org/$slug/roadmap")({
  component: PublicRoadmapPage,
});

function PublicRoadmapPage() {
  const { org, user } = useLoaderData({ from: "/org/$slug" });

  const { data: ideas } = useQuery({
    queryKey: ["public-ideas", org.id],
    queryFn: () => $getIdeas({ data: { organizationId: org.id } }),
  });

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <PublicHeader org={org} user={user} />

      <div className="container mx-auto px-4 py-8 flex-1 flex flex-col overflow-hidden">
         <div className="mb-6">
             <h1 className="text-2xl font-bold">Roadmap</h1>
             <p className="text-muted-foreground">See what we are working on.</p>
         </div>

         <div className="flex-1 overflow-x-auto min-h-0">
             {/* RoadmapBoard currently has DnD enabled. 
                 For public view, we should probably disable drag/drop or use a read-only version. 
                 But the prompt said "same kanban board roadmap, except without drag and drop".
                 
                 We can add a `readOnly` prop to RoadmapBoard.
             */}
             <RoadmapBoard ideas={ideas || []} readOnly publicOrgSlug={org.slug} />
         </div>
      </div>
    </div>
  );
}

