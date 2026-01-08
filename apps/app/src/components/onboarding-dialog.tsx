import {
  CheckIcon,
  LinkSimpleIcon,
  PaletteIcon,
  WrenchIcon,
} from "@phosphor-icons/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "@tanstack/react-router";
import { Copy, ExternalLink, Loader2 } from "lucide-react";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import type { BundledLanguage } from "shiki";
import { toast } from "sonner";
import { BrandingSettings } from "~/components/branding-settings";
import { SubscriptionDialog } from "~/components/subscription-dialog";
import { InviteMemberForm } from "~/components/team-settings";
import { Button } from "~/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "~/components/ui/dialog";
import { ShikiCodeBlock } from "~/components/ui/shiki-code-block";
import { $generateOrgSecret, $getOrgSecret } from "~/lib/api/organizations";
import { cn } from "~/lib/utils";
import { CopyButton } from "./ui/shadcn-io/copy-button";

type StepId =
  | "install-widget"
  | "enable-auto-login"
  | "invite-team"
  | "customize-branding"
  | "share-board"
  | "setup-custom-domain";

interface Step {
  id: StepId;
  title: string;
  description: string;
  icon: ReactNode;
}

const STEPS: Step[] = [
  {
    id: "install-widget",
    title: "Install the widget",
    description: "Embed ThoughtBase in your product",
    icon: <WrenchIcon className="h-5 w-5" weight="duotone" />,
  },
  // TODO: Business plan
  // {
  //   id: "enable-auto-login",
  //   title: "Enable auto login",
  //   description: "SSO so users are signed in automatically",
  //   icon: <KeyIcon className="h-5 w-5" weight="duotone" />,
  // },
  // TODO: Start plan
  // {
  //   id: "invite-team",
  //   title: "Invite your team",
  //   description: "Bring teammates into this workspace",
  //   icon: <UsersThreeIcon className="h-5 w-5" weight="duotone" />,
  // },
  {
    id: "customize-branding",
    title: "Customize branding",
    description: "Upload logo + set workspace name",
    icon: <PaletteIcon className="h-5 w-5" weight="duotone" />,
  },
  // TODO: Start plan
  // {
  //   id: "setup-custom-domain",
  //   title: "Setup custom domain",
  //   description: "Use your own domain (paid feature)",
  //   icon: <GlobeIcon className="h-5 w-5" weight="duotone" />,
  // },
  {
    id: "share-board",
    title: "Share your board",
    description: "Send the public link to customers",
    icon: <LinkSimpleIcon className="h-5 w-5" weight="duotone" />,
  },
];

interface OnboardingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgSlug: string;
  organizationId?: string;
}

export function OnboardingDialog({
  open,
  onOpenChange,
  orgSlug,
  organizationId,
}: OnboardingDialogProps) {
  const [activeStepId, setActiveStepId] = useState<StepId>("install-widget");
  const [subscriptionOpen, setSubscriptionOpen] = useState(false);

  const activeStep = useMemo(
    () => STEPS.find((s) => s.id === activeStepId) ?? STEPS[0],
    [activeStepId],
  );

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="h-[90vh] w-full max-w-4xl gap-0 overflow-hidden p-0 sm:rounded-xl md:h-[600px]">
          <div className="grid h-full min-h-0 grid-cols-1 md:grid-cols-12">
            {/* Sidebar */}
            <div className="bg-muted/30 col-span-1 flex h-full min-h-0 flex-col border-r p-6 md:col-span-5">
              <DialogHeader className="mb-6 text-left">
                <DialogTitle className="text-xl">Getting started</DialogTitle>
                <div className="text-muted-foreground mt-2 space-y-3 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="flex size-4.5 items-center justify-center rounded-full bg-green-200">
                      <CheckIcon className="size-3 text-green-600" />
                    </div>
                    <span>Finish setup in 5 minutes.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="flex size-5 items-center justify-center rounded-full bg-green-200">
                      <CheckIcon className="size-3 text-green-600" />
                    </div>
                    <span>Use existing workspace settings where possible.</span>
                  </div>
                </div>
              </DialogHeader>

              <div className="min-h-0 flex-1 space-y-1 overflow-y-auto">
                {STEPS.map((step) => {
                  const isActive = step.id === activeStepId;
                  return (
                    <button
                      key={step.id}
                      type="button"
                      onClick={() => setActiveStepId(step.id)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-left transition-colors",
                        isActive
                          ? "border-border bg-background"
                          : "hover:bg-background/60 text-muted-foreground border-transparent",
                      )}
                    >
                      <div
                        className={cn(
                          "shrink-0",
                          isActive ? "text-primary" : "text-muted-foreground",
                        )}
                      >
                        {step.icon}
                      </div>
                      <span
                        className={cn(
                          "text-sm font-medium",
                          !isActive && "text-foreground/80",
                        )}
                      >
                        {step.title}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Main Content */}
            <div className="col-span-1 flex h-full min-h-0 flex-col md:col-span-7">
              <div className="min-h-0 flex-1 overflow-y-auto p-6 md:p-8">
                <div className="mb-6">
                  <h2 className="mb-2 text-2xl font-bold">{activeStep.title}</h2>
                  <p className="text-muted-foreground">{activeStep.description}</p>
                </div>

                <div className="space-y-6">
                  {activeStepId === "install-widget" && (
                    <InstallWidgetStep organizationSlug={orgSlug} />
                  )}
                  {activeStepId === "enable-auto-login" && (
                    <EnableAutoLoginStep organizationId={organizationId} />
                  )}
                  {activeStepId === "invite-team" && (
                    <InviteTeamStep orgSlug={orgSlug} organizationId={organizationId} />
                  )}
                  {activeStepId === "customize-branding" && (
                    <CustomizeBrandingStep organizationId={organizationId} />
                  )}
                  {activeStepId === "share-board" && <ShareBoardStep orgSlug={orgSlug} />}
                  {activeStepId === "setup-custom-domain" && (
                    <SetupCustomDomainStep
                      organizationId={organizationId}
                      onUpgrade={() => setSubscriptionOpen(true)}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <SubscriptionDialog open={subscriptionOpen} onOpenChange={setSubscriptionOpen} />
    </>
  );
}

function CodeSnippet({
  label,
  value,
  lang,
}: {
  label: string;
  value: string;
  lang: BundledLanguage;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <div className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
          {label}
        </div>
      </div>
      <div className="relative">
        <CopyButton
          variant="outline"
          content={value}
          className="absolute top-2 right-2"
        />
        <ShikiCodeBlock code={value} lang={lang} />
      </div>
    </div>
  );
}

function InstallWidgetStep({ organizationSlug }: { organizationSlug: string }) {
  const scriptSrc =
    typeof window !== "undefined" ? `${window.location.origin}/widget.js` : "/widget.js";

  const installScript = `<script src="${scriptSrc}"></script>`;

  const initSnippet = `<script>
  window.thoughtbase.initWidget({
    organizationSlug: "${organizationSlug}",
  });
</script>`;

  const customButtonSnippet = `<button id="feedback-btn">Give feedback</button>

<script src="${scriptSrc}"></script>
<script>
  window.thoughtbase.initWidget({
    organizationSlug: "${organizationSlug}",
    selector: "#feedback-btn",
  });
</script>`;

  return (
    <div className="space-y-6">
      <div className="rounded-lg border p-4">
        <div className="text-sm font-medium">Organization ID</div>
        <div className="text-muted-foreground mt-1 text-sm">
          You’ll need this when embedding the widget.
        </div>
        <div className="mt-3 flex items-center gap-2">
          <code className="bg-muted rounded px-2 py-1 text-xs">{organizationSlug}</code>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(organizationSlug);
                toast.success("Organization ID copied");
              } catch {
                toast.error("Failed to copy");
              }
            }}
          >
            <Copy className="mr-2 h-4 w-4" />
            Copy
          </Button>
        </div>
      </div>

      <CodeSnippet label="1) Add the script" value={installScript} lang="html" />
      <CodeSnippet label="2) Initialize" value={initSnippet} lang="html" />
      <CodeSnippet
        label="Optional: use your own button"
        value={customButtonSnippet}
        lang="html"
      />
    </div>
  );
}

function EnableAutoLoginStep({ organizationId }: { organizationId?: string }) {
  const queryClient = useQueryClient();

  const { data, isPending } = useQuery({
    queryKey: ["org-secret", organizationId],
    queryFn: async () => {
      if (!organizationId) return { secret: null as string | null };
      return await $getOrgSecret({ data: { organizationId } });
    },
    enabled: !!organizationId,
  });

  const { mutate: generateSecret, isPending: isGenerating } = useMutation({
    mutationFn: async () => {
      if (!organizationId) throw new Error("Missing organizationId");
      return await $generateOrgSecret({ data: { organizationId } });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["org-secret", organizationId] });
      toast.success("SSO secret generated");
    },
    onError: () => toast.error("Failed to generate secret"),
  });

  const secret = data?.secret ?? null;

  const joseExample = `import { SignJWT } from "jose";

const secret = new TextEncoder().encode(process.env.THOUGHTBASE_ORG_SECRET);
const token = await new SignJWT({
  sub: user.id,
  email: user.email,
  name: user.name,
  image: user.avatarUrl,
})
  .setProtectedHeader({ alg: "HS256" })
  .setIssuedAt()
  .setExpirationTime("1h")
  .sign(secret);

// Pass token into the widget as ssoToken`;

  return (
    <div className="space-y-6">
      <div className="rounded-lg border p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-sm font-medium">SSO secret</div>
            <div className="text-muted-foreground mt-1 text-sm">
              Used to sign JWTs so the widget can auto-login your users.
            </div>
          </div>
        </div>

        <div className="mt-4">
          {isPending ? (
            <div className="text-muted-foreground flex items-center gap-2 text-sm">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading...
            </div>
          ) : secret ? (
            <div className="flex items-center gap-2">
              <code className="bg-muted rounded px-2 py-1 text-xs">{secret}</code>
              <CopyButton variant="outline" content={secret} />
            </div>
          ) : (
            <Button
              type="button"
              onClick={() => generateSecret()}
              disabled={isGenerating}
            >
              {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Generate secret
            </Button>
          )}
        </div>
      </div>

      <CodeSnippet label="Generate JWT (Node / jose)" value={joseExample} lang="ts" />
      <div className="text-muted-foreground text-sm">
        After generating a token, pass it into the widget as{" "}
        <code className="bg-muted rounded px-1 py-0.5 text-xs">ssoToken</code>.
      </div>

      <Button
        variant="outline"
        size="sm"
        render={
          <a href="https://docs.thoughtbase.app/widget/guides/sso-integration">
            SSO Documentation
            <ExternalLink className="ml-1 inline h-4 w-4" />
          </a>
        }
      />
    </div>
  );
}

function InviteTeamStep({
  orgSlug,
  organizationId,
}: {
  orgSlug: string;
  organizationId?: string;
}) {
  if (!organizationId) {
    return <div className="text-muted-foreground text-sm">No organization selected.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border p-4">
        <div className="text-sm font-medium">Invite a teammate</div>
        <div className="text-muted-foreground mt-1 text-sm">
          They’ll receive an email invite and can join immediately.
        </div>
        <InviteMemberForm organizationId={organizationId} submitLabel="Send invite" />
      </div>

      <div className="text-muted-foreground text-sm">
        Manage roles and pending invitations in{" "}
        <Link
          to="/dashboard/$orgSlug/members"
          params={{ orgSlug }}
          className="text-primary font-medium hover:underline"
        >
          Users
        </Link>
        .
      </div>
    </div>
  );
}

function CustomizeBrandingStep({ organizationId }: { organizationId?: string }) {
  if (!organizationId) {
    return <div className="text-muted-foreground text-sm">No organization selected.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border p-4">
        <div className="text-sm font-medium">Workspace branding</div>
        <div className="text-muted-foreground mt-1 text-sm">
          Upload a logo and set the workspace name.
        </div>
        <div className="mt-4">
          <BrandingSettings organizationId={organizationId} />
        </div>
      </div>
    </div>
  );
}

function ShareBoardStep({ orgSlug }: { orgSlug: string }) {
  const location = useLocation();
  const url = new URL(location.url);
  const boardUrl = `${url.protocol}//${orgSlug}.${url.host}`;

  return (
    <div className="space-y-6">
      <div className="rounded-lg border p-4">
        <div className="text-sm font-medium">Public board link</div>
        <div className="text-muted-foreground mt-1 text-sm">
          Share this link with customers to collect feedback.
        </div>
        <div className="mt-3 flex flex-col gap-2">
          <code className="bg-muted rounded px-3 py-2 text-xs">{boardUrl}</code>
          <div className="flex items-center gap-2">
            <CopyButton variant="outline" content={boardUrl} />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => window.open(boardUrl, "_blank", "noopener,noreferrer")}
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Open
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SetupCustomDomainStep({
  organizationId,
  onUpgrade,
}: {
  organizationId?: string;
  onUpgrade: () => void;
}) {
  // const { data: subscriptions, isPending } = useQuery({
  //   queryKey: ["subscriptions", organizationId],
  //   queryFn: async () => {
  //     if (!organizationId) return null;
  //     const result = await authClient.customer.subscriptions.list({
  //       query: {
  //         referenceId: organizationId,
  //         active: true,
  //         limit: 1,
  //       },
  //     });
  //     return result.data;
  //   },
  //   enabled: !!organizationId,
  // });

  return (
    <span className="bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-xs font-medium">
      Coming soon
    </span>
  );
}
