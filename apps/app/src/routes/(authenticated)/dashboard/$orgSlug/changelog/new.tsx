import { useConvexMutation } from "@convex-dev/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Id } from "@thoughtbase/backend/convex/_generated/dataModel";
import { api } from "@thoughtbase/backend/convex/_generated/api";
import { ArrowLeft } from "lucide-react";
import { ChangelogEditor } from "~/components/changelog-editor";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";

export const Route = createFileRoute("/(authenticated)/dashboard/$orgSlug/changelog/new")(
  {
    loader: async ({ context }) => {
      // Use organization from parent route context
      return { organizationId: context.organization._id };
    },
    component: NewChangelogPage,
  },
);

function NewChangelogPage() {
  const { organizationId } = Route.useLoaderData();
  const { orgSlug } = Route.useParams();
  const navigate = useNavigate();

  const createChangelog = useConvexMutation(api.changelogs.createChangelog);

  const handleSubmit = (data: {
    title: string;
    content: string;
    featuredImage?: string;
    publishedAt?: string;
    status: "draft" | "published";
    ideaIds: Id<"idea">[];
  }) => {
    createChangelog({
      organizationId,
      title: data.title,
      content: data.content,
      featuredImage: data.featuredImage,
      publishedAt: data.publishedAt,
      status: data.status,
      ideaIds: data.ideaIds.map((id) => id as any), // Convert strings to Id<"idea">
    });
    navigate({ to: "/dashboard/$orgSlug/changelog", params: { orgSlug } });
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
        <h1 className="text-2xl font-bold">New Changelog Entry</h1>
        <p className="text-muted-foreground text-sm">
          Create a new update to share with your users
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Changelog Details</CardTitle>
        </CardHeader>
        <CardContent>
          <ChangelogEditor organizationId={organizationId} onSubmit={handleSubmit} />
        </CardContent>
      </Card>
    </div>
  );
}
