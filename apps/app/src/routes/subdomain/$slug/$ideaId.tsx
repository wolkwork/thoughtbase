import { convexQuery } from "@convex-dev/react-query";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, useLoaderData, useRouter } from "@tanstack/react-router";
import { api } from "@thoughtbase/backend/convex/_generated/api";
import { Id } from "@thoughtbase/backend/convex/_generated/dataModel";
import { useState } from "react";
import { AuthForm } from "~/components/auth-form";
import { ProfileForm } from "~/components/profile-form";
import { PublicIdeaDetail } from "~/components/public-idea-detail";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";

export const Route = createFileRoute("/subdomain/$slug/$ideaId")({
  loader: async ({ context, params: { ideaId } }) => {
    context.queryClient.ensureQueryData(
      convexQuery(api.ideas.getPublicIdea, {
        ideaId: ideaId as Id<"idea">,
      }),
    );
  },
  component: PublicIdeaDetailPage,
});

function PublicIdeaDetailPage() {
  const { ideaId } = Route.useParams();

  const { data: idea } = useSuspenseQuery(
    convexQuery(api.ideas.getPublicIdea, {
      ideaId: ideaId as Id<"idea">,
    }),
  );

  const { org, user, sessionId } = useLoaderData({ from: "/subdomain/$slug" });
  const router = useRouter();

  const [loginOpen, setLoginOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const handleLoginRequired = () => {
    setLoginOpen(true);
  };

  const handleLoginSuccess = () => {
    setLoginOpen(false);
    router.invalidate();
    // Typically check for profile next, but user can click action again if needed
  };

  const handleProfileSuccess = () => {
    setProfileOpen(false);
    router.invalidate();
  };

  if (!idea) return null;

  return (
    <div className="bg-background text-foreground flex min-h-screen flex-col">
      <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col border-r border-l px-4">
        <PublicIdeaDetail
          idea={idea}
          currentUser={user}
          organizationId={org._id}
          onLoginRequired={handleLoginRequired}
          sessionId={sessionId}
        />
      </div>

      {/* Auth Dialogs */}
      <Dialog open={loginOpen} onOpenChange={setLoginOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <AuthForm
            orgName={org.name}
            orgId={org._id}
            onSuccess={handleLoginSuccess}
            mode="dialog"
          />
        </DialogContent>
      </Dialog>

      <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Complete Profile</DialogTitle>
            <DialogDescription>
              Please set your display name to continue.
            </DialogDescription>
          </DialogHeader>
          <ProfileForm
            orgId={org._id}
            initialName={user?.name || ""}
            onSuccess={handleProfileSuccess}
            sessionId={sessionId}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
