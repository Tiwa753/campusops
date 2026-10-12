"use client";

import { useCampus } from "@/components/campus-provider";
import Icon from "@/components/icon";
import { useState } from "react";
import { Badge, EmptyState, PageHeader, SearchInput } from "@/components/ui";
import { initials } from "@/lib/domain";

export default function OrganizationsPage() {
  const { scoped, profile, openDialog } = useCampus();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const organizations = scoped.organizations.filter(
    (org) =>
      (category === "all" || org.category === category) &&
      `${org.name} ${org.lead}`.toLowerCase().includes(search.toLowerCase()),
  );
  return (
    <>
      <PageHeader
        eyebrow="FIND YOUR PEOPLE"
        title={
          profile.role === "manager"
            ? "Your community, connected."
            : "A place for every passion."
        }
        description="Meet the student organizations making campus life a little more meaningful."
      >
        {profile.role === "admin" && (
          <button
            className="button button-primary"
            onClick={() => openDialog({ type: "organization" })}
          >
            <Icon name="plus" size={17} />
            New organization
          </button>
        )}
      </PageHeader>
      <div className="summary-strip">
        <span>
          <strong>
            {
              scoped.organizations.filter((org) => org.status === "active")
                .length
            }
          </strong>{" "}
          active organizations
        </span>
        <span>
          <strong>
            {scoped.organizations.reduce((sum, org) => sum + org.members, 0)}
          </strong>{" "}
          memberships
        </span>
        <span>
          <strong>
            {new Set(scoped.organizations.map((org) => org.category)).size}
          </strong>{" "}
          interests, countless possibilities
        </span>
      </div>
      <section className="panel">
        <div className="table-toolbar">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search organizations…"
          />
          <select
            aria-label="Organization category"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
          >
            <option value="all">All categories</option>
            {Array.from(
              new Set(scoped.organizations.map((org) => org.category)),
            ).map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </div>
        {organizations.length ? (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Organization</th>
                  <th>Category</th>
                  <th>Members</th>
                  <th>Organization lead</th>
                  <th>Status</th>
                  <th>
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {organizations.map((org) => (
                  <tr key={org.id}>
                    <td>
                      <div className="table-identity">
                        <span className={`org-icon color-${org.color}`}>
                          {org.initials}
                        </span>
                        <div>
                          <button
                            className="text-button row-title"
                            onClick={() =>
                              openDialog({
                                type: "organization-detail",
                                id: org.id,
                              })
                            }
                          >
                            {org.name}
                          </button>
                          <span className="row-subtitle">
                            {
                              scoped.events.filter(
                                (event) =>
                                  event.organizationId === org.id &&
                                  event.status === "published",
                              ).length
                            }{" "}
                            published opportunities
                          </span>
                        </div>
                      </div>
                    </td>
                    <td>{org.category}</td>
                    <td>{org.members}</td>
                    <td>
                      <span className="assignee">
                        <span className="avatar avatar-small">
                          {initials(org.lead)}
                        </span>
                        {org.lead}
                      </span>
                    </td>
                    <td>
                      <Badge value={org.status} />
                    </td>
                    <td>
                      <button
                        className="button button-small button-secondary"
                        onClick={() =>
                          openDialog({
                            type:
                              profile.role === "student"
                                ? "organization-detail"
                                : "organization",
                            id: org.id,
                          })
                        }
                      >
                        {profile.role === "student" ? "Explore" : "Manage"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState title="No organizations found" />
        )}
        <div className="panel-table-footer">
          Showing {organizations.length} organizations
        </div>
      </section>
    </>
  );
}
