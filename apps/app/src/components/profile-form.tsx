import { useMutation } from "@tanstack/react-query";
import { LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { $upsertUnifiedProfile } from "~/lib/auth/unified-auth-functions";

interface ProfileFormProps {
  orgId: string;
  initialName?: string;
  onSuccess: () => void;
}

export function ProfileForm({ orgId, initialName = "", onSuccess }: ProfileFormProps) {
  const { mutate: upsertProfile, isPending } = useMutation({
    mutationFn: async (name: string) => {
      await $upsertUnifiedProfile({ data: { organizationId: orgId, name } });
    },
    onSuccess: () => {
      toast.success("Profile updated!");
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update profile");
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    upsertProfile(name);
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
          disabled={isPending}
        />
      </div>
      <Button type="submit" disabled={isPending}>
        {isPending && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
        Save
      </Button>
    </form>
  );
}
