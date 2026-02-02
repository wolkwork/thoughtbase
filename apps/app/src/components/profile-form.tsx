import { useConvexMutation } from "@convex-dev/react-query";
import { api } from "@thoughtbase/backend/convex/_generated/api";
import { Id } from "@thoughtbase/backend/convex/_generated/dataModel";
import { useSessionId } from "convex-helpers/react/sessions";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";

interface ProfileFormProps {
  orgId: string;
  initialName?: string;
  onSuccess: () => void;
}

export function ProfileForm({ orgId, initialName = "", onSuccess }: ProfileFormProps) {
  const upsertProfile = useConvexMutation(api.profiles.upsertProfile);

  const [sessionId] = useSessionId();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    upsertProfile({
      organizationId: orgId,
      name,
      sessionId: sessionId as Id<"externalSession"> | "no-external-session",
    });
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="profile-name">Display Name</Label>
        <Input
          id="profile-name"
          name="name"
          placeholder="Your Name"
          defaultValue={initialName}
          required
        />
      </div>
      <Button type="submit">Save</Button>
    </form>
  );
}
