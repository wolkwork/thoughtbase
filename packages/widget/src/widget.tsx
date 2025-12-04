import { MessageCircleHeart } from "lucide-react";
import { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import { FeedbackWidget } from "./components/feedback-widget";
import styles from "./styles.css?inline";


interface WidgetProps {
  organizationId: string;
  selector?: string;
}

// Global state to hold the SSO token for the widget instance
let ssoToken: string | null = null;

function WidgetContainer({ organizationId, selector }: WidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  // Force re-render when token changes (though identify is usually called once at start)
  const [token, setToken] = useState<string | null>(ssoToken);

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
  const widgetStyles = styles.replaceAll(":root", ":host").replaceAll("body", ":host");

  return (
    <>
      <style>{widgetStyles}</style>
      {!selector && !isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed right-4 bottom-4 z-50 flex h-14 w-14 cursor-pointer items-center justify-center rounded-full bg-black text-white shadow-lg transition-transform hover:scale-105 focus:ring-2 focus:ring-black focus:ring-offset-2 focus:outline-none"
          aria-label="Open feedback"
        >
          <MessageCircleHeart className="h-7 w-7" />
        </button>
      )}
      <FeedbackWidget
        organizationId={organizationId}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        ssoToken={token || undefined} // Pass token to widget
      />
    </>
  );
}

let activeOrganizationId: string | null = null;

export function initFeedbackWidget(config: WidgetProps) {
  activeOrganizationId = config.organizationId;
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
  if (!activeOrganizationId) {
    console.error("Feedback Widget: Initialize widget before calling identify");
    return;
  }

  // Store token in memory
  ssoToken = token;

  // Update React state if widget is mounted
  if ((window as any).__setWidgetToken) {
    (window as any).__setWidgetToken(token);
  }

  console.log("Feedback Widget: Identified with token");
}

if (typeof window !== "undefined") {
  (window as any).initFeedbackWidget = initFeedbackWidget;
  (window as any).feedbackWidget = {
    identify,
  };
}
