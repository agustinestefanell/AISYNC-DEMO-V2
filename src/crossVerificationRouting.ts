import type { WorkspaceVersion } from './types';

const SECONDARY_WORKSPACE_STORAGE_KEY = 'aisync_secondary_workspaces_v1';
const TEAM_MANAGER_THREAD_ID = '__team_manager__';
const SECONDARY_WORKSPACE_FOCUS_THREAD_KEY = 'aisync_secondary_workspace_focus_thread_v1';
const CROSS_VERIFICATION_SESSION_KEY = 'aisync_cross_verification_session_v1';

export interface RoutedWorkspaceMessage {
  id: string;
  role: 'user' | 'agent' | 'system';
  content: string;
  timestamp: string;
  senderLabel: string;
  variant?: 'standard' | 'forwarded';
}

export interface WorkspaceThreadState {
  messages: RoutedWorkspaceMessage[];
  selectedIds: string[];
  draft: string;
  locked: boolean;
  versions: WorkspaceVersion[];
}

export type SecondaryWorkspaceStore = Record<string, Record<string, WorkspaceThreadState>>;

function normalizeThreadState(
  threadState?: Partial<WorkspaceThreadState> | null,
): WorkspaceThreadState {
  return {
    messages: threadState?.messages ?? [],
    selectedIds: threadState?.selectedIds ?? [],
    draft: threadState?.draft ?? '',
    locked: threadState?.locked ?? false,
    versions: threadState?.versions ?? [],
  };
}

export function getSecondaryWorkspaceStore(): SecondaryWorkspaceStore {
  if (typeof window === 'undefined') {
    return {};
  }

  try {
    const rawValue = window.localStorage.getItem(SECONDARY_WORKSPACE_STORAGE_KEY);
    if (!rawValue) {
      return {};
    }

    const parsed = (JSON.parse(rawValue) as SecondaryWorkspaceStore) ?? {};

    return Object.fromEntries(
      Object.entries(parsed).map(([teamId, teamStore]) => [
        teamId,
        Object.fromEntries(
          Object.entries(teamStore ?? {}).map(([threadId, threadState]) => [
            threadId,
            normalizeThreadState(threadState),
          ]),
        ),
      ]),
    );
  } catch {
    return {};
  }
}

function saveSecondaryWorkspaceStore(store: SecondaryWorkspaceStore) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(SECONDARY_WORKSPACE_STORAGE_KEY, JSON.stringify(store));
}

function getThreadState(
  store: SecondaryWorkspaceStore,
  teamId: string,
  threadId: string,
): WorkspaceThreadState {
  return normalizeThreadState(store[teamId]?.[threadId]);
}

export function getWorkspaceThreadState(teamId: string, threadId: string) {
  return getThreadState(getSecondaryWorkspaceStore(), teamId, threadId);
}

export function setWorkspaceThreadState(
  teamId: string,
  threadId: string,
  nextThreadState: Partial<WorkspaceThreadState>,
) {
  const store = getSecondaryWorkspaceStore();
  const currentTeamStore = store[teamId] ?? {};
  const currentThreadStore = getThreadState(store, teamId, threadId);

  saveSecondaryWorkspaceStore({
    ...store,
    [teamId]: {
      ...currentTeamStore,
      [threadId]: {
        ...currentThreadStore,
        ...normalizeThreadState({
          ...currentThreadStore,
          ...nextThreadState,
        }),
      },
    },
  });
}

export function appendMessageToTeamWorker(
  teamId: string,
  workerId: string,
  message: RoutedWorkspaceMessage,
) {
  const currentWorkerStore = getWorkspaceThreadState(teamId, workerId);
  setWorkspaceThreadState(teamId, workerId, {
    ...currentWorkerStore,
    messages: [...currentWorkerStore.messages, message],
  });
}

export function appendMessageToTeamManagerThread(
  teamId: string,
  message: RoutedWorkspaceMessage,
) {
  const managerThread = getWorkspaceThreadState(teamId, TEAM_MANAGER_THREAD_ID);
  setWorkspaceThreadState(teamId, TEAM_MANAGER_THREAD_ID, {
    ...managerThread,
    messages: [...managerThread.messages, message],
  });
}

export function getTeamManagerThreadState(teamId: string) {
  return getThreadState(getSecondaryWorkspaceStore(), teamId, TEAM_MANAGER_THREAD_ID);
}

export function setWorkspaceThreadDraft(
  teamId: string,
  threadId: string,
  draft: string,
) {
  const currentThreadStore = getWorkspaceThreadState(teamId, threadId);
  setWorkspaceThreadState(teamId, threadId, {
    ...currentThreadStore,
    draft,
  });
}

export function getCrossVerificationSessionState<T>(fallback: T): T {
  if (typeof window === 'undefined') {
    return fallback;
  }

  try {
    const rawValue = window.localStorage.getItem(CROSS_VERIFICATION_SESSION_KEY);
    if (!rawValue) {
      return fallback;
    }

    return (JSON.parse(rawValue) as T) ?? fallback;
  } catch {
    return fallback;
  }
}

export function saveCrossVerificationSessionState<T>(state: T) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(CROSS_VERIFICATION_SESSION_KEY, JSON.stringify(state));
}

export function clearCrossVerificationSessionState() {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.removeItem(CROSS_VERIFICATION_SESSION_KEY);
}

export function setSecondaryWorkspaceFocusThread(teamId: string, threadId: string) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(
    SECONDARY_WORKSPACE_FOCUS_THREAD_KEY,
    JSON.stringify({ teamId, threadId }),
  );
}

export function consumeSecondaryWorkspaceFocusThread(teamId: string) {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const rawValue = window.localStorage.getItem(SECONDARY_WORKSPACE_FOCUS_THREAD_KEY);
    if (!rawValue) {
      return null;
    }

    const parsed = JSON.parse(rawValue) as { teamId?: string; threadId?: string };
    if (parsed.teamId !== teamId || !parsed.threadId) {
      return null;
    }

    window.localStorage.removeItem(SECONDARY_WORKSPACE_FOCUS_THREAD_KEY);
    return parsed.threadId;
  } catch {
    return null;
  }
}

export {
  CROSS_VERIFICATION_SESSION_KEY,
  SECONDARY_WORKSPACE_FOCUS_THREAD_KEY,
  SECONDARY_WORKSPACE_STORAGE_KEY,
  TEAM_MANAGER_THREAD_ID,
};
