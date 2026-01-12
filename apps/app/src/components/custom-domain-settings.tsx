import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, CheckCircle2, Loader2, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { CopyButton } from "~/components/ui/shadcn-io/copy-button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { usePermissions } from "~/hooks/use-permissions";
import {
  $getCustomDomainStatus,
  $setCustomDomain,
  $verifyDomain,
} from "~/lib/api/organizations";
import { Permission } from "~/plans";

interface CustomDomainSettingsProps {
  organizationId: string;
  orgSlug: string;
  onUpgrade?: () => void;
}

export function CustomDomainSettings({
  organizationId,
  orgSlug,
  onUpgrade,
}: CustomDomainSettingsProps) {
  const { hasPermission } = usePermissions();
  const canUseCustomDomain = hasPermission(Permission.CUSTOM_DOMAIN);
  const queryClient = useQueryClient();
  const [domain, setDomain] = useState("");

  const { data: domainStatus, isLoading } = useQuery({
    queryKey: ["custom-domain-status", organizationId],
    queryFn: () => $getCustomDomainStatus({ data: { organizationId } }),
    enabled: !!organizationId,
  });

  // Initialize domain from status
  useEffect(() => {
    if (domainStatus?.domain && !domain) {
      setDomain(domainStatus.domain);
    }
  }, [domainStatus, domain]);

  const verifyMutation = useMutation({
    mutationFn: () => $verifyDomain({ data: { organizationId } }),
    onSuccess: (result) => {
      if (result.verified) {
        toast.success("Domain verified successfully!");
        queryClient.invalidateQueries({
          queryKey: ["custom-domain-status", organizationId],
        });
      } else {
        // Don't show error toast on auto-poll, only show on manual verification
        if (!domainStatus?.status) {
          toast.error("Domain verification failed. Please check your DNS records.");
        }
        queryClient.invalidateQueries({
          queryKey: ["custom-domain-status", organizationId],
        });
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to verify domain");
    },
  });

  // Auto-poll verification when status is pending
  useEffect(() => {
    if (domainStatus?.status === "pending") {
      const interval = setInterval(() => {
        queryClient.invalidateQueries({
          queryKey: ["custom-domain-status", organizationId],
        });
        // Trigger verification check
        verifyMutation.mutate();
      }, 15000); // Poll every 15 seconds

      return () => clearInterval(interval);
    }
  }, [domainStatus?.status, organizationId, queryClient, verifyMutation]);

  const setDomainMutation = useMutation({
    mutationFn: (domain: string) =>
      $setCustomDomain({ data: { organizationId, domain } }),
    onSuccess: (data) => {
      toast.success("Domain configured. Please add the DNS records below.");
      queryClient.invalidateQueries({
        queryKey: ["custom-domain-status", organizationId],
      });
      // Start verification after a short delay
      setTimeout(() => {
        verifyMutation.mutate();
      }, 2000);
    },
    onError: (error: Error) => {
      if (error.message.includes("trial") || error.message.includes("Upgrade")) {
        toast.error("Custom domain is a Pro plan feature. Please upgrade to continue.");
        onUpgrade?.();
      } else {
        toast.error(error.message || "Failed to set custom domain");
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canUseCustomDomain) {
      toast.error("Custom domain is a Pro plan feature. Please upgrade to continue.");
      onUpgrade?.();
      return;
    }
    setDomainMutation.mutate(domain);
  };

  const handleVerify = () => {
    verifyMutation.mutate();
  };

  if (!canUseCustomDomain) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Custom Domain</CardTitle>
          <CardDescription>
            Use your own subdomain for your Thoughtbase board.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Custom domains are available on the Pro and Business plans.{" "}
              {onUpgrade && (
                <Button
                  variant="link"
                  className="h-auto p-0 font-semibold"
                  onClick={onUpgrade}
                >
                  Upgrade now
                </Button>
              )}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const cnameTarget = `${orgSlug}.thoughtbase.app`;
  const txtRecordName = domainStatus?.domain
    ? `_thoughtbase-verify.${domainStatus.domain}`
    : `_thoughtbase-verify.yourdomain.com`;
  const verificationToken = domainStatus?.verificationToken || "";

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Custom Domain</CardTitle>
          <CardDescription>
            Configure a custom domain for your Thoughtbase board. You'll need to add DNS
            records to verify ownership.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="domain">Domain</Label>
              <Input
                id="domain"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="feedback.example.com"
                disabled={setDomainMutation.isPending || isLoading}
              />
              <p className="text-muted-foreground text-xs">
                Enter your custom domain (e.g., feedback.example.com)
              </p>
            </div>

            <Button
              type="submit"
              disabled={setDomainMutation.isPending || isLoading || !domain.trim()}
            >
              {setDomainMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Domain"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {domainStatus?.domain && (
        <Card>
          <CardHeader>
            <CardTitle>DNS Configuration</CardTitle>
            <CardDescription>
              Add these DNS records to your domain to verify ownership and enable the
              custom domain.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Verification Failed Alert */}
            {domainStatus.status === "failed" && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Domain verification failed. Please verify that both DNS records are
                  correctly configured. DNS propagation may take up to 48 hours. If you
                  just added the records, please wait a few minutes and try verifying
                  again.
                </AlertDescription>
              </Alert>
            )}

            {/* DNS Records Table */}
            <div className="space-y-4">
              <Label className="text-sm font-semibold">DNS Records</Label>
              <p className="text-muted-foreground text-xs">
                Add these DNS records to your domain to verify ownership and enable the
                custom domain.
              </p>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">CNAME</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <code className="font-mono text-sm">{domainStatus.domain}</code>
                          <CopyButton variant="outline" content={domainStatus.domain} />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <code className="font-mono text-sm">{cnameTarget}</code>
                          <CopyButton variant="outline" content={cnameTarget} />
                        </div>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">TXT</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <code className="font-mono text-sm">{txtRecordName}</code>
                          <CopyButton variant="outline" content={txtRecordName} />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <code className="font-mono text-sm">{verificationToken}</code>
                          <CopyButton variant="outline" content={verificationToken} />
                        </div>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Verify Button */}
            <div className="flex items-center gap-5">
              <Button
                onClick={handleVerify}
                disabled={verifyMutation.isPending || !domainStatus.domain}
                variant="outline"
              >
                {verifyMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  "Verify Domain"
                )}
              </Button>
              {domainStatus.status && (
                <div className="flex items-center gap-1.5">
                  {domainStatus.status === "verified" ? (
                    <>
                      <CheckCircle2 className="size-4 text-green-600" />
                      <span className="font-medium text-green-600">Domain verified</span>
                    </>
                  ) : domainStatus.status === "failed" ? (
                    <>
                      <XCircle className="size-4 text-red-600" />
                      <span className="font-medium text-red-600">
                        Verification failed
                      </span>
                    </>
                  ) : (
                    <>
                      <Loader2 className="size-4 animate-spin text-blue-600" />
                      <span className="font-medium text-blue-600">
                        Verification pending
                      </span>
                    </>
                  )}
                </div>
              )}
              {domainStatus.status === "pending" && (
                <p className="text-muted-foreground text-xs">
                  Verification is being checked automatically. DNS changes may take a few
                  minutes to propagate.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
