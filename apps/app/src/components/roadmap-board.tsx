import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { STATUSES, type IdeaStatus } from "~/components/status-badge";
import { usePermissions } from "~/hooks/use-permissions";
import { usePermissionsPublic } from "~/hooks/use-permissions-public";
import { $updateIdeaStatus } from "~/lib/api/ideas";
import { Permission } from "~/plans";
import { RoadmapCard } from "./roadmap-card";
import { RoadmapColumn } from "./roadmap-column";

interface RoadmapBoardProps {
  ideas: any[];
  readOnly?: boolean;
  orgSlug: string;
  isPublic?: boolean;
  organizationId?: string;
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
  ideas: initialIdeas,
  readOnly = false,
  orgSlug,
  isPublic = false,
  organizationId,
}: RoadmapBoardProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeId, setActiveId] = useState<string | null>(null);
  // Optimistic state
  const [items, setItems] = useState(initialIdeas);
  const { hasPermission } = isPublic ? usePermissionsPublic() : usePermissions();
  const canWrite = hasPermission(Permission.WRITE);
  const effectiveReadOnly = readOnly || !canWrite;

  // Update local state when props change (e.g. real data refresh)
  useMemo(() => {
    setItems(initialIdeas);
  }, [initialIdeas]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  );

  const { mutate: updateStatus } = useMutation({
    mutationFn: $updateIdeaStatus,
    onMutate: async (variables) => {
      // Optimistic update handled in onDragEnd, this is just for rollback/sync
    },
    onError: (error: Error) => {
      if (error.message.includes("trial has ended")) {
        toast.error("Upgrade to change idea status");
      } else {
        toast.error("Failed to update status");
      }
      router.invalidate(); // Revert on error
    },
    onSuccess: () => {
      // Invalidate sidebar counts and ideas list
      if (organizationId) {
        queryClient.invalidateQueries({ queryKey: ["sidebar-counts", organizationId] });
        queryClient.invalidateQueries({ queryKey: ["ideas", "all"] });
      }
      router.invalidate();
    },
  });

  const groupedIdeas = useMemo(() => {
    const groups: Record<string, any[]> = {};
    COLUMNS.forEach((col) => {
      groups[col.id] = [];
    });
    items.forEach((idea) => {
      if (groups[idea.status]) {
        groups[idea.status].push(idea);
      }
    });
    return groups;
  }, [items]);

  const handleDragStart = (event: DragStartEvent) => {
    if (effectiveReadOnly) {
      toast.error("Upgrade to change idea status");
      return;
    }
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    if (effectiveReadOnly) return;
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeIdeaId = active.id as string;
    // Determine the target status.
    // If over a container (column), it's the column ID.
    // If over an item, we need to find the item's status or parent container.
    // Since we use SortableContext, 'over.id' might be an item ID.

    let newStatus = over.id as string;

    // Check if dropped on an item instead of a column
    const overItem = items.find((i) => i.id === over.id);
    if (overItem) {
      newStatus = overItem.status;
    }

    // Verify newStatus is a valid column
    const isValidColumn = COLUMNS.some((c) => c.id === newStatus);
    if (!isValidColumn) return;

    const activeIdea = items.find((i) => i.id === activeIdeaId);
    if (!activeIdea || activeIdea.status === newStatus) return;

    // Optimistic Update
    setItems((prev) =>
      prev.map((item) =>
        item.id === activeIdeaId ? { ...item, status: newStatus } : item,
      ),
    );

    // Server Update
    if (organizationId) {
      updateStatus({
        data: { ideaId: activeIdeaId, status: newStatus, organizationId },
      });
    }
  };

  const activeIdea = activeId ? items.find((i) => i.id === activeId) : null;

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
