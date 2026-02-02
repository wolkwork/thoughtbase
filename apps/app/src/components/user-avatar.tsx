import { Image } from "@unpic/react";
import Avvvatars from "avvvatars-react";
import { HatGlasses } from "lucide-react";
import { cn } from "~/lib/utils";
import { Avatar } from "./ui/avatar";

export function UserAvatar({
  user,
  className,
}: {
  user?: {
    name?: string;
    image?: string | null | undefined | undefined;
  };
  className?: string;
}) {
  if (!user?.name) {
    return (
      <Avatar className={cn("bg-muted flex items-center justify-center", className)}>
        <HatGlasses className="size-4" />
      </Avatar>
    );
  }

  if (!user.image) {
    return (
      <div
        className={cn(
          "size-8 rounded-full [&>div]:size-full! [&>div>span]:size-[50%]! [&>div>span>svg]:size-full!",
          className,
        )}
      >
        <Avvvatars value={user.name} style="shape" />
      </div>
    );
  }

  console.log("user", user);

  return (
    <Image
      src={user.image}
      alt={user.name}
      fallback="wsrv"
      width={32}
      height={32}
      className={cn("rounded-full", className)}
    />
  );
}
