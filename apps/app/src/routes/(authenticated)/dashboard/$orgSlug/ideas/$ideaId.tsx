import { useQuery } from "@tanstack/react-query";
import { createFileRoute, notFound } from "@tanstack/react-router";
import { IdeaDetail } from "~/components/idea-detail";
import { $getIdea } from "~/lib/api/ideas";

export const Route = createFileRoute("/(authenticated)/dashboard/$orgSlug/ideas/$ideaId")(
  {
    loader: async ({ params: { ideaId } }) => {
      console.time("[IDEAS_DETAIL_LOADER] Total loader time");

      console.time("[IDEAS_DETAIL_LOADER] Get idea");
      const idea = await $getIdea({ data: ideaId });
      console.timeEnd("[IDEAS_DETAIL_LOADER] Get idea");

      if (!idea) {
        throw notFound();
      }

      console.timeEnd("[IDEAS_DETAIL_LOADER] Total loader time");
      return { idea };
    },
    component: IdeaDetailPage,
  },
);

function IdeaDetailPage() {
  const { idea: initialIdea } = Route.useLoaderData();
  const { ideaId, orgSlug } = Route.useParams();
  const { user, organization } = Route.useRouteContext();

  const { data: idea } = useQuery({
    queryKey: ["idea", ideaId],
    queryFn: () => $getIdea({ data: ideaId }),
    initialData: initialIdea,
  });

  if (!idea) return null;

  return (
    <IdeaDetail
      idea={idea}
      currentUser={user}
      orgSlug={orgSlug}
      organizationId={organization.id}
    />
  );
}
