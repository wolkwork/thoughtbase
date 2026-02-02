// @ts-nocheck - TODO: decide how to billing when open source

import { useRouteContext, useRouter } from "@tanstack/react-router";
import { Check, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "~/components/ui/dialog";
import { authClient } from "~/lib/auth/auth-client-convex";
import { cn } from "~/lib/utils";
import { plans } from "~/plans";
import { Badge } from "./ui/badge";

interface PlanFeature {
  title: string;
  description: string;
  icon: React.ReactNode;
}

interface Plan {
  id: string;
  name: string;
  price: {
    month: number;
    year: number;
  };
  description: string;
  features: PlanFeature[];
  popular?: boolean;
}

// Map plans.ts to UI format, excluding free plan
const PLANS: Plan[] = [
  {
    id: plans.start.slug,
    name: plans.start.name,
    price: plans.start.price,
    description: "Perfect for getting up and running",
    features: [
      {
        title: "Unlimited ideas",
        description: "As many ideas as you need",
        icon: <Check className="h-4 w-4" />,
      },
      {
        title: "Unlimited contributors",
        description: "As many participants as you want",
        icon: <Check className="h-4 w-4" />,
      },
      {
        title: "Unlimited admins",
        description: "Work together with your team",
        icon: <Check className="h-4 w-4" />,
      },
    ],
    popular: true,
  },
  {
    id: plans.pro.slug,
    name: plans.pro.name,
    price: plans.pro.price,
    description: "For teams that need more features",
    features: [
      {
        title: "Everything in Start",
        description: "All start features included",
        icon: <Check className="h-4 w-4" />,
      },
      {
        title: "Custom domain",
        description: "Use your own domain for your workspace",
        icon: <Check className="h-4 w-4" />,
      },
      {
        title: "Private boards",
        description: "Collect internal feedback that only your team can see",
        icon: <Check className="h-4 w-4" />,
      },
      {
        title: "White label",
        description: "Remove Thoughtbase branding",
        icon: <Check className="h-4 w-4" />,
      },
    ],
  },
  {
    id: plans.business.slug,
    name: plans.business.name,
    price: plans.business.price,
    description: "For larger organizations with advanced needs",
    features: [
      {
        title: "Everything in Pro",
        description: "All pro features included",
        icon: <Check className="h-4 w-4" />,
      },
      {
        title: "Automatic login",
        description: "Automatically login your users",
        icon: <Check className="h-4 w-4" />,
      },
      {
        title: "Integrations",
        description: "Connect with your favorite tools through Zapier",
        icon: <Check className="h-4 w-4" />,
      },
    ],
  },
];

interface SubscriptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SubscriptionDialog({ open, onOpenChange }: SubscriptionDialogProps) {
  const [selectedPlanId, setSelectedPlanId] = useState<string>(plans.start.slug);
  const [billingInterval, setBillingInterval] = useState<"month" | "year">("month");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const selectedPlan = PLANS.find((p) => p.id === selectedPlanId) || PLANS[0];
  const { organization, plan: currentPlan } = useRouteContext({
    from: "/(authenticated)/dashboard/$orgSlug",
  });

  const handleSubscribe = async () => {
    setIsLoading(true);
    try {
      if (!organization) {
        toast.error("No active organization found");
        return;
      }

      const checkout = await authClient.checkoutEmbed({
        slug: selectedPlan.id,
        referenceId: organization.id,
      });

      checkout.addEventListener("success", (event) => {
        if (!event.detail.redirect) {
          onOpenChange(false);
          router.invalidate();
          router.navigate({
            to: "/dashboard/$orgSlug/settings",
            params: { orgSlug: organization.slug },
            search: {
              success: true,
            },
          });
        }
      });
    } catch (error) {
      console.error(error);
      toast.error("Failed to start checkout. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="h-[90vh] w-full max-w-4xl gap-0 overflow-hidden p-0 sm:rounded-xl md:h-[600px]">
        <div className="grid h-full grid-cols-1 md:grid-cols-12">
          {/* Sidebar */}
          <div className="bg-muted/30 col-span-1 flex flex-col border-r p-6 md:col-span-5">
            <DialogHeader className="mb-6 text-left">
              <DialogTitle className="text-xl">Upgrade your workspace</DialogTitle>
              <div className="text-muted-foreground mt-2 space-y-1 text-sm">
                <div className="flex items-center gap-2">
                  <Check className="h-3 w-3 text-green-600" />
                  <span>Free 14-day trial, cancel anytime.</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-3 w-3 text-green-600" />
                  <span>Instant access to all features.</span>
                </div>
              </div>
            </DialogHeader>

            <div className="flex-1 space-y-3">
              {PLANS.map((plan) => (
                <div
                  key={plan.id}
                  onClick={() => setSelectedPlanId(plan.id)}
                  className={cn(
                    "hover:border-primary/50 cursor-pointer rounded-lg border p-4 transition-all",
                    selectedPlanId === plan.id
                      ? "border-primary bg-background ring-primary shadow-sm ring-1"
                      : "bg-background border-border",
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className={cn(
                          "h-2 w-2 rounded-full",
                          selectedPlanId === plan.id
                            ? "bg-primary"
                            : "bg-muted-foreground/30",
                        )}
                      />
                      <span className="font-medium">{plan.name}</span>
                      {currentPlan.slug === plan.id && (
                        <Badge className="bg-green-100 text-green-600">Current</Badge>
                      )}
                    </div>
                    <div className="text-sm font-medium">
                      ${plan.price[billingInterval]}{" "}
                      <span className="text-muted-foreground font-normal">
                        / {billingInterval === "month" ? "month" : "year"}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* TODO: Implement yearly billing */}
            {/* <div className="bg-background/50 mt-6 rounded-lg border border-dashed p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">Yearly billing</div>
                <Switch
                  checked={billingInterval === "year"}
                  onCheckedChange={(checked) =>
                    setBillingInterval(checked ? "year" : "month")
                  }
                />
              </div>
              <div className="text-muted-foreground mt-1 text-xs">
                Save up to 17% with yearly billing
              </div>
            </div> */}
          </div>

          {/* Main Content */}
          <div className="col-span-1 flex h-full flex-col overflow-y-auto p-6 md:col-span-7 md:p-8">
            <div className="flex-1">
              <div className="mb-8">
                <h2 className="mb-2 text-2xl font-bold">{selectedPlan.name} Plan</h2>
                <p className="text-muted-foreground">{selectedPlan.description}</p>
              </div>

              <div className="space-y-6">
                <h3 className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                  What's Included
                </h3>
                <div className="space-y-4">
                  {selectedPlan.features.map((feature, i) => (
                    <div key={i} className="flex gap-3">
                      <div className="bg-primary/10 text-primary mt-0.5 h-fit w-fit shrink-0 rounded-full p-1">
                        {feature.icon}
                      </div>
                      <div>
                        <div className="text-sm font-medium">{feature.title}</div>
                        <div className="text-muted-foreground text-sm">
                          {feature.description}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-8 border-t pt-6">
              <div className="mb-4 flex items-center justify-between">
                <div className="text-sm">Total due today</div>
                <div className="text-2xl font-bold">
                  $
                  {currentPlan.slug === "free"
                    ? "0"
                    : `${selectedPlan.price[billingInterval]}`}
                </div>
              </div>
              <Button
                className="w-full bg-green-600 text-white hover:bg-green-700"
                size="lg"
                onClick={handleSubscribe}
                disabled={isLoading || currentPlan.slug === selectedPlan.id}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {currentPlan.slug === "free"
                  ? "Start 14-day free trial"
                  : currentPlan.slug === selectedPlan.id
                    ? "Current Plan"
                    : "Upgrade to " + selectedPlan.name}
              </Button>
              <p className="text-muted-foreground mt-3 text-center text-xs">
                Secure checkout via Polar. Cancel anytime.
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
