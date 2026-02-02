import { api } from "@thoughtbase/backend/convex/_generated/api";
import { useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { ChangelogView } from "./widget/changelog-view";
import { RoadmapView } from "./widget/roadmap-view";
import { SubmitView } from "./widget/submit-view";
import { Tab, WidgetLayout } from "./widget/widget-layout";

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

  // Get organization branding settings
  const orgBranding = useQuery(api.widget.getWidgetOrganization, {
    organizationSlug,
  });

  // Determine if we should show Thoughtbase branding
  const showThoughtbaseBranding =
    thoughtbaseBranding === false
      ? orgBranding?.showThoughtbaseBranding ?? true
      : true;

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
