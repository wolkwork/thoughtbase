import { useMutation } from "@tanstack/react-query";
import { useRouteContext, useRouter } from "@tanstack/react-router";
import { FeedbackWidget } from "@thoughtbase/widget";
import { upload } from "@vercel/blob/client";
import { EyeIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { authClient } from "~/lib/auth/auth-client-convex";

interface BrandingSettingsProps {
  organizationId?: string;
}

export function BrandingSettings({ organizationId }: BrandingSettingsProps) {
  const { organization } = useRouteContext({
    from: "/(authenticated)/dashboard/$orgSlug",
  });

  const router = useRouter();

  const [name, setName] = useState("");
  const [logo, setLogo] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#000000");
  const [widgetOpen, setWidgetOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (organization) {
      setName(organization.name || "");
      setLogo(organization.logo || "");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const metadata = organization.metadata as any;

      let parsedMetadata: any = {};
      if (typeof metadata === "string") {
        try {
          parsedMetadata = JSON.parse(metadata);
        } catch (e) {
          // ignore
        }
      } else if (typeof metadata === "object") {
        parsedMetadata = metadata;
      }

      if (parsedMetadata?.primaryColor) {
        setPrimaryColor(parsedMetadata.primaryColor);
      }
    }
  }, [organization]);

  const { mutate: updateOrg, isPending } = useMutation({
    mutationFn: async (values: { name: string; logo: string; primaryColor: string }) => {
      if (!organizationId) throw new Error("Organization ID is required");

      // Preserve existing metadata
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const currentMetadata = organization?.metadata as any;
      let existingData = {};
      if (typeof currentMetadata === "string") {
        try {
          existingData = JSON.parse(currentMetadata);
        } catch (e) {
          // ignore
        }
      } else if (typeof currentMetadata === "object") {
        existingData = currentMetadata || {};
      }

      await authClient.organization.update({
        organizationId,
        data: {
          name: values.name,
          logo: values.logo,
          metadata: {
            ...existingData,
            primaryColor: values.primaryColor,
          },
        },
      });
    },
    onSuccess: () => {
      toast.success("Organization updated");
      router.invalidate();
    },
    onError: () => {
      toast.error("Failed to update organization");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateOrg({ name, logo, primaryColor });
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-2">
          <Label htmlFor="name">Organization Name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="My Organization"
            required
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="logo">Logo</Label>
          <div className="flex items-center gap-4">
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border">
              {logo ? (
                <img
                  src={logo}
                  alt="Logo preview"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="bg-muted flex h-full w-full items-center justify-center">
                  <span className="text-muted-foreground text-xs">No logo</span>
                </div>
              )}
            </div>
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Input
                id="logo"
                type="file"
                accept="image/*"
                disabled={isUploading}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;

                  if (file.size > 4.5 * 1024 * 1024) {
                    toast.error("File size must be less than 4.5MB");
                    e.target.value = "";
                    return;
                  }

                  setIsUploading(true);
                  try {
                    const newBlob = await upload(file.name, file, {
                      access: "public",
                      handleUploadUrl: "/api/upload",
                    });
                    setLogo(newBlob.url);
                    toast.success("Logo uploaded successfully");
                  } catch (error) {
                    toast.error("Failed to upload logo");
                    console.error(error);
                  } finally {
                    setIsUploading(false);
                    e.target.value = "";
                  }
                }}
              />
              <p className="text-muted-foreground text-xs">
                Upload a logo image (max 4.5MB).
              </p>
            </div>
          </div>
        </div>

        {/* <div className="grid gap-2">
        <Label htmlFor="primaryColor">Primary Color</Label>
        <div className="flex gap-2">
          <Input
            id="primaryColor"
            type="color"
            value={primaryColor}
            onChange={(e) => setPrimaryColor(e.target.value)}
            className="h-10 w-12 p-1 px-1"
          />
          <Input
            value={primaryColor}
            onChange={(e) => setPrimaryColor(e.target.value)}
            placeholder="#000000"
            className="font-mono"
          />
        </div>
      </div> */}

        <div className="mt-8 flex justify-start gap-2 border-t pt-5">
          <Button type="submit" disabled={isPending || isUploading}>
            {isPending ? "Saving..." : "Save Changes"}
          </Button>
          <Button onClick={() => setWidgetOpen(true)} variant="outline">
            <EyeIcon className="mr-2 h-4 w-4" />
            Preview Widget
          </Button>
          <FeedbackWidget
            isOpen={widgetOpen}
            onClose={() => setWidgetOpen(false)}
            organizationSlug={organization?.slug}
          />
        </div>
      </form>
    </>
  );
}
