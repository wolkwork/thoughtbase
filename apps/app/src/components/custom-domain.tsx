"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, CheckCircle2, LoaderCircle, XCircle } from "lucide-react";
import { type HTMLAttributes, useState } from "react";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { $addDomain, $getDomainStatus } from "~/lib/api/custom-domain";
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

  if (data.status === "verified") {
    return (
      <div
        className={cn("text-muted-foreground flex w-full justify-start gap-2", className)}
        {...props}
      >
        <DomainStatusIcon domain={domain} />
        <p>Domain is configured correctly.</p>
      </div>
    );
  }

  return (
    <div className={cn("w-full space-y-4", className)} {...props}>
      <Badge variant="outline">{data.status}</Badge>
      {/* {data.status === "pending" ? (
        <div className="text-muted-foreground w-full text-left text-sm">
          Please set the following TXT record on{" "}
          <InlineSnippet>{data.dnsRecordsToSet?.[0]?.domain}</InlineSnippet> to prove ownership
          of <InlineSnippet>{domain}</InlineSnippet>:
        </div>
      ) : (
        <div className={cn("text-muted-foreground w-full text-left text-sm", className)}>
          Set the following DNS records to your domain provider:
        </div>
      )} */}

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
  const [domain, setDomain] = useState(defaultDomain);
  const queryClient = useQueryClient();

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
    },
  });

  console.log("DOMAIN", domain, defaultDomain);

  return (
    <form
      className="@container w-full"
      onSubmit={async (event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const customDomain = (data.get("customDomain") as string).toLowerCase();
        addDomainMutation.mutate(customDomain);
      }}
    >
      <Card className="flex flex-col">
        <CardHeader className="flex flex-col text-left">
          <CardTitle>Custom Domain</CardTitle>
          <CardDescription>The custom domain for your site.</CardDescription>
        </CardHeader>
        <CardContent className="relative flex w-full flex-col items-center justify-start gap-2 @sm:flex-row @sm:justify-between">
          <Input
            value={domain}
            maxLength={64}
            name="customDomain"
            onChange={(e) => {
              setDomain(e.target.value.toLowerCase());
            }}
            placeholder={"example.com"}
            type="text"
          />
          <Button
            className="w-full @sm:w-16"
            type="submit"
            variant="outline"
            disabled={addDomainMutation.isPending}
          >
            {addDomainMutation.isPending ? (
              <LoaderCircle className="animate-spin" />
            ) : (
              "Save"
            )}
          </Button>
        </CardContent>
        <CardFooter className="border-muted flex flex-col gap-4 border-t-2 pt-4 text-sm">
          <DomainConfiguration domain={defaultDomain} />
        </CardFooter>
      </Card>
    </form>
  );
};
