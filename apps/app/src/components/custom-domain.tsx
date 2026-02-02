"use client";

import { useConvexAction } from "@convex-dev/react-query";
import { api } from "@thoughtbase/backend/convex/_generated/api";
import { useAction } from "convex/react";
import { AlertCircle, CheckCircle2, Trash2, XCircle } from "lucide-react";
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
import { useOrganization } from "~/hooks/organization";
import { cn } from "~/lib/utils";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";

export type InlineSnippetProps = HTMLAttributes<HTMLSpanElement>;

export const InlineSnippet = ({ className, ...props }: InlineSnippetProps) => (
  <span
    className={cn("bg-muted py-0.2 rounded-md px-1 font-mono text-sm", className)}
    {...props}
  />
);

export type DomainConfigurationProps = HTMLAttributes<HTMLDivElement> & {
  domain: string;
};

export const DomainConfiguration = ({
  domain,
  className,
  ...props
}: DomainConfigurationProps) => {
  const organization = useOrganization();

  const getDomainStatus = useAction(api.organizations.refreshDomainStatus);

  return (
    <div className={cn("w-full space-y-4", className)} {...props}>
      <Button
        onClick={() => getDomainStatus({ domain, organizationId: organization?._id })}
      >
        Refresh
      </Button>
    </div>
  );
};

export const DomainStatusIcon = () => {
  const organization = useOrganization();

  const status = organization?.domainVerificationStatus;

  if (status === "verified") {
    return (
      <CheckCircle2
        className="text-white dark:text-white"
        fill="#2563EB"
        stroke="currentColor"
      />
    );
  }

  if (status === "pending") {
    return (
      <AlertCircle
        className="text-white dark:text-black"
        fill="#FBBF24"
        stroke="currentColor"
      />
    );
  }

  if (status === "invalid") {
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
  const organization = useOrganization();

  // Sync domain state with prop changes
  useEffect(() => {
    setDomain(defaultDomain ?? "");
  }, [defaultDomain ?? ""]);

  const addDomain = useConvexAction(api.organizations.addDomain);
  const removeDomain = useConvexAction(api.organizations.removeDomain);

  const handleAddDomain = async (event: React.FormEvent) => {
    event.preventDefault();
    const domainToAdd = newDomain.toLowerCase().trim();
    if (domainToAdd) {
      await addDomain({ domain: domainToAdd, organizationId });

      setDomain(domainToAdd);
      setDialogOpen(false);
      setNewDomain("");
    }
  };

  const status = organization?.domainVerificationStatus;

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
              <DomainStatusIcon />
              <div className="flex flex-col gap-1">
                <span className="text-base font-medium">{domain}</span>
                {status === "verified" && <p>Valid Configuration</p>}
                {status === "pending" && <Badge variant="outline">Pending</Badge>}
                {status === "invalid" && (
                  <Badge variant="destructive">Invalid Configuration</Badge>
                )}
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => removeDomain({ organizationId })}
            >
              <Trash2 className="h-4 w-4" />
              Remove
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
                  <Button type="submit">Add Domain</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </CardContent>
      {domain && status !== "verified" && (
        <CardFooter className="border-muted flex flex-col gap-4 border-t-2 pt-4 text-sm">
          <DomainConfiguration domain={domain} />
        </CardFooter>
      )}
    </Card>
  );
};
