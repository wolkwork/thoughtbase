import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { cn } from "~/lib/utils";
import { RoadmapCard } from "./roadmap-card";

interface RoadmapColumnProps {
  id: string;
  title: string;
  ideas: any[];
  publicOrgSlug?: string;
}

export function RoadmapColumn({ id, title, ideas, publicOrgSlug }: RoadmapColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: id,
  });

  return (
    <div className="flex h-full w-80 flex-col gap-4 rounded-lg bg-muted/50 p-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm uppercase text-muted-foreground">
            {title}
        </h3>
        <span className="text-xs font-medium bg-muted px-2 py-0.5 rounded-full border">
            {ideas.length}
        </span>
      </div>

      <div
        ref={setNodeRef}
        className={cn(
            "flex flex-1 flex-col gap-2 overflow-y-auto min-h-[150px] rounded-md transition-colors",
            isOver && "bg-muted/80 ring-2 ring-primary/20"
        )}
      >
        <SortableContext items={ideas.map((i) => i.id)} strategy={verticalListSortingStrategy}>
          {ideas.map((idea) => (
            <RoadmapCard key={idea.id} idea={idea} publicOrgSlug={publicOrgSlug} />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}

