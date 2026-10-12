"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCampus } from "./campus-provider";
import Icon, { type IconName } from "./icon";
import { initials } from "@/lib/domain";

export default function Sidebar({ close }: { close: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const {
    profile,
    scoped,
    data,
    context,
    contexts,
    selectContext,
    university,
    accessLabel,
  } = useCampus();
  const student = profile.role === "student";
  const links: {
    name: string;
    href: string;
    icon: IconName;
    count?: number;
  }[] = [
    { name: "Overview", href: "/dashboard", icon: "grid" },
    {
      name: profile.role === "manager" ? "My organization" : "Organizations",
      href: "/organizations",
      icon: "building",
    },
    {
      name: student ? "Explore opportunities" : "Events & programs",
      href: "/events",
      icon: "calendar",
    },
    ...(!student
      ? [{ name: "Tasks", href: "/tasks", icon: "tasks" as const }]
      : []),
    {
      name: student ? "My applications" : "Applications",
      href: "/applications",
      icon: "file",
      count: scoped.applications.filter((app) => app.status === "pending")
        .length,
    },
    {
      name: student ? "My activity" : "Analytics",
      href: student ? "/activity" : "/analytics",
      icon: student ? "activity" : "chart",
    },
  ];
  return (
    <aside className="sidebar" id="campus-navigation">
      <Link href="/dashboard" className="brand" onClick={close}>
        <span className="brand-mark">
          <Icon name="building" size={23} />
        </span>
        <span>
          campus<span className="brand-light">ops</span>
          <span className="brand-period">.</span>
        </span>
      </Link>
      <div className="workspace-switch">
        <span className="university-icon">
          <Icon name="book" size={19} />
        </span>
        <div>
          <strong>{university.shortName} workspace</strong>
          <span>{university.location}</span>
        </div>
      </div>
      <div className="space-navigation" aria-label="Your workspaces">
        <p className="nav-label">YOUR SPACES</p>
        {contexts
          .filter((item) => item.universityId === university.id)
          .map((item) => {
            const organization =
              item.kind === "organization"
                ? data.organizations.find(
                    (org) =>
                      org.id === item.organizationId &&
                      org.universityId === item.universityId,
                  )
                : null;
            const selected =
              item.kind === context.kind &&
              (item.kind !== "organization" ||
                (context.kind === "organization" &&
                  item.organizationId === context.organizationId));
            const title =
              item.kind === "personal"
                ? "My campus"
                : item.kind === "administration"
                  ? "University administration"
                  : (organization?.name ?? "Organization");
            return (
              <button
                key={
                  item.kind === "organization" ? item.organizationId : item.kind
                }
                aria-label={
                  item.kind === "organization" ? `Manage ${title}` : title
                }
                aria-pressed={selected}
                className={`space-button ${selected ? "selected" : ""}`}
                onClick={async () => {
                  if (await selectContext(item)) {
                    router.push("/dashboard");
                    close();
                  }
                }}
              >
                <Icon
                  name={item.kind === "personal" ? "book" : "building"}
                  size={17}
                />
                <span>
                  <strong>{title}</strong>
                  <small>
                    {item.kind === "personal"
                      ? "My participation & applications"
                      : item.kind === "organization"
                        ? "Manage organization"
                        : "Campus operations"}
                  </small>
                </span>
                {selected && <Icon name="check" size={14} />}
              </button>
            );
          })}
      </div>
      <p className="nav-label">
        {student ? "PERSONAL WORKSPACE" : "MANAGEMENT"}
      </p>
      <nav aria-label="Main navigation">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            onClick={close}
            aria-current={
              pathname === link.href ||
              (pathname === "/" && link.href === "/dashboard")
                ? "page"
                : undefined
            }
            className={`nav-link ${pathname === link.href || (pathname === "/" && link.href === "/dashboard") ? "active" : ""}`}
          >
            <Icon name={link.icon} size={19} />
            <span>{link.name}</span>
            {!!link.count && <span className="nav-count">{link.count}</span>}
          </Link>
        ))}
      </nav>
      <div className="sidebar-bottom">
        <div className="demo-card">
          <span className="demo-label">
            <span />
            OAU · LOCAL PREVIEW
          </span>
          <p>One account. Every part of campus.</p>
          <span>
            Sample data. Your personal activity stays yours when you manage a
            club.
          </span>
          <Link href="/sign-up" onClick={close} className="preview-signup-link">
            Preview account setup <Icon name="arrow" size={13} />
          </Link>
        </div>
        <Link
          href="/settings"
          className={`nav-link ${pathname === "/settings" ? "active" : ""}`}
          onClick={close}
        >
          <Icon name="settings" size={19} />
          <span>Settings & permissions</span>
        </Link>
        <div className="profile">
          <span className="avatar avatar-green">{initials(profile.name)}</span>
          <div>
            <strong>{profile.name}</strong>
            <span>{accessLabel}</span>
          </div>
          <Icon name="shield" size={17} />
        </div>
      </div>
    </aside>
  );
}
