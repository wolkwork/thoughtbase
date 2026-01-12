import { useEffect, useState } from "react";
import { ChangelogView } from "./widget/changelog-view";
import { RoadmapView } from "./widget/roadmap-view";
import { SubmitView } from "./widget/submit-view";
import { Tab, WidgetLayout } from "./widget/widget-layout";
import { getWidgetOrganization } from "../lib/api/widget-client";

interface FeedbackWidgetProps {
  organizationSlug: string;
  isOpen: boolean;
  onClose: () => void;
  ssoToken?: string;
  thoughtbaseBranding?: boolean;
}

export function FeedbackWidget({
  organizationSlug,
  isOpen,
  onClose,
  ssoToken,
  thoughtbaseBranding,
}: FeedbackWidgetProps) {
  const [activeTab, setActiveTab] = useState<Tab>("feedback");
  const [showThoughtbaseBranding, setShowThoughtbaseBranding] = useState(true);

  useEffect(() => {
    if (isOpen && organizationSlug) {
      // If thoughtbaseBranding is explicitly set to false, check permissions
      if (thoughtbaseBranding === false) {
        getWidgetOrganization(organizationSlug)
          .then((data) => {
            setShowThoughtbaseBranding(data.showThoughtbaseBranding ?? true);
          })
          .catch((err) => {
            console.error("Failed to load organization branding:", err);
            // Default to showing branding on error
            setShowThoughtbaseBranding(true);
          });
      } else {
        // If not explicitly set to false, always show branding
        setShowThoughtbaseBranding(true);
      }
    }
  }, [isOpen, organizationSlug, thoughtbaseBranding]);

  if (!isOpen) return null;

  return (
    <WidgetLayout
      activeTab={activeTab}
      onTabChange={setActiveTab}
      onClose={onClose}
      showThoughtbaseBranding={showThoughtbaseBranding}
    >
      {activeTab === "feedback" && (
        <SubmitView organizationSlug={organizationSlug} ssoToken={ssoToken} />
      )}
      {activeTab === "roadmap" && (
        <RoadmapView organizationSlug={organizationSlug} ssoToken={ssoToken} />
      )}
      {activeTab === "updates" && (
        <ChangelogView organizationSlug={organizationSlug} />
      )}
    </WidgetLayout>
  );
}
