import assert from "node:assert/strict";
import { test } from "node:test";
import {
  getSupabaseConfig,
  isSupabaseConfigured,
  safeRedirectPath,
  SupabaseConfigurationError,
} from "../src/lib/supabase/config.ts";

function withAuthConfig(run, overrides = {}) {
  const keys = [
    "NODE_ENV",
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    "NEXT_PUBLIC_SITE_URL",
  ];
  const previous = new Map(keys.map((key) => [key, process.env[key]]));
  Object.assign(process.env, {
    NODE_ENV: "development",
    NEXT_PUBLIC_SUPABASE_URL: "https://campusops.supabase.co",
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test_key",
    NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
    ...overrides,
  });
  try {
    return run();
  } finally {
    for (const key of keys) {
      if (previous.get(key) === undefined) delete process.env[key];
      else process.env[key] = previous.get(key);
    }
  }
}

test("Supabase configuration only accepts a public publishable key", () => {
  withAuthConfig(() => {
    assert.equal(
      getSupabaseConfig().publishableKey,
      "sb_publishable_test_key",
    );
    assert.equal(isSupabaseConfigured(), true);
  });

  withAuthConfig(
    () => {
      assert.equal(isSupabaseConfigured(), false);
      assert.throws(getSupabaseConfig, SupabaseConfigurationError);
    },
    {
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_secret_never-public",
    },
  );
});

test("auth redirects remain on-site and avoid auth and API endpoints", () => {
  withAuthConfig(() => {
    assert.equal(safeRedirectPath("/admin?tab=overview"), "/admin?tab=overview");
    assert.equal(safeRedirectPath("https://attacker.example"), "/dashboard");
    assert.equal(safeRedirectPath("//attacker.example"), "/dashboard");
    assert.equal(safeRedirectPath("/\\attacker.example"), "/dashboard");
    assert.equal(safeRedirectPath("/api/auth/sign-out"), "/dashboard");
    assert.equal(safeRedirectPath("/sign-in"), "/dashboard");
  });
});
