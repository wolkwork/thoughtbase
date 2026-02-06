import { ConvexProvider, ConvexReactClient } from "convex/react";
import { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import { FeedbackWidget } from "./components/feedback-widget";
import styles from "./styles.css?inline";
import { Button } from "./components/ui/button";
import { Logo } from "./components/logo";

interface WidgetProps {
  organizationSlug: string;
  selector?: string;
  thoughtbaseBranding?: boolean;
  convexUrl: string;
  ssoToken?: string;
}

export function WidgetContainer({
  organizationSlug,
  selector,
  thoughtbaseBranding,
  convexUrl,
  ssoToken,
}: WidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  // Force re-render when token changes (though identify is usually called once at start)
  const [token, setToken] = useState<string | undefined>(ssoToken);

  // Create Convex client
  const convex = new ConvexReactClient(convexUrl);

  useEffect(() => {
    // Expose setter to global scope for identify function
    (window as any).__setWidgetToken = setToken;
  }, []);

  useEffect(() => {
    if (selector) {
      const elements = document.querySelectorAll(selector);
      const handleClick = (e: Event) => {
        e.preventDefault();
        setIsOpen(true);
      };
      elements.forEach((el) => el.addEventListener("click", handleClick));
      return () => {
        elements.forEach((el) => el.removeEventListener("click", handleClick));
      };
    }
  }, [selector]);

  // Adapt styles for Shadow DOM
  const widgetStyles = styles
    .replaceAll(":root", ":host")
    .replaceAll("body", ":host");

  return (
    <ConvexProvider client={convex}>
      <style>{widgetStyles}</style>
      {!selector && !isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed right-4 bottom-4 z-50"
        >
          <Logo className="size-6" />
          Submit Feedback
        </Button>
      )}
      <FeedbackWidget
        organizationSlug={organizationSlug}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        ssoToken={token}
        thoughtbaseBranding={thoughtbaseBranding}
      />
    </ConvexProvider>
  );
}

export function initFeedbackWidget(config: WidgetProps) {
  const containerId = "feedback-widget-container";

  if (document.getElementById(containerId)) {
    return;
  }

  const { convexUrl } = config;

  if (!convexUrl) {
    console.error("[Thoughtbase Widget] convexUrl is required.");
    return;
  }

  const container = document.createElement("div");
  container.id = containerId;
  document.body.appendChild(container);

  const shadow = container.attachShadow({ mode: "open" });
  const root = ReactDOM.createRoot(shadow);

  root.render(<WidgetContainer {...config} convexUrl={convexUrl} />);
}

if (typeof window !== "undefined") {
  (window as any).thoughtbase = {
    initWidget: initFeedbackWidget,
  };
}
