import { MessageCircleHeart } from "lucide-react";
import { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import { FeedbackWidget } from "./components/feedback-widget";
import styles from "./styles.css?inline";
import { Button } from "./components/ui/button";

interface WidgetProps {
  organizationSlug: string;
  selector?: string;
  // TODO: Maybe in the future
  // radius?: RadiusKey;
}

// Global state to hold the SSO token for the widget instance
let ssoToken: string | undefined = undefined;

export function WidgetContainer({ organizationSlug, selector }: WidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  // Force re-render when token changes (though identify is usually called once at start)
  const [token, setToken] = useState<string | undefined>(ssoToken);

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
    <>
      <style>{widgetStyles}</style>
      {!selector && !isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed right-4 bottom-4 z-50"
        >
          <MessageCircleHeart className="size-6" />
          Submit Feedback
        </Button>
      )}
      <FeedbackWidget
        organizationSlug={organizationSlug}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        ssoToken={token}
      />
    </>
  );
}

let activeOrganizationSlug: string | null = null;

export function initFeedbackWidget(config: WidgetProps) {
  activeOrganizationSlug = config.organizationSlug;
  const containerId = "feedback-widget-container";

  if (document.getElementById(containerId)) {
    return;
  }

  const container = document.createElement("div");
  container.id = containerId;
  document.body.appendChild(container);

  const shadow = container.attachShadow({ mode: "open" });
  const root = ReactDOM.createRoot(shadow);

  root.render(<WidgetContainer {...config} />);
}

export function identify(token: string) {
  if (!activeOrganizationSlug) {
    console.error("Feedback Widget: Initialize widget before calling identify");
    return;
  }

  // Store token in memory
  ssoToken = token;

  // Update React state if widget is mounted
  if ((window as any).__setWidgetToken) {
    (window as any).__setWidgetToken(token);
  }
}

if (typeof window !== "undefined") {
  (window as any).thoughtbase = {
    identify,
    initWidget: initFeedbackWidget,
  };
}
