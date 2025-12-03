import { Check, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "~/components/ui/dialog";
import { Switch } from "~/components/ui/switch";
import { authClient } from "~/lib/auth/auth-client";
import { cn } from "~/lib/utils";

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

const PLANS: Plan[] = [
  {
    id: "free",
    name: "Free",
    price: { month: 0, year: 0 },
    description: "Perfect for testing the waters",
    features: [
      {
        title: "14-day free trial",
        description: "Try all features risk-free, cancel anytime",
        icon: <Check className="h-4 w-4" />,
      },
      {
        title: "1 feedback board",
        description: "Create 1 public feedback board",
        icon: <Check className="h-4 w-4" />,
      },
    ],
  },
  {
    id: "starter",
    name: "Starter",
    price: { month: 24, year: 240 },
    description: "Perfect for small teams and growing startups",
    features: [
      {
        title: "Everything in Free",
        description: "All free features included",
        icon: <Check className="h-4 w-4" />,
      },
      {
        title: "5 feedback boards",
        description: "Create up to 5 public and private boards",
        icon: <Check className="h-4 w-4" />,
      },
      {
        title: "Private boards",
        description: "Collect internal feedback that only your team can see",
        icon: <Check className="h-4 w-4" />,
      },
    ],
    popular: true,
  },
  {
    id: "growth",
    name: "Growth",
    price: { month: 49, year: 490 },
    description: "For larger organizations with advanced needs",
    features: [
      {
        title: "Everything in Starter",
        description: "All starter features included",
        icon: <Check className="h-4 w-4" />,
      },
      {
        title: "Unlimited boards",
        description: "Create as many boards as you need",
        icon: <Check className="h-4 w-4" />,
      },
      {
        title: "White-label",
        description: "Complete removal of ThoughtBase branding",
        icon: <Check className="h-4 w-4" />,
      },
      {
        title: "Guest posting",
        description: "Let users submit feedback without creating an account",
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
  const [selectedPlanId, setSelectedPlanId] = useState<string>("starter");
  const [billingInterval, setBillingInterval] = useState<"month" | "year">("month");
  const [isLoading, setIsLoading] = useState(false);

  const selectedPlan = PLANS.find((p) => p.id === selectedPlanId) || PLANS[0];
  const { data: organization } = authClient.useActiveOrganization();

  const handleSubscribe = async () => {
    if (selectedPlan.id === "free") {
      onOpenChange(false);
      return;
    }

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
        console.log("Succes jonge", event);
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
      <DialogContent className="h-[90vh] max-w-4xl gap-0 overflow-hidden p-0 sm:rounded-xl md:h-[600px]">
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
                      {plan.id === "free" && (
                        <span className="rounded bg-green-600 px-1.5 py-0.5 text-[10px] text-white">
                          Current
                        </span>
                      )}
                    </div>
                    <div className="text-sm font-medium">
                      ${plan.price[billingInterval]}{" "}
                      <span className="text-muted-foreground font-normal">/ month</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-background/50 mt-6 rounded-lg border border-dashed p-4">
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
            </div>
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
                      <div className="bg-primary/10 text-primary mt-0.5 h-fit w-fit flex-shrink-0 rounded-full p-1">
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
                  ${selectedPlan.price[billingInterval]}
                </div>
              </div>
              <Button
                className="w-full bg-green-600 text-white hover:bg-green-700"
                size="lg"
                onClick={handleSubscribe}
                disabled={isLoading || selectedPlan.id === "free"}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {selectedPlan.id === "free"
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
