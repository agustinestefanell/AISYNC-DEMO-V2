import type { SecondaryWorkspaceTarget } from './types';

const TEAM_WORKSPACE_LAUNCH_PREFIX = 'aisync_team_workspace_launch_';

interface StoredTeamWorkspaceLaunch {
  workspace: SecondaryWorkspaceTarget;
  createdAt: string;
}

function getLaunchStorageKey(launchId: string) {
  return `${TEAM_WORKSPACE_LAUNCH_PREFIX}${launchId}`;
}

export function getTeamWorkspaceLaunchIdFromLocation() {
  if (typeof window === 'undefined') {
    return null;
  }

  return new URLSearchParams(window.location.search).get('team_workspace_launch');
}

export function readTeamWorkspaceLaunch(launchId: string) {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const rawValue = window.localStorage.getItem(getLaunchStorageKey(launchId));
    if (!rawValue) {
      return null;
    }

    const parsed = JSON.parse(rawValue) as StoredTeamWorkspaceLaunch;
    return parsed ?? null;
  } catch {
    return null;
  }
}

export function openTeamWorkspaceWindow(workspace: SecondaryWorkspaceTarget) {
  if (typeof window === 'undefined') {
    return false;
  }

  const launchId = `team_ws_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  try {
    window.localStorage.setItem(
      getLaunchStorageKey(launchId),
      JSON.stringify({
        workspace,
        createdAt: new Date().toISOString(),
      } satisfies StoredTeamWorkspaceLaunch),
    );
  } catch {
    return false;
  }

  const url = new URL(window.location.href);
  url.search = '';
  url.searchParams.set('page', 'F');
  url.searchParams.set('team_workspace_launch', launchId);

  const launchedWindow = window.open('', '_blank');
  if (!launchedWindow) {
    return false;
  }

  try {
    launchedWindow.opener = null;
  } catch {
    // Ignore browsers that expose opener as read-only.
  }

  launchedWindow.location.replace(url.toString());
  return true;
}
