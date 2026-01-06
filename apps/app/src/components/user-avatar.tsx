import Avvvatars from "avvvatars-react";
import { HatGlasses } from "lucide-react";
import { cn } from "~/lib/utils";
import { Avatar, AvatarImage } from "./ui/avatar";

export function UserAvatar({
  user,
  className,
}: {
  user: {
    name?: string;
    image?: string | null | undefined | undefined;
  };
  className?: string;
}) {
  if (!user.name) {
    return (
      <Avatar className={cn("bg-muted flex items-center justify-center", className)}>
        <HatGlasses className="size-4" />
      </Avatar>
    );
  }

  if (!user.image) {
    return (
      <div
        className={cn("size-8 [&>div]:size-full! [&>div>span]:size-[50%]!", className)}
      >
        <Avvvatars value={user.name} style="shape" />
      </div>
    );
  }

  return (
    <Avatar className={className}>
      <AvatarImage src={user.image} alt={user.name} />
    </Avatar>
  );
}
