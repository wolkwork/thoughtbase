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
    <div className="flex h-full flex-col overflow-hidden p-6">
      <div className="mb-6 flex flex-shrink-0 items-center justify-between">
        <h1 className="text-2xl font-bold">Roadmap</h1>
      </div>

      <div className="min-h-0 flex-1 overflow-x-auto">
        <RoadmapBoard ideas={ideas} />
      </div>
    </div>
  );
}
