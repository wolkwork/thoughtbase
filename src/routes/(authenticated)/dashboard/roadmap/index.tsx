import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { RoadmapBoard } from "~/components/roadmap-board";
import { $getIdeas } from "~/lib/api/ideas";

export const Route = createFileRoute("/(authenticated)/dashboard/roadmap/")({
  loader: async () => {
    const ideas = await $getIdeas(); // Get all ideas
    return { ideas };
  },
  component: RoadmapPage,
});

function RoadmapPage() {
  const { ideas: initialIdeas } = Route.useLoaderData();

  const { data: ideas } = useQuery({
    queryKey: ["ideas", "all"],
    queryFn: () => $getIdeas(),
    initialData: initialIdeas,
  });

  return (
    <div className="flex flex-col h-full p-6 overflow-hidden">
      <div className="flex items-center justify-between mb-6 flex-shrink-0">
        <h1 className="text-2xl font-bold">Roadmap</h1>
      </div>
      
      <div className="flex-1 min-h-0 overflow-x-auto">
        <RoadmapBoard ideas={ideas} />
      </div>
    </div>
  );
}

