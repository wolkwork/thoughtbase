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

type CreateIdeaReturnType = Awaited<ReturnType<typeof $createIdea>>;

interface CreateIdeaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId?: string;
  orgSlug: string;
  onSuccess?: (newIdea: CreateIdeaReturnType) => void;
}

export function CreateIdeaDialog({
  open,
  onOpenChange,
  organizationId,
  orgSlug,
  onSuccess,
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
      onSuccess?.(newIdea);
    },
    onError: () => {
      toast.error("Failed to submit idea");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!organizationId) {
      toast.error("Organization ID is required");
      return;
    }
    createIdea({ data: { title, description, organizationSlug: orgSlug } });
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
