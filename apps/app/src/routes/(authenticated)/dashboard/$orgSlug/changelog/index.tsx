import { convexQuery, useConvexMutation } from "@convex-dev/react-query";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { api } from "@thoughtbase/backend/convex/_generated/api";
import { Id } from "@thoughtbase/backend/convex/_generated/dataModel";
import { Plus } from "lucide-react";
import { ChangelogDataTable } from "~/components/changelog-data-table";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { useOrganization } from "~/hooks/organization";

export const Route = createFileRoute("/(authenticated)/dashboard/$orgSlug/changelog/")({
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(
      convexQuery(api.changelogs.getChangelogs, {
        organizationId: context.organization._id,
      }),
    );
  },
  component: ChangelogListPage,
});

function ChangelogListPage() {
  const { orgSlug } = Route.useParams();
  const organization = useOrganization();

  const { data: changelogs } = useSuspenseQuery(
    convexQuery(api.changelogs.getChangelogs, {
      organizationId: organization._id,
    }),
  );

  const deleteChangelog = useConvexMutation(api.changelogs.deleteChangelog);

  const handleDelete = (id: Id<"changelog">) => {
    if (confirm("Are you sure you want to delete this changelog?")) {
      deleteChangelog({
        id,
        organizationId: organization._id,
      });
    }
  };

  return (
    <div className="px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Changelog</h1>
          <p className="text-muted-foreground text-sm">
            Keep your users informed about updates and new features
          </p>
        </div>
        <Button
          render={
            <Link to="/dashboard/$orgSlug/changelog/new" params={{ orgSlug }}>
              <Plus className="mr-2 h-4 w-4" />
              New Entry
            </Link>
          }
        />
      </div>

      {changelogs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">No changelog entries yet</p>
            <Button
              render={
                <Link to="/dashboard/$orgSlug/changelog/new" params={{ orgSlug }}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create your first entry
                </Link>
              }
            />
          </CardContent>
        </Card>
      ) : (
        <ChangelogDataTable data={changelogs} orgSlug={orgSlug} onDelete={handleDelete} />
      )}
    </div>
  );
}
