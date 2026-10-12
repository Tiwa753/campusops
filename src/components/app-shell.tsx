"use client";

import { useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import CampusProvider, { useCampus } from "./campus-provider";
import Sidebar from "./sidebar";
import Navbar from "./navbar";
const Dialogs = dynamic(() => import("./dialogs"));
import { EmptyState } from "./ui";

function Shell({ children }: { children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { profile, context, dialog } = useCampus();
  const pathname = usePathname();
  const workspaceKey = `${profile.id}:${context.universityId}:${context.kind}:${profile.organizationId ?? ""}`;
  const denied =
    (profile.role === "student" &&
      ["/tasks", "/analytics"].includes(pathname)) ||
    (profile.role !== "student" && pathname === "/activity");
  if (pathname === "/sign-up") return <>{children}</>;
  return (
    <div className={`app-shell ${menuOpen ? "menu-open" : ""}`}>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      {menuOpen && (
        <button
          className="sidebar-backdrop"
          aria-label="Close navigation"
          onClick={() => setMenuOpen(false)}
        />
      )}
      <Sidebar close={() => setMenuOpen(false)} />
      <div className="main-shell">
        <Navbar menuOpen={menuOpen} toggleMenu={() => setMenuOpen(!menuOpen)} />
        <main id="main-content" className="main-content" key={workspaceKey}>
          {denied ? (
            <div className="panel permission-state">
              <EmptyState
                icon="shield"
                title="This page is outside your current workspace"
                description="Use Your spaces to open an organization you manage, or return to your personal overview."
              />
              <Link href="/dashboard" className="button button-primary">
                Go to my overview
              </Link>
            </div>
          ) : (
            children
          )}
        </main>
        <footer className="app-footer">
          <span>
            CampusOps <span className="footer-dot">·</span> More connection.
            Less coordination.
          </span>
          <span>
            <span className="live-dot" />
            Local preview · Sample data
          </span>
        </footer>
      </div>
      {dialog && <Dialogs key={workspaceKey} />}
    </div>
  );
}
export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <CampusProvider>
      <Shell>{children}</Shell>
    </CampusProvider>
  );
}
