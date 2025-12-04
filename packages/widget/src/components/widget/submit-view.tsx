import { Check } from "lucide-react";
import { useState } from "react";
import { createWidgetIdea } from "../../lib/api/widget-client";
import { Button } from "../ui/button";

interface SubmitViewProps {
  organizationId: string;
  ssoToken?: string;
}

export function SubmitView({ organizationId, ssoToken }: SubmitViewProps) {
  const [description, setDescription] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description) return;

    setIsPending(true);
    try {
      await createWidgetIdea({
        title: description.slice(0, 50),
        description,
        organizationId,
        token: ssoToken,
      });
      setIsSuccess(true);
      setDescription("");
    } catch (error) {
      // TODO: Show error message
    } finally {
      setIsPending(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="animate-in fade-in zoom-in-95 flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center duration-200">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600">
          <Check className="h-6 w-6" />
        </div>
        <div className="space-y-1">
          <h3 className="text-xl font-semibold">Thanks for your feedback!</h3>
          <p className="text-muted-foreground text-sm">
            We appreciate your input and will review it shortly.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => setIsSuccess(false)}
          className="mt-4"
        >
          Submit another idea
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-8">
      <div className="border-b px-6 pb-6">
        <h2 className="text-2xl font-bold">Submit Idea</h2>
        <p className="text-muted-foreground">Share your ideas or suggestions</p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex flex-1 flex-col gap-8 px-6 pb-6"
      >
        <textarea
          placeholder="Type your idea here..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="placeholder:text-muted-foreground field-sizing-content w-full resize-none text-base outline-none md:text-sm"
          required
        />

        {description.length > 0 && (
          <div className="animate-in fade-in mt-auto pt-2 duration-200">
            <Button
              type="submit"
              className="w-full"
              disabled={isPending || !description}
            >
              {isPending ? "Sending..." : "Submit Idea"}
            </Button>
          </div>
        )}
      </form>
    </div>
  );
}
