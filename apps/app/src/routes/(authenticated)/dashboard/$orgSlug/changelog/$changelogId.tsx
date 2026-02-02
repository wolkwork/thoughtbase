import { convexQuery, useConvexMutation } from "@convex-dev/react-query";
import { useSuspenseQuery } from "@tanstack/react-query";
import {
  createFileRoute,
  notFound,
  useNavigate,
  useRouteContext,
} from "@tanstack/react-router";
import { Id } from "@thoughtbase/backend/convex/_generated/dataModel";
import { api } from "@thoughtbase/backend/convex/_generated/api";
import { ArrowLeft } from "lucide-react";
import { ChangelogEditor } from "~/components/changelog-editor";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";

export const Route = createFileRoute(
  "/(authenticated)/dashboard/$orgSlug/changelog/$changelogId",
)({
  loader: async ({ params, context }) => {
    // Use organization from parent route context
    await context.queryClient.ensureQueryData(
      convexQuery(api.changelogs.getChangelog, {
        changelogId: params.changelogId as Id<"changelog">,
      }),
    );
  },
  component: EditChangelogPage,
});

function EditChangelogPage() {
  const { orgSlug, changelogId } = Route.useParams();
  const navigate = useNavigate();
  const { organization } = useRouteContext({
    from: "/(authenticated)/dashboard/$orgSlug",
  });

  const { data } = useSuspenseQuery(
    convexQuery(api.changelogs.getChangelog, {
      changelogId: changelogId as any,
    }),
  );

  const changelog = data?.changelog;
  const ideas = data?.ideas ?? [];

  const updateChangelog = useConvexMutation(api.changelogs.updateChangelog);

  const handleSubmit = (data: {
    title: string;
    content: string;
    featuredImage?: string;
    publishedAt?: string;
    status: "draft" | "published";
    ideaIds: Id<"idea">[];
  }) => {
    if (!changelog) {
      throw notFound();
    }

    updateChangelog({
      id: changelog._id,
      organizationId: changelog.organizationId,
      title: data.title,
      content: data.content,
      featuredImage: data.featuredImage,
      publishedAt: data.publishedAt,
      status: data.status,
      ideaIds: data.ideaIds.map((id) => id),
    });

    navigate({ to: "/dashboard/$orgSlug/changelog", params: { orgSlug } });
  };

  if (!changelog) {
    throw notFound();
  }

  return (
    <div className="px-4 py-6">
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          className="mb-4"
          onClick={() =>
            navigate({ to: "/dashboard/$orgSlug/changelog", params: { orgSlug } })
          }
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Changelog
        </Button>
        <h1 className="text-2xl font-bold">Edit Changelog Entry</h1>
        <p className="text-muted-foreground text-sm">Update this changelog entry</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Changelog Details</CardTitle>
        </CardHeader>
        <CardContent>
          <ChangelogEditor
            organizationId={organization._id}
            initialData={{
              id: changelog._id,
              title: changelog.title,
              content: changelog.content,
              featuredImage: changelog.featuredImage,
              publishedAt: changelog.publishedAt
                ? new Date(changelog.publishedAt).toISOString()
                : undefined,
              status: changelog.status as "draft" | "published",
              ideas: ideas.map((i) => ({
                id: i._id,
                title: i.title,
              })),
            }}
            onSubmit={handleSubmit}
          />
        </CardContent>
      </Card>
    </div>
  );
}
