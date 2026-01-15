import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { ChangelogDataTable } from "~/components/changelog-data-table";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { $deleteChangelog, $getChangelogs } from "~/lib/api/changelogs";

export const Route = createFileRoute("/(authenticated)/dashboard/$orgSlug/changelog/")({
  loader: async ({ context }) => {
    // Use organization from parent route context
    const changelogs = await $getChangelogs({
      data: { organizationId: context.organization.id },
    });
    return { changelogs, organizationId: context.organization.id };
  },
  component: ChangelogListPage,
});

function ChangelogListPage() {
  const { changelogs: initialChangelogs, organizationId } = Route.useLoaderData();
  const { orgSlug } = Route.useParams();
  const queryClient = useQueryClient();

  const { data: changelogs } = useQuery({
    queryKey: ["changelogs", organizationId],
    queryFn: () => $getChangelogs({ data: { organizationId } }),
    initialData: initialChangelogs,
  });

  const { mutate: deleteChangelog } = useMutation({
    mutationFn: $deleteChangelog,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["changelogs", organizationId] });
    },
  });

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this changelog?")) {
      deleteChangelog({ data: { id, organizationId } });
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
