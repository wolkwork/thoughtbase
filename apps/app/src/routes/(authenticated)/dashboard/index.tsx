import { api } from "@/convex/_generated/api";
import { convexQuery } from "@convex-dev/react-query";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useState } from "react";
import { CreateOrganizationDialog } from "~/components/create-organization-dialog";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { WorkspaceAvatar } from "~/components/workspace-avatar";

export const Route = createFileRoute("/(authenticated)/dashboard/")({
  component: DashboardIndex,
  beforeLoad: async ({ context }) => {
    const organizations = await context.queryClient.ensureQueryData(
      convexQuery(api.auth.listOrganizations, {}),
    );

    if (organizations?.length === 1) {
      throw redirect({
        to: "/dashboard/$orgSlug",
        params: { orgSlug: organizations[0].slug },
      });
    }

    return { organizations };
  },
});

function DashboardIndex() {
  const { data: organizations } = useSuspenseQuery(
    convexQuery(api.auth.listOrganizations, {}),
  );

  const [showCreateDialog, setShowCreateDialog] = useState(false);

  return (
    <div className="bg-muted/50 flex min-h-screen flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Select Workspace</CardTitle>
          <CardDescription>
            Choose a workspace to continue to your dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            {organizations?.map((org) => (
              <Button
                key={org.id}
                variant="outline"
                className="h-auto w-full items-center justify-start px-4 py-4"
                render={
                  <Link to="/dashboard/$orgSlug" params={{ orgSlug: org.slug }}>
                    <WorkspaceAvatar
                      workspace={{ name: org.name, logo: org.logo }}
                      className="mr-1.5"
                    />

                    <div className="flex flex-col items-start">
                      <span className="font-medium">{org.name}</span>
                      <span className="text-muted-foreground text-xs">{org.slug}</span>
                    </div>
                  </Link>
                }
              />
            ))}
            {organizations?.length === 0 && (
              <div className="text-muted-foreground py-4 text-center text-sm">
                You don't have any workspaces yet.
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <Button className="w-full" onClick={() => setShowCreateDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create New Workspace
          </Button>
        </CardFooter>
      </Card>

      <CreateOrganizationDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />
    </div>
  );
}
