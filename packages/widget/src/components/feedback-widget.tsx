import { useState } from "react";
import { ChangelogView } from "./widget/changelog-view";
import { RoadmapView } from "./widget/roadmap-view";
import { SubmitView } from "./widget/submit-view";
import { Tab, WidgetLayout } from "./widget/widget-layout";

interface FeedbackWidgetProps {
  organizationSlug: string;
  isOpen: boolean;
  onClose: () => void;
  ssoToken?: string;
}

export function FeedbackWidget({
  organizationSlug,
  isOpen,
  onClose,
  ssoToken,
}: FeedbackWidgetProps) {
  const [activeTab, setActiveTab] = useState<Tab>("feedback");

  if (!isOpen) return null;

  return (
    <WidgetLayout
      activeTab={activeTab}
      onTabChange={setActiveTab}
      onClose={onClose}
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
