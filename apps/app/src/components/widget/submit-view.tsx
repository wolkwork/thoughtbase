import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { createWidgetIdea } from "~/lib/api/widget-client";

interface SubmitViewProps {
  organizationId: string;
  ssoToken?: string;
}

export function SubmitView({ organizationId, ssoToken }: SubmitViewProps) {
  const [description, setDescription] = useState("");

  const { mutate: createIdea, isPending } = useMutation({
    mutationFn: createWidgetIdea,
    onSuccess: () => {
      toast.success("Feedback submitted!");
      setDescription("");
    },
    onError: () => {
      toast.error("Failed to submit feedback");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createIdea({
      title: description.slice(0, 50), // Simple title generation
      description,
      organizationId,
      token: ssoToken, // Pass optional SSO token
    });
  };

  return (
    <div className="flex flex-1 flex-col gap-8">
      <div className="border-b px-6 pb-6">
        <h2 className="text-2xl font-bold">Submit Idea</h2>
        <p className="text-muted-foreground">Share your ideas or suggestions</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-8 px-6 pb-6">
        <textarea
          placeholder="Type your idea here..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="placeholder:text-muted-foreground field-sizing-content w-full resize-none text-base outline-none md:text-sm"
          required
        />

        {description.length > 0 && (
          <div className="animate-in fade-in mt-auto pt-2 duration-200">
            <Button type="submit" className="w-full" disabled={isPending || !description}>
              {isPending ? "Sending..." : "Submit Idea"}
            </Button>
          </div>
        )}
      </form>
    </div>
  );
}
