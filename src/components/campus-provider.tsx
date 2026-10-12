"use client";

import {
  createContext,
  useContext,
  useState,
  useSyncExternalStore,
  useEffect,
  type ReactNode,
} from "react";
import {
  selectWorkspace,
  type Workspace,
  type Profile,
  type Command,
} from "@/lib/domain";
import { previewAdapter } from "@/lib/demo-store";
import { accountLabel, availableContexts, resolveProfile, universities, type Account, type SignupInput, type University, type WorkspaceContext } from "@/lib/access";
import type { OnboardingDraft, WorkspaceAdapter } from "@/lib/workspace-adapter";
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
export default function CampusProvider({ children, adapter = previewAdapter }: { children: ReactNode; adapter?: WorkspaceAdapter }) {
  const snapshot = useSyncExternalStore(
    adapter.subscribe,
    adapter.getSnapshot,
    adapter.getServerSnapshot,
  );
  const [dialog, openDialog] = useState<DialogState>(null);
  const [toast, setToast] = useState("");
  const [error, setError] = useState("");
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);
  if (!snapshot)
    return (
      <div className="workspace-loading">
        <span className="brand-mark">
          <Icon name="building" size={26} />
        </span>
        <strong>CampusOps</strong>
        <span>Getting your campus ready…</span>
      </div>
    );
  const profile = resolveProfile(snapshot.account, snapshot.context);
  const university = universities.find(item => item.id === snapshot.context.universityId) ?? universities[0];
  const value: ContextValue = {
    data: snapshot.data,
    profile,
    account: snapshot.account,
    university,
    context: snapshot.context,
    contexts: availableContexts(snapshot.account),
    accessLabel: accountLabel(snapshot.account, snapshot.context.universityId),
    prepareOnboarding: input => adapter.prepareOnboarding(input),
    scoped: selectWorkspace(snapshot.data, profile),
    dialog,
    error,
    openDialog(next) {
      setError("");
      openDialog(next);
    },
    async selectContext(context) {
      try { await adapter.selectContext(context); openDialog(null); setError(""); return true; }
      catch (error) { setToast(error instanceof Error ? error.message : "Workspace unavailable."); return false; }
    },
    async run(command, message) {
      try {
        await adapter.execute(command);
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
