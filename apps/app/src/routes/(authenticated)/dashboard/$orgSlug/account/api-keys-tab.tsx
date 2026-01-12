import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { CopyButton } from "~/components/ui/shadcn-io/copy-button";
import { authClient } from "~/lib/auth/auth-client";

type ApiKey = {
  id: string;
  name: string | null;
  startsWith?: string;
  enabled: boolean;
  expiresAt: string | null;
  createdAt: string;
};

export function ApiKeysTab() {
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyValue, setNewKeyValue] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Fetch API keys
  const { data: apiKeys, isLoading } = useQuery({
    queryKey: ["api-keys"],
    queryFn: async () => {
      const result = await authClient.apiKey.list();
      return result.data;
    },
  });

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) {
      toast.error("Please enter a name for the API key");
      return;
    }

    setIsCreating(true);
    try {
      const result = await authClient.apiKey.create({
        name: newKeyName.trim(),
      });

      if (result.data?.key) {
        setNewKeyValue(result.data.key);
        setNewKeyName("");
        toast.success("API key created successfully");
        queryClient.invalidateQueries({ queryKey: ["api-keys"] });
      } else {
        toast.error("Failed to create API key");
      }
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Failed to create API key");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteKey = async (keyId: string) => {
    setIsDeleting(keyId);
    try {
      await authClient.apiKey.delete({ keyId });
      toast.success("API key deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["api-keys"] });
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Failed to delete API key");
    } finally {
      setIsDeleting(null);
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setNewKeyValue(null);
    setNewKeyName("");
  };

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>API Keys</CardTitle>
              <CardDescription>
                Manage your API keys for programmatic access to your account.
              </CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger
                render={
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Create API Key
                  </Button>
                }
              />
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create API Key</DialogTitle>
                  <DialogDescription>
                    Create a new API key to access your account programmatically. Make
                    sure to copy it now - you won't be able to see it again!
                  </DialogDescription>
                </DialogHeader>
                {newKeyValue ? (
                  <div className="space-y-4">
                    <div className="bg-muted rounded-lg border p-4">
                      <Label className="text-sm font-medium">Your API Key</Label>
                      <div className="mt-2 flex items-center gap-2">
                        <Input
                          value={newKeyValue}
                          readOnly
                          className="font-mono text-sm"
                        />
                        <CopyButton content={newKeyValue} variant="outline" />
                      </div>
                      <p className="text-muted-foreground mt-2 text-xs">
                        This is the only time you'll see this key. Make sure to copy it
                        now.
                      </p>
                    </div>
                    <DialogFooter>
                      <Button onClick={handleCloseDialog}>Done</Button>
                    </DialogFooter>
                  </div>
                ) : (
                  <form onSubmit={handleCreateKey}>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="keyName">Name</Label>
                        <Input
                          id="keyName"
                          placeholder="e.g., Production API Key"
                          value={newKeyName}
                          onChange={(e) => setNewKeyName(e.target.value)}
                          required
                        />
                        <p className="text-muted-foreground text-xs">
                          Give your API key a descriptive name to help you identify it
                          later.
                        </p>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={handleCloseDialog}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={isCreating}>
                        {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Create Key
                      </Button>
                    </DialogFooter>
                  </form>
                )}
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
            </div>
          ) : !apiKeys || apiKeys.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-muted-foreground">
                No API keys found. Create your first API key to get started.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {apiKeys.map((key) => (
                <div
                  key={key.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{key.name || "Unnamed Key"}</p>
                      {!key.enabled && (
                        <span className="bg-muted text-muted-foreground rounded px-2 py-0.5 text-xs">
                          Disabled
                        </span>
                      )}
                    </div>
                    <div className="mt-1 space-y-1">
                      {key.start && (
                        <p className="text-muted-foreground font-mono text-sm">
                          {key.start}...
                        </p>
                      )}
                      <p className="text-muted-foreground text-xs">
                        Created {new Date(key.createdAt).toLocaleDateString()}
                        {key.expiresAt && (
                          <span>
                            {" • "}
                            Expires {new Date(key.expiresAt).toLocaleDateString()}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteKey(key.id)}
                    disabled={isDeleting === key.id}
                  >
                    {isDeleting === key.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="text-destructive h-4 w-4" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
