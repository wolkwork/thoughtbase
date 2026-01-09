import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { cn } from "~/lib/utils";
import { RoadmapCard } from "./roadmap-card";
import { IdeaStatus, StatusPill } from "./status-badge";

interface RoadmapColumnProps {
  id: string;
  title: string;
  ideas: any[];
  orgSlug: string;
  isPublic?: boolean;
}

export function RoadmapColumn({
  id,
  title,
  ideas,
  orgSlug,
  isPublic = false,
}: RoadmapColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: id,
  });

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <StatusPill variant={id as IdeaStatus} />
        <span className="bg-muted h-5 rounded-full px-2 py-0.5 text-xs font-medium">
          {ideas.length}
        </span>
      </div>
      <div className="bg-muted/50 flex w-72 flex-col gap-4 rounded-lg border p-4">
        <div
          ref={setNodeRef}
          className={cn(
            "flex min-h-[150px] flex-1 flex-col gap-2 overflow-y-auto rounded-md transition-colors",
            isOver && "bg-muted/80 ring-primary/20 ring-2",
          )}
        >
          <SortableContext
            items={ideas.map((i) => i.id)}
            strategy={verticalListSortingStrategy}
          >
            {ideas.map((idea) => (
              <RoadmapCard
                key={idea.id}
                idea={idea}
                orgSlug={orgSlug}
                isPublic={isPublic}
              />
            ))}
          </SortableContext>
        </div>
      </div>
    </div>
  );
}
