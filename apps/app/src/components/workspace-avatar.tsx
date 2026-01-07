import Avvvatars from "avvvatars-react";
import { Building2 } from "lucide-react";
import { cn } from "~/lib/utils";
import { Avatar, AvatarImage } from "./ui/avatar";

export function WorkspaceAvatar({
  workspace,
  className,
}: {
  workspace: {
    name?: string;
    logo?: string | null | undefined;
  };
  className?: string;
}) {
  if (!workspace.name) {
    return (
      <Avatar
        className={cn(
          "bg-muted flex items-center justify-center rounded-[6px]",
          className,
        )}
      >
        <Building2 className="size-4" />
      </Avatar>
    );
  }

  if (!workspace.logo) {
    return (
      <div
        className={cn(
          "size-8 rounded-[6px] [&>div]:size-full! [&>div>span]:size-[50%]!",
          className,
        )}
      >
        <Avvvatars value={workspace.name} style="shape" radius={6} />
      </div>
    );
  }

  return (
    <Avatar className={cn("rounded-[6px]", className)}>
      <AvatarImage src={workspace.logo} alt={workspace.name} />
    </Avatar>
  );
}
