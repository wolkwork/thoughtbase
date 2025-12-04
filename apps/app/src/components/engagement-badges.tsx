import { ChatsCircleIcon, HeartIcon } from "@phosphor-icons/react";
import { cn } from "~/lib/utils";

interface CommentBadgeProps {
  count: number;
  className?: string;
}

export function CommentBadge({ count, className }: CommentBadgeProps) {
  return (
    <div
      className={cn(
        "hover:bg-accent text-muted-foreground flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs transition-colors",
        className,
      )}
    >
      <ChatsCircleIcon weight="bold" className="size-4" />
      <span className="mt-px font-mono text-xs">{count}</span>
    </div>
  );
}

interface LikeBadgeProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  count: number;
  hasReacted?: boolean;
  className?: string;
}

export function LikeBadge({
  count,
  hasReacted = false,
  className,
  onClick,
  ...props
}: LikeBadgeProps) {
  const Component = onClick ? "button" : "div";

  return (
    <Component
      onClick={onClick}
      className={cn(
        "hover:bg-accent text-muted-foreground flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs transition-colors",
        onClick && "cursor-pointer",
        className,
      )}
      {...(onClick ? props : {})}
    >
      <HeartIcon
        weight={hasReacted ? "fill" : "bold"}
        className={cn("size-4", hasReacted && "fill-red-500")}
      />
      <span className="mt-px font-mono text-xs">{count}</span>
    </Component>
  );
}
