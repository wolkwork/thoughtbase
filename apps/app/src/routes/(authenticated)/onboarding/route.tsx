import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, redirect, useRouter } from "@tanstack/react-router";
import { Building2, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
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
import { authQueryOptions } from "~/lib/auth/queries";

export const Route = createFileRoute("/(authenticated)/onboarding")({
  component: OnboardingPage,
  beforeLoad: async ({ context }) => {
    const sessionData = await context.queryClient.ensureQueryData({
      ...authQueryOptions(),
      revalidateIfStale: true,
    });

    console.log("aoid", sessionData?.session.activeOrganizationId);

    if (sessionData?.session.activeOrganizationId) {
      throw redirect({ to: "/dashboard" });
    }
  },
});

function OnboardingPage() {
  const { data: organizations, isPending: isLoading } = authClient.useListOrganizations();
  const { data: activeOrganization } = authClient.useActiveOrganization();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const router = useRouter();
  const navigate = Route.useNavigate();
  const queryClient = useQueryClient();

  const handleSetActive = async (organizationId: string) => {
    try {
      await authClient.organization.setActive({
        organizationId,
      });
      toast.success("Organization selected");
      await queryClient.invalidateQueries(authQueryOptions());
      await router.invalidate();
      navigate({ to: "/dashboard" });
    } catch (error) {
      toast.error("Failed to set active organization");
    }
  };

  useEffect(() => {
    if (activeOrganization?.id) {
      navigate({ to: "/dashboard" });
    }
  }, [activeOrganization, navigate]);

  return (
    <div className="bg-muted/50 flex min-h-screen flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Select Organization</CardTitle>
          <CardDescription>
            Choose an organization to continue to your dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="text-muted-foreground text-center text-sm">
              Loading organizations...
            </div>
          ) : (
            <div className="grid gap-2">
              {organizations?.map((org) => (
                <Button
                  key={org.id}
                  variant="outline"
                  className="h-auto w-full justify-start px-4 py-4"
                  onClick={() => handleSetActive(org.id)}
                >
                  <Building2 className="text-muted-foreground mr-3 h-5 w-5" />
                  <div className="flex flex-col items-start">
                    <span className="font-medium">{org.name}</span>
                    <span className="text-muted-foreground text-xs">{org.slug}</span>
                  </div>
                </Button>
              ))}
              {organizations?.length === 0 && (
                <div className="text-muted-foreground py-4 text-center text-sm">
                  You don't have any organizations yet.
                </div>
              )}
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button className="w-full" onClick={() => setShowCreateDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create New Organization
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
