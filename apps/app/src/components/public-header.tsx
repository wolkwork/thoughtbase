import { Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { AuthForm } from "~/components/auth-form";
import { Button } from "~/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "~/components/ui/dialog";
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
}

export function PublicHeader({ org, user }: PublicHeaderProps) {
  const router = useRouter();
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  const handleLoginSuccess = () => {
    setIsLoginOpen(false);
    router.invalidate();
  };

  return (
    <header className="bg-background/95 supports-backdrop-filter:bg-background/60 sticky top-0 z-50 w-full border-b backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
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
          <div className="relative hidden sm:block">
            {/* Search placeholder - typically would be functional */}
          </div>

          {user ? (
            <div className="flex items-center gap-3">
              {user.type === "internal" && (
                <Button
                  variant="ghost"
                  render={
                    <Link to="/dashboard/$orgSlug/ideas" params={{ orgSlug: org.slug }}>
                      Dashboard
                    </Link>
                  }
                />
              )}
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
  );
}
