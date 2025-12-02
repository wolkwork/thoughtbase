import {
  CheckCircle2,
  Circle,
  CircleDashed,
  Clock4,
  Clock8,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { cn } from "~/lib/utils";

export type IdeaStatus = "pending" | "reviewing" | "planned" | "in_progress" | "completed" | "closed";

interface StatusConfig {
  label: string;
  icon: LucideIcon;
  color: string;
}

export const STATUSES: Record<IdeaStatus, StatusConfig> = {
  pending: { label: "Pending", icon: CircleDashed, color: "text-yellow-500" },
  reviewing: { label: "Reviewing", icon: Circle, color: "text-orange-500" },
  planned: { label: "Planned", icon: Clock4, color: "text-blue-500" },
  in_progress: { label: "In Progress", icon: Clock8, color: "text-purple-500" },
  completed: { label: "Completed", icon: CheckCircle2, color: "text-green-500" },
  closed: { label: "Closed", icon: XCircle, color: "text-gray-500" },
};

interface StatusBadgeProps {
  status: string;
  showLabel?: boolean;
  className?: string;
  iconClassName?: string;
}

export function StatusBadge({ status, showLabel = true, className, iconClassName }: StatusBadgeProps) {
  const config = STATUSES[status as IdeaStatus] || STATUSES.pending;
  
  const Icon = config.icon;

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <Icon className={cn(config.color, "size-4", iconClassName)} />
      {showLabel && <span>{config.label}</span>}
    </div>
  );
}

