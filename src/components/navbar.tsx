"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { useCampus } from "./campus-provider";
import Icon from "./icon";
import { Modal, SearchInput, EmptyState } from "./ui";
import { eventKindLabel } from "@/lib/domain";

const names: Record<string, string> = {
  "/": "Overview",
  "/dashboard": "Overview",
  "/organizations": "Organizations",
  "/events": "Events & programs",
  "/tasks": "Tasks",
  "/applications": "Applications",
  "/analytics": "Analytics",
  "/activity": "My activity",
  "/settings": "Settings",
};
export default function Navbar({
  toggleMenu,
  menuOpen,
}: {
  toggleMenu: () => void;
  menuOpen: boolean;
}) {
  const pathname = usePathname();
  const { accessLabel, university, scoped, openDialog } = useCampus();
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState("");
  const results = [
    ...scoped.events.map((event) => ({
      id: event.id,
      title: event.title,
      group: eventKindLabel(event),
      type: "event-detail" as const,
    })),
    ...scoped.organizations.map((org) => ({
      id: org.id,
      title: org.name,
      group: "Organization",
      type: "organization-detail" as const,
    })),
  ]
    .filter((item) => item.title.toLowerCase().includes(search.toLowerCase()))
    .slice(0, 8);
  return (
    <>
      <header className="topbar">
        <div className="breadcrumb">
          <button
            className="icon-button mobile-menu"
            aria-label="Toggle navigation"
            aria-expanded={menuOpen}
            aria-controls="campus-navigation"
            onClick={toggleMenu}
          >
            <Icon name="menu" />
          </button>
          <span className="breadcrumb-workspace">{university.shortName}</span>
          <Icon name="chevron" size={13} />
          <strong>{names[pathname] ?? "CampusOps"}</strong>
        </div>
        <div className="topbar-actions">
          <button
            className="global-search"
            onClick={() => {
              setSearch("");
              setSearchOpen(true);
            }}
          >
            <Icon name="search" size={17} />
            <span>Search workspace</span>
          </button>
          <span className="topbar-divider" />
          <div
            className="access-indicator"
            aria-label={`Account access: ${accessLabel}`}
          >
            <Icon name="shield" size={16} />
            <span>{accessLabel}</span>
          </div>
        </div>
      </header>
      {searchOpen && (
        <Modal
          title="Search your workspace"
          description="Find an organization, event, or program."
          onClose={() => setSearchOpen(false)}
        >
          <div className="modal-body">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search organizations, events, programs…"
            />
            <div className="search-results">
              {results.map((result) => (
                <button
                  key={result.id}
                  onClick={() => {
                    setSearchOpen(false);
                    openDialog({ type: result.type, id: result.id });
                  }}
                >
                  <div>
                    <strong>{result.title}</strong>
                    <span>{result.group}</span>
                  </div>
                  <Icon name="arrow" size={17} />
                </button>
              ))}
              {results.length === 0 && <EmptyState title="No matches found" />}
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
