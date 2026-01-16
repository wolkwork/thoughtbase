import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { IdeasDataTable } from "~/components/ideas-data-table";
import { $getIdeas } from "~/lib/api/ideas";

const ideasSearchSchema = z.object({
  status: z.string().optional(),
  boardId: z.string().optional(),
});

export const Route = createFileRoute("/(authenticated)/dashboard/$orgSlug/ideas/")({
  validateSearch: ideasSearchSchema,
  loaderDeps: ({ search }) => ({ search }),
  loader: async ({ deps: { search }, context }) => {
    // Get organization from parent route context instead of fetching again
    const organizationId = context.organization.id;

    const ideas = await $getIdeas({
      data: {
        organizationId,
        boardId: search.boardId,
      },
    });

    return { ideas, organizationId };
  },
  component: IdeasPage,
});

function IdeasPage() {
  const { ideas: initialIdeas, organizationId } = Route.useLoaderData();
  const search = Route.useSearch();
  const { orgSlug } = Route.useParams();

  const { data: ideas } = useQuery({
    queryKey: ["ideas", "all", search.boardId, organizationId],
    queryFn: () =>
      $getIdeas({
        data: {
          organizationId,
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
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Ideas</h1>
      </div>

      <div className="space-y-4">
        <IdeasDataTable
          data={tableData}
          initialStatus={search.status}
          orgSlug={orgSlug}
        />
      </div>
    </div>
  );
}
