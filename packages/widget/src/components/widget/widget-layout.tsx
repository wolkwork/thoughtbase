import { Gift, Map as MapIcon, X } from "lucide-react";
import { Button } from "../ui/button";
import { cn } from "../../lib/utils";
import { AnimatedShinyText } from "../ui/animated-shiny-text";
import { Logo } from "../logo";

export type Tab = "feedback" | "roadmap" | "updates";

interface WidgetLayoutProps {
  children: React.ReactNode;
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  onClose: () => void;
  showThoughtbaseBranding?: boolean;
}

export function WidgetLayout({
  children,
  activeTab,
  onTabChange,
  onClose,
  showThoughtbaseBranding = true,
}: WidgetLayoutProps) {
  return (
    <div
      className="bg-background text-foreground animate-in slide-in-from-bottom-4 fade-in fixed top-4 right-4 bottom-4 z-50 flex w-[380px] flex-col overflow-hidden rounded-2xl border shadow-2xl duration-100"
      data-testid="thoughtbase-widget"
    >
      {/* Content */}
      <div className="flex flex-1 grow flex-col overflow-hidden">
        <div className="flex items-center justify-end px-4 py-4">
          <Button
            aria-label="Close"
            variant="outline"
            size="icon"
            className="size-7"
            onClick={onClose}
            type="button"
          >
            <X />
          </Button>
        </div>
        {children}
      </div>

      {/* Footer Tabs */}
      <div className="bg-muted/20 border-t p-2">
        <div className="flex justify-around">
          <button
            onClick={() => onTabChange("feedback")}
            type="button"
            className={cn(
              "hover:bg-muted flex flex-col items-center gap-1 rounded-lg p-2 text-xs font-medium transition-colors",
              activeTab === "feedback"
                ? "text-foreground"
                : "text-muted-foreground"
            )}
          >
            <Logo className="size-5" />
            Ideas
          </button>
          <button
            onClick={() => onTabChange("roadmap")}
            type="button"
            className={cn(
              "hover:bg-muted flex flex-col items-center gap-1 rounded-lg p-2 text-xs font-medium transition-colors",
              activeTab === "roadmap"
                ? "text-foreground"
                : "text-muted-foreground"
            )}
          >
            <MapIcon className="h-5 w-5" />
            Roadmap
          </button>
          <button
            onClick={() => onTabChange("updates")}
            type="button"
            className={cn(
              "hover:bg-muted flex flex-col items-center gap-1 rounded-lg p-2 text-xs font-medium transition-colors",
              activeTab === "updates"
                ? "text-foreground"
                : "text-muted-foreground"
            )}
          >
            <Gift className="h-5 w-5" />
            Updates
          </button>
        </div>
      </div>

      {showThoughtbaseBranding && (
        <div className="text-xs text-muted-foreground text-center py-2 bg-muted/20 border-t">
          Powered by{" "}
          <AnimatedShinyText>
            <a href="https://thoughtbase.app" className="font-medium">
              Thoughtbase
            </a>
          </AnimatedShinyText>
        </div>
      )}
    </div>
  );
}
