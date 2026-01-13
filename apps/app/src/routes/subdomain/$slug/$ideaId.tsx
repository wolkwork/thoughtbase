import { useQuery } from "@tanstack/react-query";
import {
  createFileRoute,
  notFound,
  useLoaderData,
  useRouter,
} from "@tanstack/react-router";
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
import { $getIdea } from "~/lib/api/ideas";

export const Route = createFileRoute("/subdomain/$slug/$ideaId")({
  loader: async ({ params: { ideaId } }) => {
    const idea = await $getIdea({ data: ideaId });
    if (!idea) {
      throw notFound();
    }
    return { idea };
  },
  component: PublicIdeaDetailPage,
});

function PublicIdeaDetailPage() {
  const { idea: initialIdea } = useLoaderData({ from: "/subdomain/$slug/$ideaId" });
  const { org, user } = useLoaderData({ from: "/subdomain/$slug" });
  const { ideaId } = Route.useParams();
  const router = useRouter();

  const [loginOpen, setLoginOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const { data: idea } = useQuery({
    queryKey: ["idea", ideaId],
    queryFn: () => $getIdea({ data: ideaId }),
    initialData: initialIdea,
  });

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
          organizationId={org.id}
          onLoginRequired={handleLoginRequired}
        />
      </div>

      {/* Auth Dialogs */}
      <Dialog open={loginOpen} onOpenChange={setLoginOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <AuthForm
            orgName={org.name}
            orgId={org.id}
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
            orgId={org.id}
            initialName={user?.name || ""}
            onSuccess={handleProfileSuccess}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
