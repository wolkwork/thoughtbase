import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import {
  CheckCircle2,
  Circle,
  CircleDashed,
  Clock4,
  Clock8,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import * as React from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "~/components/ui/tooltip";
import { cn } from "~/lib/utils";

export type IdeaStatus =
  | "pending"
  | "reviewing"
  | "planned"
  | "in_progress"
  | "completed"
  | "closed";

interface StatusConfig {
  label: string;
  icon: LucideIcon;
  color: string;
}

export const STATUSES: Record<IdeaStatus, StatusConfig> = {
  pending: { label: "Reviewing", icon: CircleDashed, color: "text-yellow-500" },
  reviewing: { label: "Open", icon: Circle, color: "text-orange-500" },
  planned: { label: "Planned", icon: Clock4, color: "text-blue-500" },
  in_progress: { label: "In Progress", icon: Clock8, color: "text-purple-500" },
  completed: { label: "Completed", icon: CheckCircle2, color: "text-green-500" },
  closed: { label: "Archived", icon: XCircle, color: "text-gray-500" },
};

interface StatusBadgeProps {
  status: string;
  showLabel?: boolean;
  className?: string;
  iconClassName?: string;
}

export function StatusBadge({
  status,
  showLabel = true,
  className,
  iconClassName,
}: StatusBadgeProps) {
  const config = STATUSES[status as IdeaStatus] || STATUSES.pending;

  const Icon = config.icon;

  const content = (
    <div className={cn("flex items-center gap-2.5", className)}>
      <Icon className={cn(config.color, "size-4", iconClassName)} />
      {showLabel && <span>{config.label}</span>}
    </div>
  );

  if (!showLabel) {
    return (
      <Tooltip>
        <TooltipTrigger render={content} />
        <TooltipContent>{config.label}</TooltipContent>
      </Tooltip>
    );
  }

  return content;
}

const buttonVariants = cva(
  "text-xs font-medium rounded-full flex items-center px-2.5 py-0.5 h-5 whitespace-nowrap w-fit",
  {
    variants: {
      variant: {
        reviewing:
          "bg-orange-50 text-orange-500 hover:bg-orange-50/90 hover:text-orange-500",
        planned: "bg-sky-50 text-sky-500 hover:bg-sky-50/90 hover:text-sky-500",
        in_progress:
          "bg-fuchsia-50 text-fuchsia-500 hover:bg-fuchsia-50/90 hover:text-fuchsia-500",
        completed:
          "bg-emerald-50 text-emerald-500 hover:bg-emerald-50/90 hover:text-emerald-500",
        closed: "bg-gray-50 text-gray-500 hover:bg-gray-50/90 hover:text-gray-500",
        pending:
          "bg-yellow-50 text-yellow-600 hover:bg-yellow-50/90 hover:text-yellow-600",
        unknown: "bg-gray-50 text-gray-500 hover:bg-gray-50/90 hover:text-gray-500",
      } satisfies Record<IdeaStatus | "unknown", string>,
    },
    defaultVariants: {
      variant: "unknown",
    },
  },
);

export function StatusPill({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "span";

  return (
    <Comp
      data-slot="status-pill"
      className={cn(buttonVariants({ variant, className }))}
      {...props}
    >
      {getStatusFromVariant(variant)}
    </Comp>
  );
}

function getStatusFromVariant(
  variant: IdeaStatus | "unknown" | null = "unknown",
): string {
  return STATUSES[(variant || "unknown") as IdeaStatus]?.label || "Unknown";
}
