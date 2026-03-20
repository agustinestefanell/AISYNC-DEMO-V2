import type {
  AgentRole,
  CalendarEvent,
  WorkPhaseState,
  WorkspaceVersion,
  WorkspaceVersionSource,
} from './types';

interface VersionMessageLike {
  senderLabel: string;
  content: string;
}

export function buildVersionSnapshotContent(messages: VersionMessageLike[]) {
  return messages.map((message) => `${message.senderLabel}: ${message.content}`).join('\n\n');
}

export function createWorkspaceVersion(
  messages: VersionMessageLike[],
  draft: string,
  locked: boolean,
  existingVersions: WorkspaceVersion[],
  label?: string,
): WorkspaceVersion {
  const savedAt = new Date().toISOString();
  const versionNumber = existingVersions.length + 1;

  return {
    id: `version_${savedAt}_${versionNumber}`,
    versionNumber,
    savedAt,
    label,
    messageCount: messages.length,
    locked,
    draft,
    snapshotContent: buildVersionSnapshotContent(messages),
  };
}

export function formatWorkspaceVersionTimestamp(savedAt: string) {
  return new Date(savedAt).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

interface WorkspaceVersionEventArgs {
  version: WorkspaceVersion;
  projectId: string;
  agent: AgentRole;
  userLabel: string;
  sourceLabel: string;
  teamId: string;
  teamLabel: string;
  threadLabel: string;
  actorLabel: string;
  managerLabel: string;
  workerLabel?: string;
  versionSource: WorkspaceVersionSource;
  versionThreadId: string;
}

export function createWorkspaceVersionEvent({
  version,
  projectId,
  agent,
  userLabel,
  sourceLabel,
  teamId,
  teamLabel,
  threadLabel,
  actorLabel,
  managerLabel,
  workerLabel,
  versionSource,
  versionThreadId,
}: WorkspaceVersionEventArgs): CalendarEvent {
  const savedAt = new Date(version.savedAt);
  const phaseState: WorkPhaseState = version.locked ? 'Closed' : 'In Review';

  return {
    id: `version_event_${version.id}`,
    projectId,
    agent,
    sourceLabel,
    teamId,
    teamLabel,
    userLabel,
    actorLabel,
    managerLabel,
    workerLabel,
    actionLabel: 'Saved Chat Version',
    outputLabel: `${threadLabel} checkpoint`,
    phaseState,
    fileId: `workspace_version_${version.id}`,
    title: `Saved Chat Version | ${threadLabel} | Version ${version.versionNumber}`,
    date: version.savedAt.slice(0, 10),
    time: savedAt.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }),
    versionId: version.id,
    versionSource,
    versionThreadId,
  };
}
