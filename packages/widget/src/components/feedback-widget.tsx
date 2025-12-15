import { useState } from "react";
import { ChangelogView } from "./widget/changelog-view";
import { RoadmapView } from "./widget/roadmap-view";
import { SubmitView } from "./widget/submit-view";
import { Tab, WidgetLayout } from "./widget/widget-layout";

interface FeedbackWidgetProps {
  organizationId: string;
  isOpen: boolean;
  onClose: () => void;
  ssoToken?: string;
}

export function FeedbackWidget({
  organizationId,
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
        <SubmitView organizationId={organizationId} ssoToken={ssoToken} />
      )}
      {activeTab === "roadmap" && (
        <RoadmapView organizationId={organizationId} ssoToken={ssoToken} />
      )}
      {activeTab === "updates" && (
        <ChangelogView organizationId={organizationId} />
      )}
    </WidgetLayout>
  );
}
