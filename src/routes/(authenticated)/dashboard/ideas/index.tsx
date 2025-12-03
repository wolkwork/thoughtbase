import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { IdeasDataTable } from "~/components/ideas-data-table";
import { $getIdeas } from "~/lib/api/ideas";

const ideasSearchSchema = z.object({
  status: z.string().optional(),
  boardId: z.string().optional(),
});

export const Route = createFileRoute("/(authenticated)/dashboard/ideas/")({
  validateSearch: ideasSearchSchema,
  loaderDeps: ({ search }) => ({ search }),
  loader: async ({ deps: { search } }) => {
    // Fetch all ideas for the table to handle filtering client-side
    // We ignore status in the fetch so we get all statuses
    const ideas = await $getIdeas({
      data: {
        boardId: search.boardId,
        // We intentionally don't pass status here to fetch all for the client-side table
      },
    });
    return { ideas };
  },
  component: IdeasPage,
});

function IdeasPage() {
  const { ideas: initialIdeas } = Route.useLoaderData();
  const search = Route.useSearch();

  // We fetch all ideas to allow client-side filtering
  const { data: ideas } = useQuery({
    queryKey: ["ideas", "all", search.boardId],
    queryFn: () =>
      $getIdeas({
        data: {
          boardId: search.boardId,
        },
      }),
    initialData: initialIdeas,
  });

  // Map the data to ensure dates are Date objects if they were serialized
  const tableData = ideas.map((idea) => ({
    ...idea,
    createdAt: new Date(idea.createdAt),
    author: {
      ...idea.author,
      name: idea.author.name || "Unknown User",
    },
  }));

  return (
    <div className="px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Ideas</h1>
      </div>

      <div className="space-y-4">
        <IdeasDataTable data={tableData} initialStatus={search.status} />
      </div>
    </div>
  );
}
