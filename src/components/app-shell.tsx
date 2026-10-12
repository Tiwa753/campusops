"use client";

import { useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import dynamic from "next/dynamic";
import CampusProvider, { useCampus } from "./campus-provider";
import Sidebar from "./sidebar";
import Navbar from "./navbar";
const Dialogs = dynamic(() => import("./dialogs"));

function Shell({ children }: { children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { profile, context, dialog } = useCampus();
  const workspaceKey = `${profile.id}:${context.universityId}:${context.kind}:${profile.organizationId ?? ""}`;
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
          {children}
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
  const pathname = usePathname();
  const publicPath =
    pathname === "/" ||
    [
      "/sign-up",
      "/sign-in",
      "/forgot-password",
      "/reset-password",
    ].includes(pathname);
  if (publicPath) return <>{children}</>;
  return (
    <CampusProvider>
      <Shell>{children}</Shell>
    </CampusProvider>
  );
}
