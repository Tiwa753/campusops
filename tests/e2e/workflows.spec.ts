import { test, expect } from "@playwright/test";

test("student application, manager approval, persistence, and withdrawal", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await page.getByLabel("Demo role").selectOption("student");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Your campus",
  );
  await expect(
    page
      .getByRole("navigation")
      .getByRole("link", { name: "Tasks", exact: true }),
  ).toHaveCount(0);
  await page
    .getByRole("navigation")
    .getByRole("link", { name: "Explore opportunities" })
    .click();
  await page
    .getByRole("button", {
      name: "Build Together: Campus Hackathon",
      exact: true,
    })
    .click();
  await page
    .getByRole("textbox", { name: "Tell us why" })
    .fill("I want to build a better campus with my classmates.");
  await page.getByRole("button", { name: "Submit application" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page
    .getByRole("navigation")
    .getByRole("link", { name: "My applications" })
    .click();
  const application = page
    .getByRole("row")
    .filter({ hasText: "Build Together" });
  await expect(application).toContainText("Pending");
  await page.getByLabel("Demo role").selectOption("manager");
  await page
    .getByRole("navigation")
    .getByRole("link", { name: "Applications" })
    .click();
  const sam = page.getByRole("row").filter({ hasText: "Sam Taylor" });
  await sam.getByRole("button", { name: "Review", exact: true }).click();
  await page.getByRole("button", { name: "Approve application" }).click();
  await expect(sam).toContainText("Approved");
  await page.getByLabel("Demo role").selectOption("student");
  await page.goto("/applications");
  await expect(application).toContainText("Approved");
  await page.reload();
  await expect(page.getByLabel("Demo role")).toHaveValue("student");
  await expect(application).toContainText("Approved");
  await application.getByRole("button", { name: "View", exact: true }).click();
  await page.getByRole("button", { name: "Withdraw application" }).click();
  await expect(application).toContainText("Withdrawn");
  await page.goto("/analytics");
  await expect(
    page.getByText("This page belongs to another role"),
  ).toBeVisible();
  expect(errors).toEqual([]);
});

test("manager creates and edits an event, manages own tasks, and stays scoped", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByLabel("Demo role").selectOption("manager");
  await page.getByRole("button", { name: "Create event", exact: true }).click();
  await page
    .getByRole("textbox", { name: "Title", exact: true })
    .fill("Community Coding Night");
  await expect(
    page
      .getByRole("combobox", { name: "Organization", exact: true })
      .locator("option"),
  ).toHaveCount(1);
  await page
    .getByRole("textbox", { name: "Description", exact: true })
    .fill("An open evening of coding and collaboration.");
  await page
    .getByRole("textbox", { name: "Location", exact: true })
    .fill("Innovation Hub");
  await page
    .getByRole("combobox", { name: "Status", exact: true })
    .selectOption("draft");
  await page
    .getByRole("button", { name: "Create opportunity", exact: true })
    .click();
  await page.goto("/events");
  await page.getByRole("button", { name: "Drafts", exact: true }).click();
  await page
    .getByRole("button", { name: "Edit Community Coding Night" })
    .click();
  await page
    .getByRole("combobox", { name: "Status", exact: true })
    .selectOption("published");
  await page.getByRole("button", { name: "Save changes" }).click();
  await page.getByRole("button", { name: "Upcoming", exact: true }).click();
  await expect(
    page.getByRole("row").filter({ hasText: "Community Coding Night" }),
  ).toContainText("Published");
  await expect(
    page.getByText("The Creative Exchange", { exact: true }),
  ).toHaveCount(0);
  await page.goto("/tasks");
  await page
    .getByRole("button", { name: "Complete Confirm hackathon mentors" })
    .click();
  await page.getByRole("button", { name: "Completed", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Reopen Confirm hackathon mentors" }),
  ).toBeVisible();
  await page.goto("/organizations");
  await expect(page.locator("tbody tr")).toHaveCount(1);
  await expect(
    page.getByRole("button", { name: "New organization" }),
  ).toHaveCount(0);
});

test("admin creates an organization and a task, searches, and exports a report", async ({
  page,
}) => {
  await page.goto("/organizations");
  await page.getByRole("button", { name: "New organization" }).click();
  await page
    .getByRole("textbox", { name: "Organization name", exact: true })
    .fill("Campus Astronomy Society");
  await page
    .getByRole("textbox", { name: "Organization lead" })
    .fill("Jamie Park");
  await page
    .getByRole("textbox", { name: "Description", exact: true })
    .fill("A community for people curious about the night sky.");
  await page.getByRole("button", { name: "Create organization" }).click();
  await page
    .getByRole("searchbox", { name: "Search organizations" })
    .fill("Astronomy");
  await expect(page.locator("tbody tr")).toHaveCount(1);
  await expect(page.locator("tbody tr")).toContainText("Jamie Park");
  await page.goto("/tasks");
  await page.getByRole("button", { name: "Create task", exact: true }).click();
  await page
    .getByRole("textbox", { name: "Task title" })
    .fill("Arrange telescope viewing");
  await page
    .getByRole("combobox", { name: "Organization", exact: true })
    .selectOption({ label: "Campus Astronomy Society" });
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Create task" })
    .click();
  await expect(
    page.getByRole("button", {
      name: "Arrange telescope viewing",
      exact: true,
    }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Search workspace" }).click();
  await page
    .getByRole("searchbox", { name: "Search organizations, events, programs" })
    .fill("Astronomy");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Campus Astronomy Society" })
    .click();
  await expect(page.getByRole("dialog")).toContainText("night sky");
  await page.keyboard.press("Escape");
  await page.goto("/analytics");
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export report" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("campusops-report.csv");
});

test("desktop dashboard renders without errors and provides all navigation", async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "A connected campus starts here." }),
  ).toBeVisible();
  await expect(page.getByRole("navigation").getByRole("link")).toHaveCount(6);
  await page.screenshot({
    path: testInfo.outputPath("campusops-desktop.png"),
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
});

test("mobile navigation, role switching and tables fit the viewport", async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await page.getByRole("button", { name: "Toggle navigation" }).click();
  await page
    .getByRole("navigation")
    .getByRole("link", { name: "Events & programs" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Good things on the calendar." }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.getByLabel("Demo role").selectOption("student");
  await expect(
    page.getByRole("heading", { name: "Your campus, Sam." }),
  ).toBeVisible();
  await page.screenshot({
    path: testInfo.outputPath("campusops-mobile.png"),
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});

test("malformed saved data recovers to a usable demo", async ({ page }) => {
  await page.addInitScript(() =>
    localStorage.setItem(
      "campusops-demo-v1",
      '{"data":{"version":1},"role":"admin"}',
    ),
  );
  await page.goto("/");
  await expect(
    page
      .getByRole("alert")
      .filter({ hasText: "Saved demo data could not be read" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "A connected campus starts here." }),
  ).toBeVisible();
});
