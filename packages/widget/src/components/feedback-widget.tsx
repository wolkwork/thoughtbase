import { ChangelogView } from "./widget/changelog-view";
import { RoadmapView } from "./widget/roadmap-view";
import { SubmitView } from "./widget/submit-view";
import { Tab, WidgetLayout } from "./widget/widget-layout";
import React from "react";

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
  thoughtbaseBranding = true,
}: FeedbackWidgetProps) {
  const [activeTab, setActiveTab] = React.useState<Tab>("feedback");

  if (!isOpen) return null;

  return (
    <WidgetLayout
      activeTab={activeTab}
      onTabChange={setActiveTab}
      onClose={onClose}
      showThoughtbaseBranding={thoughtbaseBranding}
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
