import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ChatsCircleIcon, HeartIcon } from "@phosphor-icons/react";
import { Link } from "@tanstack/react-router";
import { cn } from "~/lib/utils";

interface RoadmapCardProps {
  idea: any;
  orgSlug: string;
  isPublic?: boolean;
}

export function RoadmapCard({ idea, orgSlug, isPublic = false }: RoadmapCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: idea.id, data: { idea } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        "group bg-card hover:border-primary/50 relative flex cursor-grab flex-col gap-2 rounded-md border p-3 transition-all active:cursor-grabbing",
        isDragging && "ring-primary/20 z-50 ring-2",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <h4 className="line-clamp-2 text-sm leading-tight font-medium">{idea.title}</h4>
      </div>

      <div className="text-muted-foreground mt-1 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <HeartIcon weight="bold" className="size-3.5" />
            <span>{idea.reactionCount}</span>
          </div>
          <div className="flex items-center gap-1">
            <ChatsCircleIcon weight="bold" className="size-3.5" />
            <span>{idea.commentCount}</span>
          </div>
        </div>
      </div>

      {isPublic ? (
        <Link
          to="/subdomain/$slug/$ideaId"
          params={{ slug: orgSlug, ideaId: idea.id }}
          className="absolute inset-0 z-0"
        />
      ) : (
        <Link
          to="/dashboard/$orgSlug/ideas/$ideaId"
          params={{ orgSlug: orgSlug, ideaId: idea.id }}
          className="absolute inset-0 z-0"
        />
      )}
    </div>
  );
}
