"use client";

import { useCampus } from "@/components/campus-provider";
import Icon from "@/components/icon";
import { useState } from "react";
import Link from "next/link";
import { PageHeader, SearchInput } from "@/components/ui";
import { ApplicationsTable } from "@/components/data-tables";
import { Tabs, download } from "@/components/record-controls";

export default function ApplicationsPage() {
  const { data, scoped, profile } = useCampus();
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("all");
  const student = profile.role === "student";
  const applications = scoped.applications
    .filter(
      (app) =>
        (tab === "all" || app.status === tab) &&
        `${app.studentName} ${data.events.find((event) => event.id === app.eventId)?.title}`
          .toLowerCase()
          .includes(search.toLowerCase()),
    )
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return (
    <>
      <PageHeader
        eyebrow={student ? "YOUR NEXT CHAPTER" : "OPENING DOORS"}
        title={
          student
            ? "Every opportunity, every update."
            : "A little review. A big next step."
        }
        description={
          student
            ? "Follow your applications from first hello to your next campus experience."
            : "Get to know the students ready to be part of your events and programs."
        }
      >
        {student ? (
          <Link href="/events" className="button button-primary">
            Find opportunities
            <Icon name="arrow" size={16} />
          </Link>
        ) : (
          <button
            className="button button-secondary"
            onClick={() =>
              download(
                [
                  ["Student", "Email", "Opportunity", "Status", "Submitted"],
                  ...applications.map((app) => [
                    app.studentName,
                    app.email,
                    data.events.find((event) => event.id === app.eventId)
                      ?.title ?? "",
                    app.status,
                    app.createdAt,
                  ]),
                ],
                "campusops-applications.csv",
              )
            }
          >
            <Icon name="download" size={17} />
            Export CSV
          </button>
        )}
      </PageHeader>
      <section className="panel">
        <Tabs
          value={tab}
          onChange={setTab}
          tabs={[
            {
              value: "all",
              label: student ? "My applications" : "All applications",
              count: scoped.applications.length,
            },
            {
              value: "pending",
              label: "Pending",
              count: scoped.applications.filter(
                (app) => app.status === "pending",
              ).length,
            },
            { value: "approved", label: "Approved" },
            { value: "rejected", label: "Not selected" },
            { value: "withdrawn", label: "Withdrawn" },
          ]}
        />
        <div className="table-toolbar">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder={
              student
                ? "Search my applications…"
                : "Search students or opportunities…"
            }
          />
          <span className="muted small">Newest first</span>
        </div>
        <ApplicationsTable applications={applications} />
        <div className="panel-table-footer">
          Showing {applications.length} applications
        </div>
      </section>
    </>
  );
}
