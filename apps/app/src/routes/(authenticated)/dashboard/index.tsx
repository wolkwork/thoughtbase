import { createFileRoute, Link } from "@tanstack/react-router";
import { Building2, Plus } from "lucide-react";
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
import { authClient } from "~/lib/auth/auth-client";

export const Route = createFileRoute("/(authenticated)/dashboard/")({
  component: DashboardIndex,
});

function DashboardIndex() {
  const { data: organizations, isPending: isLoading } = authClient.useListOrganizations();
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
          {isLoading ? (
            <div className="text-muted-foreground text-center text-sm">
              Loading workspaces...
            </div>
          ) : (
            <div className="grid gap-2">
              {organizations?.map((org) => (
                <Button
                  key={org.id}
                  variant="outline"
                  className="h-auto w-full items-center justify-start px-4 py-4"
                  render={
                    <Link to="/dashboard/$orgSlug" params={{ orgSlug: org.slug }}>
                      {org.logo ? (
                        <img
                          src={org.logo}
                          alt={org.name}
                          className="mr-1.5 size-8 rounded-md"
                        />
                      ) : (
                        <span className="bg-muted mr-1.5 flex size-8 items-center justify-center rounded-md">
                          <Building2 className="text-muted-foreground size-5" />
                        </span>
                      )}

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
          )}
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
