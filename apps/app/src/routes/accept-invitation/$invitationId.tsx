import { convexQuery } from "@convex-dev/react-query";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { GalleryVerticalEnd, LoaderCircle } from "lucide-react";
import { useEffect } from "react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { authClient } from "~/lib/auth/auth-client-convex";
import { api } from "~/lib/convex/client";

export const Route = createFileRoute("/accept-invitation/$invitationId")({
  component: AcceptInvitationPage,
});

function AcceptInvitationPage() {
  const { invitationId } = Route.useParams();
  const navigate = useNavigate();

  // Check if user is logged in
  const { data: session, isPending: isSessionPending } = useQuery(
    convexQuery(api.auth.getSafeCurrentUser, {}),
  );

  // Get invitation details
  const {
    data: invitation,
    isPending: isInvitationPending,
    error: invitationError,
  } = useQuery({
    queryKey: ["invitation", invitationId],
    queryFn: async () => {
      const result = await authClient.organization.getInvitation({
        query: { id: invitationId },
      });
      if (result.error) {
        throw new Error(result.error.message);
      }
      return result.data;
    },
    enabled: !!session?._id,
  });

  // Accept invitation mutation
  const { mutate: acceptInvitation, isPending: isAccepting } = useMutation({
    mutationFn: async () => {
      const result = await authClient.organization.acceptInvitation({
        invitationId,
      });
      if (result.error) {
        throw new Error(result.error.message);
      }
      return result.data;
    },
    onSuccess: () => {
      toast.success("Invitation accepted! Welcome to the organization.");
      navigate({ to: "/dashboard" });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to accept invitation");
    },
  });

  // Reject invitation mutation
  const { mutate: rejectInvitation, isPending: isRejecting } = useMutation({
    mutationFn: async () => {
      const result = await authClient.organization.rejectInvitation({
        invitationId,
      });
      if (result.error) {
        throw new Error(result.error.message);
      }
      return result.data;
    },
    onSuccess: () => {
      toast.success("Invitation declined.");
      navigate({ to: "/dashboard" });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to decline invitation");
    },
  });

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isSessionPending && !session?._id) {
      navigate({
        to: "/login",
        search: { redirect: `/accept-invitation/${invitationId}` },
      });
    }
  }, [isSessionPending, session, navigate, invitationId]);

  const isLoading = isSessionPending || isInvitationPending;
  const isPending = isAccepting || isRejecting;

  if (isLoading) {
    return (
      <div className="bg-background flex min-h-svh flex-col items-center justify-center gap-6 p-6">
        <LoaderCircle className="text-primary h-12 w-12 animate-spin" />
        <p className="text-muted-foreground">Loading invitation...</p>
      </div>
    );
  }

  if (invitationError) {
    return (
      <div className="bg-background flex min-h-svh flex-col items-center justify-center gap-6 p-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
          <svg
            className="h-6 w-6 text-red-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </div>
        <div className="text-center">
          <h1 className="text-xl font-bold">Invalid Invitation</h1>
          <p className="text-muted-foreground mt-2">
            {invitationError.message || "This invitation is invalid or has expired."}
          </p>
        </div>
        <Link to="/dashboard" className="text-primary underline underline-offset-4">
          Go to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-background flex min-h-svh flex-col items-center justify-center gap-6 p-6">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center gap-6 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-md">
            <GalleryVerticalEnd className="size-8" />
          </div>

          <div>
            <h1 className="text-2xl font-bold">You&apos;ve been invited!</h1>
            <p className="text-muted-foreground mt-2">
              You&apos;ve been invited to join{" "}
              <strong>{invitation?.organizationName}</strong>
            </p>
          </div>

          <div className="bg-muted/50 w-full rounded-lg p-4">
            <div className="text-sm">
              <p className="text-muted-foreground">Invited by</p>
              <p className="font-medium">{invitation?.inviterEmail}</p>
            </div>
            <div className="mt-3 text-sm">
              <p className="text-muted-foreground">Role</p>
              <p className="font-medium capitalize">{invitation?.role}</p>
            </div>
          </div>

          <div className="flex w-full gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => rejectInvitation()}
              disabled={isPending}
            >
              {isRejecting && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
              Decline
            </Button>
            <Button
              className="flex-1"
              onClick={() => acceptInvitation()}
              disabled={isPending}
            >
              {isAccepting && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
              Accept Invitation
            </Button>
          </div>

          <Link to="/dashboard" className="text-muted-foreground text-sm hover:underline">
            Cancel
          </Link>
        </div>
      </div>
    </div>
  );
}
