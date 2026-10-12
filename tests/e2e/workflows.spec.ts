import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { writeFile } from "node:fs/promises";
import { createSeed } from "../../src/lib/preview/seed";
import { performanceBudgets } from "../../src/lib/performance";

const managerButton = (page: Page) =>
  page.getByRole("button", {
    name: "Manage Tech & Innovation Club",
    exact: true,
  });
const personalButton = (page: Page) =>
  page.getByRole("button", { name: "My campus", exact: true });

async function installAdminFixture(page: Page) {
  await page.addInitScript((data) => {
    if (!localStorage.getItem("campusops-preview-v2"))
      localStorage.setItem(
        "campusops-preview-v2",
        JSON.stringify({
          mode: "preview",
          data,
          account: {
            identity: {
              id: "user-admin",
              name: "University Admin",
              email: "admin@example.test",
            },
            universityMemberships: [
              { universityId: "oau", role: "administrator", status: "active" },
            ],
            organizationMemberships: [],
          },
        }),
      );
  }, createSeed());
}

test("leadership is additive: same identity, personal applications, scoped management", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Your campus, Damilola." }),
  ).toBeVisible();
  await expect(
    page.getByLabel("Account access: Student · Organization leader"),
  ).toBeVisible();
  await expect(page.locator("header select")).toHaveCount(0);
  await page
    .getByRole("navigation")
    .getByRole("link", { name: "Explore opportunities" })
    .click();
  await page
    .getByRole("button", { name: "A Greener Campus", exact: true })
    .click();
  await page
    .getByRole("textbox", { name: "Tell us why" })
    .fill("I would like to volunteer alongside other students.");
  await page.getByRole("button", { name: "Submit application" }).click();
  await page.goto("/applications");
  const application = page
    .getByRole("row")
    .filter({ hasText: "A Greener Campus" });
  await expect(application).toContainText("Pending");
  await managerButton(page).click();
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Your organization",
  );
  await page.goto("/applications");
  await expect(
    page.getByRole("row").filter({ hasText: "A Greener Campus" }),
  ).toHaveCount(0);
  const riley = page.getByRole("row").filter({ hasText: "Riley Johnson" });
  await riley.getByRole("button", { name: "Review", exact: true }).click();
  await page.getByRole("button", { name: "Approve application" }).click();
  await expect(riley).toContainText("Approved");
  await personalButton(page).click();
  await page.goto("/applications");
  await page.reload();
  await expect(application).toContainText("Pending");
  await application.getByRole("button", { name: "View", exact: true }).click();
  await page.getByRole("button", { name: "Withdraw application" }).click();
  await expect(application).toContainText("Withdrawn");
  await page.goto("/analytics");
  await expect(
    page.getByText("This page is outside your current workspace"),
  ).toBeVisible();
  expect(errors).toEqual([]);
});

test("leaders cannot review their own applications", async ({ page }) => {
  await page.goto("/events");
  await page
    .getByRole("button", {
      name: "Build Together: Campus Hackathon",
      exact: true,
    })
    .click();
  await page
    .getByRole("textbox", { name: "Tell us why" })
    .fill("I am also participating as a student.");
  await page.getByRole("button", { name: "Submit application" }).click();
  await managerButton(page).click();
  await page.goto("/applications");
  await page
    .getByRole("row")
    .filter({ hasText: "Damilola Adeyemi" })
    .getByRole("button", { name: "Review", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toContainText(
    "Another authorized reviewer",
  );
  await expect(
    page.getByRole("button", { name: "Approve application" }),
  ).toHaveCount(0);
});

test("manager creates, publishes and completes work only in their organization", async ({
  page,
}) => {
  await page.goto("/");
  await managerButton(page).click();
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
    .fill("Student activity centre");
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
});

test("invited university admin fixture retains campus management and CSV export", async ({
  page,
}) => {
  await installAdminFixture(page);
  await page.goto("/organizations");
  await expect(
    page.getByLabel("Account access: University administrator"),
  ).toBeVisible();
  await page.getByRole("button", { name: "New organization" }).click();
  await page
    .getByRole("textbox", { name: "Organization name", exact: true })
    .fill("Campus Astronomy Society");
  await page
    .getByRole("textbox", { name: "Organization lead" })
    .fill("Ada Okafor");
  await page
    .getByRole("textbox", { name: "Description", exact: true })
    .fill("A community for students curious about the night sky.");
  await page.getByRole("button", { name: "Create organization" }).click();
  await page
    .getByRole("searchbox", { name: "Search organizations" })
    .fill("Astronomy");
  await expect(page.locator("tbody tr")).toHaveCount(1);
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
  expect((await downloadPromise).suggestedFilename()).toBe(
    "campusops-report.csv",
  );
});

test("signup previews verified student access and a pending leadership request", async ({
  page,
}, testInfo) => {
  await page.goto("/sign-up");
  await page.getByRole("textbox", { name: "Full name" }).fill("Ada Okafor");
  await page
    .getByRole("textbox", { name: "Email address" })
    .fill("ada@example.test");
  await page
    .getByRole("radio", { name: "Participate and lead an organization" })
    .check();
  await page.getByLabel("Organization you lead").selectOption("org-arts");
  await expect(
    page.getByText(
      "Leadership is confirmed through an invitation or approval.",
      { exact: false },
    ),
  ).toBeVisible();
  await page.screenshot({
    path: testInfo.outputPath("signup-desktop.png"),
    fullPage: true,
  });
  await page.getByRole("button", { name: "Preview account setup" }).click();
  await expect(
    page.getByRole("heading", { name: "Your campus journey starts here." }),
  ).toBeVisible();
  await expect(
    page.getByText("Leadership request: pending approval", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("No account was created and no email was sent.", {
      exact: false,
    }),
  ).toBeVisible();
  await page
    .getByRole("link", { name: "Back to the workspace", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Your campus, Damilola." }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Manage Creative Arts Society" }),
  ).toHaveCount(0);
});

test("each tab keeps its workspace while sharing record updates", async ({
  page,
  context,
}) => {
  await page.goto("/");
  await expect(personalButton(page)).toHaveAttribute("aria-pressed", "true");
  const second = await context.newPage();
  await second.goto("/");
  await managerButton(second).click();
  await expect(managerButton(second)).toHaveAttribute("aria-pressed", "true");
  await expect(personalButton(page)).toHaveAttribute("aria-pressed", "true");
  await second.reload();
  await expect(managerButton(second)).toHaveAttribute("aria-pressed", "true");
  await expect(
    page.getByRole("heading", { name: "Your campus, Damilola." }),
  ).toBeVisible();
});

test("legacy data migrates without preserving the old administrator role", async ({
  page,
}) => {
  const legacy = createSeed();
  await page.addInitScript(
    (data) =>
      localStorage.setItem(
        "campusops-demo-v1",
        JSON.stringify({ data, role: "admin" }),
      ),
    legacy,
  );
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Your campus, Damilola." }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", {
      name: "University administration",
      exact: true,
    }),
  ).toHaveCount(0);
  await expect(page.locator("header select")).toHaveCount(0);
});

test("mobile workspace navigation and signup stay within the viewport", async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "Toggle navigation" }).click();
  await expect(
    page.getByRole("button", { name: "Toggle navigation" }),
  ).toHaveAttribute("aria-expanded", "true");
  await managerButton(page).click();
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Your organization",
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.goto("/sign-up");
  await expect(
    page.getByRole("heading", { name: "Join your campus." }),
  ).toBeVisible();
  await page.screenshot({
    path: testInfo.outputPath("signup-mobile.png"),
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("signup and personal dashboard pass automated accessibility checks", async ({
  page,
}) => {
  for (const route of ["/", "/sign-up"]) {
    await page.goto(route);
    await page.locator("h1").waitFor();
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    expect(results.violations).toEqual([]);
  }
});

test("malformed saved data recovers to a usable account preview", async ({
  page,
}) => {
  await page.addInitScript(() =>
    localStorage.setItem("campusops-preview-v2", '{"data":{"version":2}}'),
  );
  await page.goto("/");
  await expect(
    page
      .getByRole("alert")
      .filter({ hasText: "Saved demo data could not be read" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Your campus, Damilola." }),
  ).toBeVisible();
});

test("collect a local performance baseline and enforce a JavaScript transfer budget", async ({
  page,
}, testInfo) => {
  await page.addInitScript(() => {
    Reflect.set(window, "campusMetrics", {});
    window.addEventListener("campusops:web-vital", (event) => {
      const detail = (event as CustomEvent<{ name: string; value: number }>)
        .detail;
      Reflect.get(window, "campusMetrics")[detail.name] = detail.value;
    });
  });
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Your campus, Damilola." }),
  ).toBeVisible();
  await page.waitForLoadState("networkidle");
  const initial = await page.evaluate(() => {
    const nav = performance.getEntriesByType(
      "navigation",
    )[0] as PerformanceNavigationTiming;
    const resources = performance.getEntriesByType(
      "resource",
    ) as PerformanceResourceTiming[];
    return {
      domContentLoadedMs: nav.domContentLoadedEventEnd,
      javaScriptBytes: resources
        .filter((item) => item.name.includes(".js"))
        .reduce((sum, item) => sum + item.encodedBodySize, 0),
    };
  });
  await managerButton(page).click();
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Your organization",
  );
  const metrics = await page.evaluate(() =>
    Reflect.get(window, "campusMetrics"),
  );
  const baselinePath = testInfo.outputPath("performance-baseline.json");
  await writeFile(
    baselinePath,
    JSON.stringify(
      {
        measuredAt: new Date().toISOString(),
        environment:
          "Local production build, desktop Chromium, no network throttling",
        ...initial,
        webVitals: metrics,
        fieldTargets: performanceBudgets,
      },
      null,
      2,
    ),
  );
  await testInfo.attach("local-performance-baseline", {
    path: baselinePath,
    contentType: "application/json",
  });
  expect(initial.javaScriptBytes).toBeLessThanOrEqual(
    performanceBudgets.initialJavaScriptBytes,
  );
  expect(metrics.FCP).toBeGreaterThan(0);
});
