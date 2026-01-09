import { SparkleIcon } from "@phosphor-icons/react";
import { Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { AuthForm } from "~/components/auth-form";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { CreateIdeaDialog } from "./create-idea-dialog";
import { ProfileForm } from "./profile-form";
import { UserAvatar } from "./user-avatar";
import { WorkspaceAvatar } from "./workspace-avatar";

interface PublicHeaderProps {
  org: {
    id: string;
    name: string;
    slug: string;
    logo?: string | null;
  };
  user: any;
  profile: any;
}

export function PublicHeader({ org, user, profile }: PublicHeaderProps) {
  const router = useRouter();
  const navigate = useNavigate();
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  const [loginOpen, setLoginOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  const handleLoginSuccess = () => {
    setIsLoginOpen(false);
    router.invalidate();
  };

  const handleSubmitIdeaClick = () => {
    if (!user) {
      setLoginOpen(true);
    } else if (!profile) {
      setProfileOpen(true);
    } else {
      setCreateOpen(true);
    }
  };

  const handleProfileSuccess = () => {
    setProfileOpen(false);
    router.invalidate();
    setCreateOpen(true); // Auto open create after profile setup
  };

  return (
    <>
      <header className="bg-background/95 supports-backdrop-filter:bg-background/60 sticky top-0 z-50 w-full border-b backdrop-blur">
        <div className="mx-auto flex h-16 max-w-none items-center justify-between px-4">
          <div className="flex items-center gap-8">
            <Link
              to="/org/$slug"
              params={{ slug: org.slug }}
              className="flex items-center gap-2"
            >
              <WorkspaceAvatar
                workspace={{ name: org.name, logo: org.logo }}
                className="h-8 w-8"
              />
              <span className="text-lg font-bold">{org.name}</span>
            </Link>

            <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
              <Link
                to="/org/$slug"
                params={{ slug: org.slug }}
                className="text-foreground hover:text-foreground/80 transition-colors"
                activeProps={{ className: "text-primary" }}
                activeOptions={{ exact: true }}
              >
                Feedback
              </Link>
              <Link
                to="/org/$slug/roadmap"
                params={{ slug: org.slug }}
                className="text-muted-foreground hover:text-foreground transition-colors"
                activeProps={{ className: "text-primary" }}
              >
                Roadmap
              </Link>
              <Link
                to="/org/$slug/changelog"
                params={{ slug: org.slug }}
                className="text-muted-foreground hover:text-foreground transition-colors"
                activeProps={{ className: "text-primary" }}
              >
                Updates
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            {/* TODO: Make reusable component that handles login, profile, and create idea */}
            <Button variant="outline" onClick={handleSubmitIdeaClick}>
              <SparkleIcon weight="duotone" className="size-4" />
              <span>Submit Idea</span>
            </Button>

            {user ? (
              <div className="flex items-center gap-3">
                <div className="bg-muted flex h-8 w-8 items-center justify-center overflow-hidden rounded-full text-xs">
                  <UserAvatar user={user} />
                </div>
              </div>
            ) : (
              <Dialog open={isLoginOpen} onOpenChange={setIsLoginOpen}>
                <DialogTrigger render={<Button variant="outline">Login</Button>} />
                <DialogContent className="sm:max-w-[425px]">
                  <AuthForm
                    orgName={org.name}
                    orgId={org.id}
                    onSuccess={handleLoginSuccess}
                    mode="dialog"
                  />
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
      </header>

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

      <CreateIdeaDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        organizationId={org.id}
        orgSlug={org.slug}
        onSuccess={(newIdea) => {
          navigate({
            to: "/org/$slug/$ideaId",
            params: { slug: org.slug, ideaId: newIdea.id },
          });
        }}
      />
    </>
  );
}
