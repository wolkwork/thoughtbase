import { Check, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Label } from "~/components/ui/label";
import { Switch } from "~/components/ui/switch";
import { cn } from "~/lib/utils";
import { authClient } from "~/lib/auth/auth-client";

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

export function SubscriptionDialog({
  open,
  onOpenChange,
}: SubscriptionDialogProps) {
  const [selectedPlanId, setSelectedPlanId] = useState<string>("starter");
  const [billingInterval, setBillingInterval] = useState<"month" | "year">(
    "month"
  );
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
        referenceId: organization.id
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
      <DialogContent className="max-w-4xl p-0 gap-0 overflow-hidden sm:rounded-xl md:h-[600px] h-[90vh]">
        <div className="grid grid-cols-1 md:grid-cols-12 h-full">
          {/* Sidebar */}
          <div className="col-span-1 md:col-span-5 bg-muted/30 p-6 border-r flex flex-col">
            <DialogHeader className="mb-6 text-left">
              <DialogTitle className="text-xl">Upgrade your workspace</DialogTitle>
              <div className="text-sm text-muted-foreground space-y-1 mt-2">
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

            <div className="space-y-3 flex-1">
              {PLANS.map((plan) => (
                <div
                  key={plan.id}
                  onClick={() => setSelectedPlanId(plan.id)}
                  className={cn(
                    "cursor-pointer rounded-lg border p-4 transition-all hover:border-primary/50",
                    selectedPlanId === plan.id
                      ? "border-primary bg-background shadow-sm ring-1 ring-primary"
                      : "bg-background border-border"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className={cn(
                          "h-2 w-2 rounded-full",
                          selectedPlanId === plan.id
                            ? "bg-primary"
                            : "bg-muted-foreground/30"
                        )}
                      />
                      <span className="font-medium">{plan.name}</span>
                      {plan.id === "free" && (
                        <span className="bg-green-600 text-white text-[10px] px-1.5 py-0.5 rounded">
                          Current
                        </span>
                      )}
                    </div>
                    <div className="text-sm font-medium">
                      ${plan.price[billingInterval]} <span className="text-muted-foreground font-normal">/ month</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 rounded-lg border border-dashed bg-background/50">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">Yearly billing</div>
                <Switch
                  checked={billingInterval === "year"}
                  onCheckedChange={(checked) =>
                    setBillingInterval(checked ? "year" : "month")
                  }
                />
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Save up to 17% with yearly billing
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="col-span-1 md:col-span-7 p-6 md:p-8 flex flex-col h-full overflow-y-auto">
            <div className="flex-1">
              <div className="mb-8">
                <h2 className="text-2xl font-bold mb-2">{selectedPlan.name} Plan</h2>
                <p className="text-muted-foreground">
                  {selectedPlan.description}
                </p>
              </div>

              <div className="space-y-6">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  What's Included
                </h3>
                <div className="space-y-4">
                  {selectedPlan.features.map((feature, i) => (
                    <div key={i} className="flex gap-3">
                      <div className="mt-0.5 flex-shrink-0 bg-primary/10 p-1 rounded-full h-fit w-fit text-primary">
                        {feature.icon}
                      </div>
                      <div>
                        <div className="font-medium text-sm">
                          {feature.title}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {feature.description}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t">
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm">
                  Total due today
                </div>
                <div className="text-2xl font-bold">
                  ${selectedPlan.price[billingInterval]}
                </div>
              </div>
              <Button 
                className="w-full bg-green-600 hover:bg-green-700 text-white" 
                size="lg"
                onClick={handleSubscribe}
                disabled={isLoading || selectedPlan.id === "free"}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {selectedPlan.id === "free" ? "Current Plan" : "Upgrade to " + selectedPlan.name}
              </Button>
              <p className="text-xs text-center text-muted-foreground mt-3">
                Secure checkout via Polar. Cancel anytime.
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

