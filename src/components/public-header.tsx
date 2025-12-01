import { Link, useRouter } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useState } from "react";
import { AuthForm } from "~/components/auth-form";
import { SignOutButton } from "~/components/sign-out-button";
import { Button } from "~/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";

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
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2">
            {org.logo ? (
              <img src={org.logo} alt={org.name} className="h-8 w-8 rounded" />
            ) : (
              <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                {org.name.charAt(0)}
              </div>
            )}
            <span className="font-bold text-lg">{org.name}</span>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            <Link 
              to="/org/$slug" 
              params={{ slug: org.slug }}
              className="text-foreground transition-colors hover:text-foreground/80"
              activeProps={{ className: "text-primary" }}
              activeOptions={{ exact: true }}
            >
              Feedback
            </Link>
            <Link 
              to="/org/$slug/roadmap" 
              params={{ slug: org.slug }}
              className="text-muted-foreground transition-colors hover:text-foreground"
              activeProps={{ className: "text-primary" }}
            >
              Roadmap
            </Link>
            <span className="text-muted-foreground cursor-not-allowed opacity-50">
              Updates
            </span>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative hidden sm:block">
             {/* Search placeholder - typically would be functional */}
          </div>

          {user ? (
            <div className="flex items-center gap-3">
              {user.type === "internal" && (
                <Button variant="ghost" asChild>
                    <Link to="/dashboard/ideas" search={{}}>Dashboard</Link>
                </Button>
              )}
              <div className="w-8 h-8 rounded-full bg-muted overflow-hidden flex items-center justify-center text-xs">
                 {user.image ? (
                    <img src={user.image} alt={user.name} className="w-full h-full object-cover" />
                 ) : (
                    <span>{user.name?.charAt(0) || user.email?.charAt(0)}</span>
                 )}
              </div>
            </div>
          ) : (
             <Dialog open={isLoginOpen} onOpenChange={setIsLoginOpen}>
                 <DialogTrigger asChild>
                    <Button variant="outline">Login</Button>
                 </DialogTrigger>
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

