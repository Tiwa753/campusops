"use client";

import { PageHeader, PanelHeader } from "@/components/ui";
import { ActivityFeed } from "@/components/analytics";

export default function ActivityPage() {
  return (
    <>
      <PageHeader
        eyebrow="YOUR CAMPUS STORY"
        title="Look at you, getting involved."
        description="Your applications and updates, collected in one place."
      />
      <section className="panel activity-page">
        <PanelHeader
          title="Your activity timeline"
          description="Only your personal activity appears here."
        />
        <ActivityFeed limit={200} />
      </section>
    </>
  );
}
