import { useConvexMutation } from "@convex-dev/react-query";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { api } from "@thoughtbase/backend/convex/_generated/api";
import { Id } from "@thoughtbase/backend/convex/_generated/dataModel";
import { FunctionReturnType } from "convex/server";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { STATUSES, type IdeaStatus } from "~/components/status-badge";
import { usePermissions } from "~/hooks/use-permissions";
import { usePermissionsPublic } from "~/hooks/use-permissions-public";
import { RoadmapCard } from "./roadmap-card";
import { RoadmapColumn } from "./roadmap-column";

type Idea = (
  | NonNullable<FunctionReturnType<typeof api.ideas.getIdeasPublic>>["page"]
  | NonNullable<FunctionReturnType<typeof api.ideas.getIdeas>>
)[number];

interface RoadmapBoardProps {
  ideas: Idea[];
  readOnly?: boolean;
  orgSlug: string;
  isPublic?: boolean;
  organizationId: string;
}

const COLUMN_IDS: IdeaStatus[] = [
  "pending",
  "reviewing",
  "planned",
  "in_progress",
  "completed",
  "closed",
];

const COLUMNS = COLUMN_IDS.map((id) => ({
  id,
  title: STATUSES[id].label,
}));

export function RoadmapBoard({
  ideas,
  readOnly = false,
  orgSlug,
  isPublic = false,
  organizationId,
}: RoadmapBoardProps) {
  const [activeId, setActiveId] = useState<Id<"idea"> | null>(null);
  // Optimistic state
  const canWrite = isPublic
    ? usePermissionsPublic().canWrite()
    : usePermissions().canWrite();
  const effectiveReadOnly = readOnly || !canWrite;

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  );

  const updateStatus = useConvexMutation(api.ideas.updateIdeaStatus).withOptimisticUpdate(
    (localStorage, args) => {
      const currentValue = localStorage.getQuery(api.ideas.getIdeas, { organizationId });
      // Replace updated idea with new status optimistically
      if (!currentValue) return;
      localStorage.setQuery(
        api.ideas.getIdeas,
        { organizationId },
        currentValue.map((idea) =>
          idea._id === args.ideaId
            ? {
                ...idea,
                status: args.status,
              }
            : idea,
        ),
      );
    },
  );

  const groupedIdeas = useMemo(() => {
    // Ensure all IdeaStatus columns are present, even if empty
    const groups = COLUMNS.reduce(
      (acc, col) => {
        acc[col.id] = [];
        return acc;
      },
      {} as Record<IdeaStatus, Idea[]>,
    );

    for (const idea of ideas) {
      if (groups[idea.status]) {
        groups[idea.status].push(idea);
      }
    }

    return groups;
  }, [ideas]);

  const handleDragStart = (event: DragStartEvent) => {
    if (effectiveReadOnly) {
      toast.error("Upgrade to change idea status");
      return;
    }
    setActiveId(event.active.id as Id<"idea">);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    if (effectiveReadOnly) return;
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeIdeaId = active.id as Id<"idea">;
    // Determine the target status.
    // If over a container (column), it's the column ID.
    // If over an item, we need to find the item's status or parent container.
    // Since we use SortableContext, 'over.id' might be an item ID.

    let newStatus = over.id as IdeaStatus;

    // Check if dropped on an item instead of a column
    const overItem = ideas.find((i) => i._id === over.id);
    if (overItem) {
      newStatus = overItem.status;
    }

    // Verify newStatus is a valid column
    const isValidColumn = COLUMNS.some((c) => c.id === newStatus);
    if (!isValidColumn) return;

    const activeIdea = ideas.find((i) => i._id === activeIdeaId);
    if (!activeIdea || activeIdea.status === newStatus) return;

    // Server Update
    if (organizationId) {
      updateStatus({
        ideaId: activeIdeaId,
        status: newStatus as IdeaStatus,
        organizationId,
      });
    }
  };

  const activeIdea = activeId ? ideas.find((i) => i._id === activeId) : null;

  if (effectiveReadOnly) {
    // Hide pending column in public view
    const publicColumns = COLUMNS.filter(
      (col) => !["pending", "closed"].includes(col.id),
    );
    return (
      <div className="flex gap-4 overflow-x-auto pb-4">
        {publicColumns.map((col) => (
          <RoadmapColumn
            key={col.id}
            id={col.id}
            title={col.title}
            ideas={groupedIdeas[col.id] || []}
            orgSlug={orgSlug}
            isPublic={isPublic}
          />
        ))}
      </div>
    );
  }

  return (
    <DndContext
      sensors={effectiveReadOnly ? [] : sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex w-fit gap-4 overflow-x-auto pb-4">
        {COLUMNS.map((col) => (
          <RoadmapColumn
            key={col.id}
            id={col.id}
            title={col.title}
            ideas={groupedIdeas[col.id] || []}
            orgSlug={orgSlug}
            isPublic={isPublic}
          />
        ))}
      </div>

      <DragOverlay>
        {activeIdea ? (
          <RoadmapCard idea={activeIdea} orgSlug={orgSlug} isPublic={isPublic} />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
