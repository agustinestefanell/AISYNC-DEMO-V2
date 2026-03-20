import type { AuditAnswerPayload } from './types';

const CROSS_VERIFICATION_LAUNCH_PREFIX = 'aisync_cross_verification_launch_';

interface StoredCrossVerificationLaunch {
  payload: AuditAnswerPayload;
  createdAt: string;
}

function getLaunchStorageKey(launchId: string) {
  return `${CROSS_VERIFICATION_LAUNCH_PREFIX}${launchId}`;
}

export function getCrossVerificationLaunchIdFromLocation() {
  if (typeof window === 'undefined') {
    return null;
  }

  return new URLSearchParams(window.location.search).get('cv_launch');
}

export function readCrossVerificationLaunch(launchId: string) {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const rawValue = window.localStorage.getItem(getLaunchStorageKey(launchId));
    if (!rawValue) {
      return null;
    }

    const parsed = JSON.parse(rawValue) as StoredCrossVerificationLaunch;
    return parsed ?? null;
  } catch {
    return null;
  }
}

export function openCrossVerificationWindow(payload: AuditAnswerPayload) {
  if (typeof window === 'undefined') {
    return false;
  }

  const launchId = `cv_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  try {
    window.localStorage.setItem(
      getLaunchStorageKey(launchId),
      JSON.stringify({
        payload,
        createdAt: new Date().toISOString(),
      } satisfies StoredCrossVerificationLaunch),
    );
  } catch {
    return false;
  }

  const url = new URL(window.location.href);
  url.search = '';
  url.searchParams.set('page', 'G');
  url.searchParams.set('cv_launch', launchId);

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
