import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ChatsCircleIcon, HeartIcon } from "@phosphor-icons/react";
import { Link } from "@tanstack/react-router";
import { cn } from "~/lib/utils";

interface RoadmapCardProps {
  idea: any;
  publicOrgSlug?: string;
}

export function RoadmapCard({ idea, publicOrgSlug }: RoadmapCardProps) {
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

      {/* Invisible link overlay for navigation, but allowing drag */}
      {/* We can't easily have a full overlay link AND drag. 
           Best pattern is usually to have a specific handle or make the whole card draggable 
           and have a button/icon for detail view, OR handle click vs drag.
           For now, let's just add a small view button or make the title a link that stops propagation?
           Actually dnd-kit handles click vs drag well usually. 
           Let's try adding an absolute link that's lower z-index? 
           Or just a small button. 
           Let's keep it simple: The whole card is draggable. 
           Maybe a small icon to open? 
       */}

      {publicOrgSlug ? (
        <Link
          to="/org/$slug/$ideaId"
          params={{ slug: publicOrgSlug, ideaId: idea.id }}
          className="absolute inset-0 z-0"
        />
      ) : (
        <Link
          to="/dashboard/ideas/$ideaId"
          params={{ ideaId: idea.id }}
          className="absolute inset-0 z-0"
        />
      )}
      {/* Re-cover with relative content so interactions work? 
           Actually, wrapping everything in Link is tricky with dnd-kit.
           Better to just have a specific "View" area or rely on double click?
           Or just make the title a link.
       */}
    </div>
  );
}
