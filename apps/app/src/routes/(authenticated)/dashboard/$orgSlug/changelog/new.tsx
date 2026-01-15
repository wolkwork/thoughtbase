import { useMutation } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { ChangelogEditor } from "~/components/changelog-editor";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { $createChangelog } from "~/lib/api/changelogs";

export const Route = createFileRoute("/(authenticated)/dashboard/$orgSlug/changelog/new")(
  {
    loader: async ({ context }) => {
      // Use organization from parent route context
      return { organizationId: context.organization.id };
    },
    component: NewChangelogPage,
  },
);

function NewChangelogPage() {
  const { organizationId } = Route.useLoaderData();
  const { orgSlug } = Route.useParams();
  const navigate = useNavigate();

  const { mutate: createChangelog, isPending } = useMutation({
    mutationFn: $createChangelog,
    onSuccess: () => {
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
    createChangelog({
      data: {
        organizationId,
        title: data.title,
        content: data.content,
        featuredImage: data.featuredImage,
        publishedAt: data.publishedAt ?? undefined,
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
          <ChangelogEditor
            organizationId={organizationId}
            onSubmit={handleSubmit}
            isSubmitting={isPending}
          />
        </CardContent>
      </Card>
    </div>
  );
}
