"use client";

import {
  createContext,
  useContext,
  useState,
  useSyncExternalStore,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import {
  selectWorkspace,
  type Workspace,
  type Profile,
  type Command,
} from "@/lib/domain";
import { previewAdapter } from "@/lib/demo-store";
import {
  accountLabel,
  availableContexts,
  resolveProfile,
  universities,
  type Account,
  type SignupInput,
  type University,
  type WorkspaceContext,
} from "@/lib/access";
import type {
  OnboardingDraft,
  WorkspaceAdapter,
} from "@/lib/workspace-adapter";
import Icon from "./icon";

export type DialogState = {
  type:
    | "event"
    | "organization"
    | "task"
    | "application"
    | "event-detail"
    | "organization-detail";
  id?: string;
} | null;
type ContextValue = {
  data: Workspace;
  profile: Profile;
  account: Account;
  university: University;
  context: WorkspaceContext;
  contexts: WorkspaceContext[];
  accessLabel: string;
  scoped: ReturnType<typeof selectWorkspace>;
  dialog: DialogState;
  error: string;
  pending: boolean;
  openDialog: (dialog: DialogState) => void;
  selectContext: (context: WorkspaceContext) => Promise<boolean>;
  prepareOnboarding: (input: SignupInput) => Promise<OnboardingDraft>;
  run: (command: Command, message: string) => Promise<boolean>;
  notify: (message: string) => void;
  reset: () => Promise<void>;
};
const Context = createContext<ContextValue | null>(null);
export function useCampus() {
  const value = useContext(Context);
  if (!value) throw new Error("CampusProvider is required.");
  return value;
}
export default function CampusProvider({
  children,
  adapter = previewAdapter,
}: {
  children: ReactNode;
  adapter?: WorkspaceAdapter;
}) {
  const snapshot = useSyncExternalStore(
    adapter.subscribe,
    adapter.getSnapshot,
    adapter.getServerSnapshot,
  );
  const router = useRouter();
  const [authenticatedAccount, setAuthenticatedAccount] =
    useState<Account | null>(null);
  const [authError, setAuthError] = useState("");
  const [authReady, setAuthReady] = useState(false);
  const [authRetry, setAuthRetry] = useState(0);
  const [dialog, openDialog] = useState<DialogState>(null);
  const [toast, setToast] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const mutationInFlight = useRef(false);
  useEffect(() => {
    let active = true;
    async function loadAccount() {
      setAuthReady(false);
      setAuthError("");
      try {
        const response = await fetch("/api/auth/account", {
          cache: "no-store",
        });
        const result = (await response.json()) as {
          account?: Account;
          error?: string;
        };
        if (response.status === 401) {
          router.replace(
            `/sign-in?next=${encodeURIComponent(window.location.pathname)}`,
          );
          return;
        }
        if (!response.ok || !result.account) {
          throw new Error(result.error ?? "Unable to load your account.");
        }
        if (active) setAuthenticatedAccount(result.account);
      } catch (error) {
        if (active) {
          setAuthError(
            error instanceof Error
              ? error.message
              : "Unable to load your account. Please try again.",
          );
        }
      } finally {
        if (active) setAuthReady(true);
      }
    }
    void loadAccount();
    return () => {
      active = false;
    };
  }, [authRetry, router]);
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);
  if (authError) {
    return (
      <div className="workspace-loading" role="alert">
        <span className="brand-mark">
          <Icon name="building" size={26} />
        </span>
        <strong>CampusOps</strong>
        <span>{authError}</span>
        <button
          className="button button-secondary"
          onClick={() => setAuthRetry((retry) => retry + 1)}
        >
          Try again
        </button>
      </div>
    );
  }
  if (!snapshot || !authReady || !authenticatedAccount)
    return (
      <div className="workspace-loading">
        <span className="brand-mark">
          <Icon name="building" size={26} />
        </span>
        <strong>CampusOps</strong>
        <span>Getting your campus ready…</span>
      </div>
    );
  const account = authenticatedAccount;
  const contexts = availableContexts(account);
  const context =
    contexts.find(
      (item) =>
        item.universityId === snapshot.context.universityId &&
        item.kind === snapshot.context.kind &&
        (item.kind !== "organization" ||
          (snapshot.context.kind === "organization" &&
            item.organizationId === snapshot.context.organizationId)),
    ) ?? contexts[0];
  if (!context) {
    return (
      <div className="workspace-loading" role="alert">
        <strong>Your account has no active campus workspace.</strong>
      </div>
    );
  }
  const profile = resolveProfile(account, context);
  const university =
    universities.find((item) => item.id === context.universityId) ??
    universities[0];
  const value: ContextValue = {
    data: snapshot.data,
    profile,
    account,
    university,
    context,
    contexts,
    accessLabel: accountLabel(account, context.universityId),
    prepareOnboarding: (input) => adapter.prepareOnboarding(input),
    scoped: selectWorkspace(snapshot.data, profile),
    dialog,
    error,
    pending,
    openDialog(next) {
      setError("");
      openDialog(next);
    },
    async selectContext(context) {
      if (mutationInFlight.current) {
        setToast("Please wait for the current change to finish.");
        return false;
      }
      try {
        await adapter.selectContext(context, account);
        openDialog(null);
        setError("");
        return true;
      } catch (error) {
        setToast(
          error instanceof Error ? error.message : "Workspace unavailable.",
        );
        return false;
      }
    },
    async run(command, message) {
      if (mutationInFlight.current) return false;
      mutationInFlight.current = true;
      setPending(true);
      try {
        await adapter.execute(command, account, context);
        setError("");
        setToast(message);
        return true;
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Something went wrong. Please try again.";
        setError(message);
        setToast(message);
        return false;
      } finally {
        mutationInFlight.current = false;
        setPending(false);
      }
    },
    notify: setToast,
    async reset() {
      try {
        await adapter.resetPreview();
        setToast("Demo reset. Your fresh workspace is ready.");
      } catch (error) {
        setToast(
          error instanceof Error ? error.message : "Could not reset the demo.",
        );
      }
    },
  };
  return (
    <Context.Provider value={value}>
      {snapshot.warning && (
        <div className="storage-warning" role="alert">
          {snapshot.warning}
        </div>
      )}
      {children}
      {toast && (
        <div className="toast" role="status">
          <Icon name="activity" size={18} />
          <span>{toast}</span>
          <button
            className="icon-button"
            aria-label="Dismiss notification"
            onClick={() => setToast("")}
          >
            <Icon name="close" size={16} />
          </button>
        </div>
      )}
    </Context.Provider>
  );
}
