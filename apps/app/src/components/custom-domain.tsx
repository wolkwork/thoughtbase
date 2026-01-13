"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, CheckCircle2, LoaderCircle, Trash2, XCircle } from "lucide-react";
import { type HTMLAttributes, useEffect, useState } from "react";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import { $addDomain, $getDomainStatus, $removeDomain } from "~/lib/api/custom-domain";
import { cn } from "~/lib/utils";
import { DNSTable } from "./dns-table";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";

export type InlineSnippetProps = HTMLAttributes<HTMLSpanElement>;

export const InlineSnippet = ({ className, ...props }: InlineSnippetProps) => (
  <span
    className={cn("bg-muted py-0.2 rounded-md px-1 font-mono text-sm", className)}
    {...props}
  />
);

export const useDomainStatus = (domain: string) => {
  return useQuery({
    queryKey: ["domain-status", domain],
    queryFn: () => $getDomainStatus({ data: domain }),
    enabled: !!domain,
    refetchInterval: 20_000, // Poll every 20 seconds
  });
};

export type DomainConfigurationProps = HTMLAttributes<HTMLDivElement> & {
  domain: string;
};

export const DomainConfiguration = ({
  domain,
  className,
  ...props
}: DomainConfigurationProps) => {
  const { data, isLoading, refetch, isFetching } = useDomainStatus(domain);

  if (isLoading || !data) {
    return null;
  }

  return (
    <div className={cn("w-full space-y-4", className)} {...props}>
      <p>
        The DNS records at your provider must match the following records to verify and
        connect your domain to Thoughtbase.
      </p>

      {data.dnsRecordsToSet && <DNSTable records={data.dnsRecordsToSet || []} />}

      <div className="flex w-full justify-end">
        <Button
          disabled={isFetching}
          onClick={() => refetch()}
          size="sm"
          variant="outline"
        >
          {isFetching ? (
            <>
              <LoaderCircle className="animate-spin" /> Refresh
            </>
          ) : (
            "Refresh"
          )}
        </Button>
      </div>
    </div>
  );
};

export type DomainStatusIconProps = {
  domain: string;
};

export const DomainStatusIcon = ({ domain }: DomainStatusIconProps) => {
  const { data, isLoading } = useDomainStatus(domain);

  if (isLoading || !data?.status) {
    return <LoaderCircle className="animate-spin text-black dark:text-white" />;
  }

  if (data.status === "verified") {
    return (
      <CheckCircle2
        className="text-white dark:text-white"
        fill="#2563EB"
        stroke="currentColor"
      />
    );
  }

  if (data.status === "pending") {
    return (
      <AlertCircle
        className="text-white dark:text-black"
        fill="#FBBF24"
        stroke="currentColor"
      />
    );
  }

  if (data.status === "invalid") {
    return (
      <XCircle
        className="text-white dark:text-black"
        fill="#DC2626"
        stroke="currentColor"
      />
    );
  }

  if (data.status === "invalid") {
    return (
      <XCircle
        className="text-white dark:text-black"
        fill="#DC2626"
        stroke="currentColor"
      />
    );
  }

  return null;
};

export type CustomDomainProps = {
  defaultDomain?: string;
  organizationId: string;
};

export const CustomDomain = ({ defaultDomain, organizationId }: CustomDomainProps) => {
  const [domain, setDomain] = useState(defaultDomain ?? "");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newDomain, setNewDomain] = useState("");
  const queryClient = useQueryClient();
  const { data: domainStatus } = useDomainStatus(domain);

  // Sync domain state with prop changes
  useEffect(() => {
    setDomain(defaultDomain ?? "");
  }, [defaultDomain ?? ""]);

  const addDomainMutation = useMutation({
    mutationFn: (domain: string) =>
      $addDomain({
        data: { domain, organizationId },
      }),
    onSuccess: (_, customDomain) => {
      // Invalidate and refetch domain status
      queryClient.invalidateQueries({
        queryKey: ["domain-status", customDomain],
      });

      if (organizationId) {
        // Also invalidate organization domain status
        queryClient.invalidateQueries({
          queryKey: ["custom-domain-status", organizationId],
        });
      }

      setDomain(customDomain);
      setDialogOpen(false);
      setNewDomain("");
    },
  });

  const removeDomainMutation = useMutation({
    mutationFn: () =>
      $removeDomain({
        data: { organizationId },
      }),
    onSuccess: () => {
      // Invalidate queries
      if (domain) {
        queryClient.invalidateQueries({
          queryKey: ["domain-status", domain],
        });
      }

      if (organizationId) {
        queryClient.invalidateQueries({
          queryKey: ["custom-domain-status", organizationId],
        });
      }

      setDomain("");
    },
  });

  const handleAddDomain = async (event: React.FormEvent) => {
    event.preventDefault();
    const domainToAdd = newDomain.toLowerCase().trim();
    if (domainToAdd) {
      addDomainMutation.mutate(domainToAdd);
    }
  };

  return (
    <Card className="flex flex-col">
      <CardHeader className="flex flex-col text-left">
        <CardTitle>Custom Domain</CardTitle>
        <CardDescription>The custom domain for your site.</CardDescription>
      </CardHeader>
      <CardContent className="relative flex w-full flex-col gap-4">
        {domain ? (
          <div className="flex w-full items-center justify-between gap-4 rounded-lg border p-4">
            <div className="flex items-center gap-3">
              <DomainStatusIcon domain={domain} />
              <div className="flex flex-col gap-1">
                <span className="text-base font-medium">{domain}</span>
                {domainStatus?.status === "verified" && <p>Valid Configuration</p>}
                {domainStatus?.status === "pending" && (
                  <Badge variant="outline">Pending</Badge>
                )}
                {domainStatus?.status === "invalid" && (
                  <Badge variant="destructive">Invalid Configuration</Badge>
                )}
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => removeDomainMutation.mutate()}
              disabled={removeDomainMutation.isPending}
            >
              {removeDomainMutation.isPending ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  Remove
                </>
              )}
            </Button>
          </div>
        ) : (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger
              render={
                <Button className="w-fit px-5" size="lg">
                  Add Domain
                </Button>
              }
            />
            <DialogContent className="max-w-[450px]">
              <form onSubmit={handleAddDomain}>
                <DialogHeader>
                  <DialogTitle>Add Custom Domain</DialogTitle>
                  <DialogDescription>
                    Enter your custom domain to use for your Thoughtbase board.
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <Input
                    value={newDomain}
                    maxLength={64}
                    onChange={(e) => {
                      setNewDomain(e.target.value.toLowerCase());
                    }}
                    placeholder="example.com"
                    type="text"
                    autoFocus
                  />
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setDialogOpen(false);
                      setNewDomain("");
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={addDomainMutation.isPending || !newDomain.trim()}
                  >
                    {addDomainMutation.isPending ? (
                      <>
                        <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      "Add Domain"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </CardContent>
      {domain && domainStatus?.status !== "verified" && (
        <CardFooter className="border-muted flex flex-col gap-4 border-t-2 pt-4 text-sm">
          <DomainConfiguration domain={domain} />
        </CardFooter>
      )}
    </Card>
  );
};
