import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, notFound, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { ChangelogEditor } from "~/components/changelog-editor";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { $getChangelog, $updateChangelog } from "~/lib/api/changelogs";

export const Route = createFileRoute(
  "/(authenticated)/dashboard/$orgSlug/changelog/$changelogId",
)({
  loader: async ({ params, context }) => {
    // Use organization from parent route context
    const changelog = await $getChangelog({ data: params.changelogId });
    if (!changelog) {
      throw notFound();
    }

    return { changelog, organizationId: context.organization.id };
  },
  component: EditChangelogPage,
});

function EditChangelogPage() {
  const { changelog, organizationId } = Route.useLoaderData();
  const { orgSlug } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { mutate: updateChangelog, isPending } = useMutation({
    mutationFn: $updateChangelog,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["changelogs", organizationId] });
      navigate({ to: "/dashboard/$orgSlug/changelog", params: { orgSlug } });
    },
  });

  const handleSubmit = (data: {
    title: string;
    content: string;
    featuredImage: string | null;
    publishedAt: string | null;
    status: "draft" | "published";
    ideaIds: string[];
  }) => {
    updateChangelog({
      data: {
        id: changelog.id,
        organizationId,
        title: data.title,
        content: data.content,
        featuredImage: data.featuredImage,
        publishedAt: data.publishedAt,
        status: data.status,
        ideaIds: data.ideaIds,
      },
    });
  };

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
            organizationId={organizationId}
            initialData={{
              id: changelog.id,
              title: changelog.title,
              content: changelog.content,
              featuredImage: changelog.featuredImage,
              publishedAt: changelog.publishedAt,
              status: changelog.status as "draft" | "published",
              ideas: changelog.ideas,
            }}
            onSubmit={handleSubmit}
            isSubmitting={isPending}
          />
        </CardContent>
      </Card>
    </div>
  );
}
