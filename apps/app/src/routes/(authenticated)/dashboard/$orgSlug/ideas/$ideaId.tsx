import { convexQuery } from "@convex-dev/react-query";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, notFound } from "@tanstack/react-router";
import { api } from "@thoughtbase/backend/convex/_generated/api";
import { Id } from "@thoughtbase/backend/convex/_generated/dataModel";
import { IdeaDetail } from "~/components/idea-detail";

export const Route = createFileRoute("/(authenticated)/dashboard/$orgSlug/ideas/$ideaId")(
  {
    loader: async ({ context, params: { ideaId } }) => {
      const [idea] = await Promise.all([
        context.queryClient.ensureQueryData(
          convexQuery(api.ideas.getIdea, {
            ideaId: ideaId as Id<"idea">,
          }),
        ),
        context.queryClient.ensureQueryData(
          convexQuery(api.ideas.getCommentsByIdea, {
            ideaId: ideaId as Id<"idea">,
          }),
        ),
        context.queryClient.ensureQueryData(
          convexQuery(api.ideas.getReactionsByIdea, {
            ideaId: ideaId as Id<"idea">,
          }),
        ),
        context.queryClient.ensureQueryData(
          convexQuery(api.ideas.getTagsByIdea, {
            ideaId: ideaId as Id<"idea">,
          }),
        ),
      ]);

      if (!idea) {
        throw notFound();
      }
    },
    component: IdeaDetailPage,
  },
);

function IdeaDetailPage() {
  const { ideaId, orgSlug } = Route.useParams();
  const { user, organization } = Route.useRouteContext();

  const { data: idea } = useSuspenseQuery(
    convexQuery(api.ideas.getIdea, {
      ideaId: ideaId as Id<"idea">,
    }),
  );

  if (!idea) return null;

  return (
    <IdeaDetail
      idea={idea}
      currentUser={user}
      orgSlug={orgSlug}
      organizationId={organization._id}
    />
  );
}
