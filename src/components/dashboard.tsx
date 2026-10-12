"use client";

import Link from "next/link";
import { useCampus } from "./campus-provider";
import Icon, { type IconName } from "./icon";
import { PageHeader, PanelHeader } from "./ui";
import { ApplicationsTable, EventsTable, TasksTable } from "./data-tables";
import { ActivityFeed, ParticipationChart } from "./analytics";
import { canApply } from "@/lib/domain";

export default function Dashboard() {
  const { data, scoped, profile, openDialog } = useCampus();
  const student = profile.role === "student";
  const upcoming = scoped.events
    .filter(
      (event) =>
        event.status === "published" &&
        new Date(`${event.date}T${event.time}`) > new Date(),
    )
    .sort((a, b) => a.date.localeCompare(b.date));
  const pending = scoped.applications.filter(
    (app) => app.status === "pending",
  ).length;
  const tasks = scoped.tasks
    .filter((task) => task.status !== "done")
    .sort((a, b) => a.due.localeCompare(b.due));
  const cards: {
    label: string;
    value: number;
    detail: string;
    icon: IconName;
    href: string;
    color: string;
  }[] = student
    ? [
        {
          label: "Open opportunities",
          value: scoped.events.filter((event) => canApply(data, event)).length,
          detail: "Find your next experience",
          icon: "calendar",
          href: "/events",
          color: "green",
        },
        {
          label: "My applications",
          value: scoped.applications.length,
          detail: `${pending} awaiting a decision`,
          icon: "file",
          href: "/applications",
          color: "blue",
        },
        {
          label: "Approved places",
          value: scoped.applications.filter((app) => app.status === "approved")
            .length,
          detail: "Something to look forward to",
          icon: "check",
          href: "/applications",
          color: "purple",
        },
        {
          label: "Campus communities",
          value: scoped.organizations.length,
          detail: "Find your people",
          icon: "people",
          href: "/organizations",
          color: "orange",
        },
      ]
    : [
        {
          label:
            profile.role === "manager"
              ? "Organization members"
              : "Active organizations",
          value:
            profile.role === "manager"
              ? scoped.organizations.reduce((sum, org) => sum + org.members, 0)
              : scoped.organizations.filter((org) => org.status === "active")
                  .length,
          detail:
            profile.role === "manager"
              ? "Building something together"
              : `${scoped.organizations.length} communities in your workspace`,
          icon: "building",
          href: "/organizations",
          color: "green",
        },
        {
          label: "Upcoming opportunities",
          value: upcoming.length,
          detail: `${upcoming.filter((event) => event.kind === "program").length} programs open to students`,
          icon: "calendar",
          href: "/events",
          color: "blue",
        },
        {
          label: "Pending applications",
          value: pending,
          detail: pending ? "Ready for your review" : "You’re all caught up",
          icon: "file",
          href: "/applications",
          color: "purple",
        },
        {
          label: "Open tasks",
          value: tasks.length,
          detail: `${tasks.filter((task) => task.priority === "high").length} marked high priority`,
          icon: "tasks",
          href: "/tasks",
          color: "orange",
        },
      ];
  return (
    <>
      <PageHeader
        eyebrow={new Date().toLocaleDateString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
          year: "numeric",
        })}
        title={
          student
            ? `Your campus, ${profile.name.split(" ")[0]}.`
            : profile.role === "manager"
              ? "Your organization, at a glance."
              : "A connected campus starts here."
        }
        description={
          student
            ? "Discover your people, find your next opportunity, and make it count."
            : `Welcome back, ${profile.name.split(" ")[0]}. Here’s what’s happening across ${profile.role === "manager" ? "your organization" : "your campus"}.`
        }
      >
        {!student && (
          <Link className="button button-secondary" href="/analytics">
            <Icon name="chart" size={17} />
            View reports
          </Link>
        )}
        {student ? (
          <Link className="button button-primary" href="/events">
            Explore opportunities
            <Icon name="arrow" size={17} />
          </Link>
        ) : (
          <button
            className="button button-primary"
            onClick={() => openDialog({ type: "event" })}
          >
            <Icon name="plus" size={17} />
            Create event
          </button>
        )}
      </PageHeader>
      <div className="stats-grid">
        {cards.map((card) => (
          <Link href={card.href} className="stat-card" key={card.label}>
            <div className="stat-top">
              <span>{card.label}</span>
              <span className={`stat-icon color-${card.color}`}>
                <Icon name={card.icon} size={18} />
              </span>
            </div>
            <strong className="stat-number">
              {card.value.toLocaleString()}
            </strong>
            <div className="stat-bottom">
              <span>{card.detail}</span>
              <Icon name="arrow" size={15} />
            </div>
          </Link>
        ))}
      </div>
      <div className="dashboard-middle">
        <section className="panel upcoming-panel">
          <PanelHeader
            title={student ? "Find your next thing" : "Coming up on campus"}
            description="Good things happen when people come together."
          >
            <Link href="/events" className="text-link">
              View all
              <Icon name="arrow" size={15} />
            </Link>
          </PanelHeader>
          <EventsTable events={upcoming.slice(0, 4)} compact />
          <div className="panel-table-footer">
            <span>{upcoming.length} upcoming opportunities</span>
            <span>
              <span className="live-dot" />
              Your workspace, in sync
            </span>
          </div>
        </section>
        <section className="spotlight-card">
          <div className="spotlight-top">
            <span className="spotlight-tag">
              <Icon name="spark" size={13} />
              THE CAMPUS CONNECTION
            </span>
            <div className="orbit-art" aria-hidden="true">
              <div className="orbit orbit-one" />
              <div className="orbit orbit-two" />
              <div className="orbit orbit-three" />
              <span className="orbit-center">
                <Icon name="building" size={33} />
              </span>
              <span className="orbit-node node-one">
                <Icon name="people" size={17} />
              </span>
              <span className="orbit-node node-two">
                <Icon name="calendar" size={17} />
              </span>
              <span className="orbit-node node-three">
                <Icon name="leaf" size={17} />
              </span>
            </div>
          </div>
          <div className="spotlight-copy">
            <h2>
              Small connections.
              <br />
              Big possibilities.
            </h2>
            <p>
              {student
                ? "There’s a community for every curiosity. Find the one that feels like you."
                : "A shared space for the people and ideas that make your campus thrive."}
            </p>
            <Link href="/organizations">
              {profile.role === "manager"
                ? "Visit your organization"
                : "Explore your communities"}
              <Icon name="arrow" size={16} />
            </Link>
          </div>
        </section>
      </div>
      <div className="dashboard-bottom">
        {student ? (
          <section className="panel">
            <PanelHeader
              title="Your applications"
              description="Every next step, in one place."
            >
              <Link href="/applications" className="text-link">
                View all
                <Icon name="arrow" size={15} />
              </Link>
            </PanelHeader>
            <ApplicationsTable applications={scoped.applications.slice(0, 3)} />
          </section>
        ) : (
          <ParticipationChart />
        )}
        <section className="panel">
          <PanelHeader
            title={student ? "Your recent activity" : "Workspace activity"}
            description="The little things moving us forward."
          />
          <ActivityFeed limit={4} />
        </section>
      </div>
      {!student && (
        <section className="panel dashboard-tasks">
          <PanelHeader
            title="Keep things moving"
            description="The next steps that need a little attention."
          >
            <Link href="/tasks" className="text-link">
              All tasks
              <Icon name="arrow" size={15} />
            </Link>
          </PanelHeader>
          <TasksTable tasks={tasks.slice(0, 3)} compact />
        </section>
      )}
    </>
  );
}
