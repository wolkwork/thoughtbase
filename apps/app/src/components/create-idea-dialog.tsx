import { useConvexMutation } from "@convex-dev/react-query";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "@thoughtbase/backend/convex/_generated/api";
import { Id } from "@thoughtbase/backend/convex/_generated/dataModel";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";

interface CreateIdeaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId?: string;
  orgSlug: string;
  onSuccess?: (newIdea: { _id: Id<"idea">; title: string }) => void;
}

export function CreateIdeaDialog({
  open,
  onOpenChange,
  organizationId,
  orgSlug,
  onSuccess,
}: CreateIdeaDialogProps) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isPending, setIsPending] = useState(false);

  const createIdea = useConvexMutation(api.ideas.createIdea);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organizationId) {
      toast.error("Organization ID is required");
      return;
    }

    setIsPending(true);
    try {
      const newIdea = await createIdea({
        organizationId,
        title,
        description: description || undefined,
      });

      toast.success("Idea created successfully");
      // Invalidate sidebar counts and ideas list
      queryClient.invalidateQueries({
        queryKey: [api.ideas.getSidebarCounts, { organizationId }],
      });
      queryClient.invalidateQueries({
        queryKey: [api.ideas.getIdeas, { organizationId }],
      });
      onOpenChange(false);
      setTitle("");
      setDescription("");
      onSuccess?.(newIdea);
    } catch (error) {
      console.error("Failed to create idea:", error);
      toast.error("Failed to submit idea");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Submit Idea</DialogTitle>
          <DialogDescription>Share your idea or feedback.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Brief summary of your idea"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="More details..."
              className="field-sizing-content min-h-[120px]"
            />
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={isPending}>
              {isPending ? "Creating..." : "Create Request"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
