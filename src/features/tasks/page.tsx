"use client";

import { useCampus } from "@/components/campus-provider";
import Icon from "@/components/icon";
import { useState } from "react";
import { PageHeader, SearchInput } from "@/components/ui";
import { TasksTable } from "@/components/data-tables";
import { Tabs } from "@/components/record-controls";

export default function TasksPage() {
  const { scoped, openDialog } = useCampus();
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("open");
  const tasks = scoped.tasks
    .filter(
      (task) =>
        (tab === "all" ||
          (tab === "open" ? task.status !== "done" : task.status === tab)) &&
        `${task.title} ${task.assignee}`
          .toLowerCase()
          .includes(search.toLowerCase()),
    )
    .sort((a, b) => a.due.localeCompare(b.due));
  return (
    <>
      <PageHeader
        eyebrow="A LITTLE MOMENTUM"
        title="Great things, one task at a time."
        description="Clear owners, clear next steps. Keep your campus plans moving."
      >
        <button
          className="button button-primary"
          onClick={() => openDialog({ type: "task" })}
        >
          <Icon name="plus" size={17} />
          Create task
        </button>
      </PageHeader>
      <section className="panel">
        <Tabs
          value={tab}
          onChange={setTab}
          tabs={[
            {
              value: "open",
              label: "Open tasks",
              count: scoped.tasks.filter((task) => task.status !== "done")
                .length,
            },
            { value: "in-progress", label: "In progress" },
            { value: "done", label: "Completed" },
            { value: "all", label: "All tasks" },
          ]}
        />
        <div className="table-toolbar">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search tasks or assignees…"
          />
          <span className="muted small">Sorted by due date</span>
        </div>
        <TasksTable tasks={tasks} />
        <div className="panel-table-footer">Showing {tasks.length} tasks</div>
      </section>
    </>
  );
}
