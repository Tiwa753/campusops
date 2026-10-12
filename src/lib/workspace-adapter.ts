import type {
  Account,
  LeadershipRequest,
  SignupInput,
  WorkspaceContext,
} from "./access";
import type { Command, Workspace } from "./domain";

export type OnboardingDraft = {
  account: Account;
  leadershipRequest?: LeadershipRequest;
};
export type WorkspaceSnapshot = {
  mode: "preview" | "connected";
  data: Workspace;
  account: Account;
  context: WorkspaceContext;
  onboarding: OnboardingDraft | null;
  warning: string;
};

// UI dependency boundary. A future remote adapter authenticates through a trusted
// session, fetches only scoped records, and reauthorizes every server mutation.
export interface WorkspaceAdapter {
  subscribe(listener: () => void): () => void;
  getSnapshot(): WorkspaceSnapshot | null;
  getServerSnapshot(): WorkspaceSnapshot | null;
  execute(
    command: Command,
    account?: Account,
    context?: WorkspaceContext,
  ): Promise<void>;
  selectContext(context: WorkspaceContext, account?: Account): Promise<void>;
  prepareOnboarding(input: SignupInput): Promise<OnboardingDraft>;
  resetPreview(): Promise<void>;
}
