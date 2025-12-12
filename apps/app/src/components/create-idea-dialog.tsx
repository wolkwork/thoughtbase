import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { $createIdea } from "~/lib/api/ideas";
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
  orgSlug?: string;
}

export function CreateIdeaDialog({
  open,
  onOpenChange,
  organizationId,
  orgSlug,
}: CreateIdeaDialogProps) {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const { mutate: createIdea, isPending } = useMutation({
    mutationFn: $createIdea,
    onSuccess: (newIdea) => {
      toast.success("Idea created successfully");
      onOpenChange(false);
      setTitle("");
      setDescription("");

      // Navigate to the new idea's detail page
      if (orgSlug && organizationId) {
        navigate({
          to: "/dashboard/$orgSlug/ideas/$ideaId",
          params: { orgSlug, ideaId: newIdea.id },
        });
      }
    },
    onError: () => {
      toast.error("Failed to create idea");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!organizationId) {
      toast.error("Organization ID is required");
      return;
    }
    createIdea({ data: { title, description, organizationId } });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create Idea</DialogTitle>
          <DialogDescription>
            Share your idea or feedback with the team.
          </DialogDescription>
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
              className="min-h-[100px]"
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
