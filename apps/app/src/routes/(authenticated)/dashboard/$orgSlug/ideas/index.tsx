import { convexQuery } from "@convex-dev/react-query";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { api } from "@thoughtbase/backend/convex/_generated/api";
import { z } from "zod";
import { IdeasDataTable } from "~/components/ideas-data-table";
import { useOrganization } from "~/hooks/organization";

const ideasSearchSchema = z.object({
  status: z.string().optional(),
});

export const Route = createFileRoute("/(authenticated)/dashboard/$orgSlug/ideas/")({
  validateSearch: ideasSearchSchema,
  loaderDeps: ({ search }) => ({ search }),
  loader: async ({ deps: { search }, context }) => {
    const organizationId = context.organization._id;

    const ideas = await context.queryClient.ensureQueryData(
      convexQuery(api.ideas.getIdeas, {
        organizationId,
        status: search.status,
      }),
    );

    return { ideas, organizationId };
  },
  component: IdeasPage,
});

function IdeasPage() {
  const organization = useOrganization();
  const search = Route.useSearch();
  const { orgSlug } = Route.useParams();

  const { data: ideas } = useSuspenseQuery(
    convexQuery(api.ideas.getIdeas, {
      organizationId: organization._id,
      status: search.status,
    }),
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Ideas</h1>
      </div>

      <div className="space-y-4">
        <IdeasDataTable data={ideas} initialStatus={search.status} orgSlug={orgSlug} />
      </div>
    </div>
  );
}
