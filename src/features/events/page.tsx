"use client";

import { useCampus } from "@/components/campus-provider";
import Icon from "@/components/icon";
import { useState } from "react";
import { PageHeader, SearchInput } from "@/components/ui";
import { EventsTable } from "@/components/data-tables";
import { Tabs } from "@/components/record-controls";
import { eventStartTime } from "@/lib/domain";

export default function EventsPage() {
  const { scoped, profile, openDialog } = useCampus();
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("upcoming");
  const [kind, setKind] = useState("all");
  const events = scoped.events
    .filter(
      (event) =>
        (tab === "all" ||
          (tab === "upcoming"
            ? event.status === "published" &&
              eventStartTime(event) > new Date().getTime()
            : event.status === tab)) &&
        (kind === "all" || event.kind === kind) &&
        `${event.title} ${event.location} ${event.customKind ?? ""} ${scoped.organizations.find((org) => org.id === event.organizationId)?.name}`
          .toLowerCase()
          .includes(search.toLowerCase()),
    )
    .sort((a, b) =>
      tab === "completed"
        ? b.date.localeCompare(a.date)
        : a.date.localeCompare(b.date),
    );
  return (
    <>
      <PageHeader
        eyebrow="GET TOGETHER"
        title={
          profile.role === "student"
            ? "Find your next opportunity."
            : "Good things on the calendar."
        }
        description={
          profile.role === "student"
            ? "Events to experience. Programs to grow with. Find what speaks to you."
            : "Plan events, run programs, and give your community something to look forward to."
        }
      >
        {profile.role !== "student" && (
          <button
            className="button button-primary"
            onClick={() => openDialog({ type: "event" })}
          >
            <Icon name="plus" size={17} />
            Create opportunity
          </button>
        )}
      </PageHeader>
      <section className="panel">
        <Tabs
          value={tab}
          onChange={setTab}
          tabs={[
            { value: "upcoming", label: "Upcoming" },
            {
              value: "all",
              label: "All opportunities",
              count: scoped.events.length,
            },
            { value: "completed", label: "Completed" },
            ...(profile.role !== "student"
              ? [{ value: "draft", label: "Drafts" }]
              : []),
          ]}
        />
        <div className="table-toolbar">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search opportunities…"
          />
          <select
            aria-label="Opportunity type"
            value={kind}
            onChange={(event) => setKind(event.target.value)}
          >
            <option value="all">All types</option>
            <option value="conference">Conferences</option>
            <option value="event">Events</option>
            <option value="program">Programs</option>
            <option value="hackathon">Hackathons</option>
            <option value="other">Other</option>
          </select>
        </div>
        <EventsTable events={events} />
        <div className="panel-table-footer">
          Showing {events.length}{" "}
          {events.length === 1 ? "opportunity" : "opportunities"}
        </div>
      </section>
    </>
  );
}
