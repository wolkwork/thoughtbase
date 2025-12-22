import {
  CheckCircle2,
  Circle,
  CircleDashed,
  Clock4,
  Clock8,
  XCircle,
  type LucideIcon,
} from "lucide-react";
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
