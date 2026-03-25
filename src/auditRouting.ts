import { GENERAL_MANAGER_LABEL } from './context';
import { getPageLabel } from './pageLabels';
import type {
  AgentRole,
  AuditAnswerPayload,
  AuditAnswerRoutingTarget,
  Message,
  Page,
  SecondaryWorkspaceTarget,
} from './types';

function buildAuditContent(messages: Array<Pick<Message, 'senderLabel' | 'content'>>) {
  return messages.map((message) => `${message.senderLabel}: ${message.content.trim()}`).join('\n\n');
}

export function buildGeneralManagerRoutingTarget(page: Page = 'A'): AuditAnswerRoutingTarget {
  return {
    id: 'main_workspace:manager',
    kind: 'general-manager',
    label: GENERAL_MANAGER_LABEL,
    page,
    sourceArea: 'main-workspace',
    teamId: 'main_workspace',
    teamLabel: 'Main Workspace',
    agentRole: 'manager',
  };
}

export function buildMainWorkspaceWorkerRoutingTarget(
  agent: Extract<AgentRole, 'worker1' | 'worker2'>,
  page: Page,
): AuditAnswerRoutingTarget {
  return {
    id: `main_workspace:${agent}`,
    kind: 'worker',
    label: agent === 'worker1' ? 'Worker 1' : 'Worker 2',
    page,
    sourceArea: 'main-workspace',
    teamId: 'main_workspace',
    teamLabel: 'Main Workspace',
    agentRole: agent,
  };
}

export function buildSecondaryPageSubManagerRoutingTarget(
  page: Page,
  label: string,
): AuditAnswerRoutingTarget {
  return {
    id: `secondary_page:${page}:sub-manager`,
    kind: 'sub-manager',
    label,
    page,
    sourceArea: 'main-workspace',
    teamId: `secondary_page:${page}`,
    teamLabel: getPageLabel(page),
    agentRole: 'manager',
  };
}

export function buildTeamWorkerRoutingTarget({
  page,
  teamId,
  teamLabel,
  workspace,
  workerId,
  workerLabel,
}: {
  page: Page;
  teamId: string;
  teamLabel: string;
  workspace: SecondaryWorkspaceTarget | null;
  workerId: string;
  workerLabel: string;
}): AuditAnswerRoutingTarget {
  return {
    id: `${teamId}:${workerId}`,
    kind: 'worker',
    label: workerLabel,
    page,
    sourceArea: 'team-workspace',
    teamId,
    teamLabel,
    workspace,
    workerId,
  };
}

export function buildTeamSubManagerRoutingTarget({
  page,
  teamId,
  teamLabel,
  workspace,
  label = `${teamLabel} Sub-Manager`,
}: {
  page: Page;
  teamId: string;
  teamLabel: string;
  workspace: SecondaryWorkspaceTarget | null;
  label?: string;
}): AuditAnswerRoutingTarget {
  return {
    id: `${teamId}:sub-manager`,
    kind: 'sub-manager',
    label,
    page,
    sourceArea: 'team-workspace',
    teamId,
    teamLabel,
    workspace,
  };
}

export function buildCrossVerificationSubManagerRoutingTarget(): AuditAnswerRoutingTarget {
  return {
    id: 'team_cross_verification:sub-manager',
    kind: 'sub-manager',
    label: 'Cross Verification Sub-Manager',
    page: 'G',
    sourceArea: 'cross-verification',
    teamId: 'team_cross_verification',
    teamLabel: 'Cross Verification',
  };
}

export function buildMainWorkspaceAuditAnswerPayload({
  page,
  agent,
  managerDisplayName,
  selectedMessages,
}: {
  page: Page;
  agent: AgentRole;
  managerDisplayName?: string;
  selectedMessages: Message[];
}): AuditAnswerPayload {
  const generalManagerTarget = buildGeneralManagerRoutingTarget('A');
  const isSecondaryPageSubManager =
    agent === 'manager' &&
    Boolean(managerDisplayName) &&
    managerDisplayName !== GENERAL_MANAGER_LABEL;

  if (isSecondaryPageSubManager) {
    const subManagerTarget = buildSecondaryPageSubManagerRoutingTarget(
      page,
      managerDisplayName ?? getPageLabel(page),
    );

    return {
      sourcePage: page,
      sourceWorkspace: null,
      sourceArea: 'main-workspace',
      sourceAgentId: subManagerTarget.id,
      sourceAgentLabel: subManagerTarget.label,
      sourceAgentType: 'sub-manager',
      sourceTeamId: subManagerTarget.teamId ?? `secondary_page:${page}`,
      sourceTeamLabel: subManagerTarget.teamLabel ?? getPageLabel(page),
      sourceReturnTarget: subManagerTarget,
      sourcePrimarySubManagerTarget: subManagerTarget,
      sourceGeneralManagerTarget: generalManagerTarget,
      contentType: 'message-selection',
      selectedCount: selectedMessages.length,
      messageIds: selectedMessages.map((message) => message.id),
      content: buildAuditContent(selectedMessages),
    };
  }

  if (agent === 'manager') {
    return {
      sourcePage: page,
      sourceWorkspace: null,
      sourceArea: 'main-workspace',
      sourceAgentId: 'main_workspace:manager',
      sourceAgentLabel: GENERAL_MANAGER_LABEL,
      sourceAgentType: 'general-manager',
      sourceTeamId: 'main_workspace',
      sourceTeamLabel: 'Main Workspace',
      sourceReturnTarget: generalManagerTarget,
      sourcePrimarySubManagerTarget: null,
      sourceGeneralManagerTarget: generalManagerTarget,
      contentType: 'message-selection',
      selectedCount: selectedMessages.length,
      messageIds: selectedMessages.map((message) => message.id),
      content: buildAuditContent(selectedMessages),
    };
  }

  return {
    sourcePage: page,
    sourceWorkspace: null,
    sourceArea: 'main-workspace',
    sourceAgentId: agent,
    sourceAgentLabel: agent === 'worker1' ? 'Worker 1' : 'Worker 2',
    sourceAgentType: 'worker',
    sourceTeamId: 'main_workspace',
    sourceTeamLabel: 'Main Workspace',
    sourceReturnTarget: buildMainWorkspaceWorkerRoutingTarget(agent, page),
    sourcePrimarySubManagerTarget: generalManagerTarget,
    sourceGeneralManagerTarget: generalManagerTarget,
    contentType: 'message-selection',
    selectedCount: selectedMessages.length,
    messageIds: selectedMessages.map((message) => message.id),
    content: buildAuditContent(selectedMessages),
  };
}

export function buildTeamWorkerAuditAnswerPayload({
  page,
  workspace,
  teamId,
  teamLabel,
  workerId,
  workerLabel,
  selectedMessages,
}: {
  page: Page;
  workspace: SecondaryWorkspaceTarget | null;
  teamId: string;
  teamLabel: string;
  workerId: string;
  workerLabel: string;
  selectedMessages: Array<Pick<Message, 'id' | 'senderLabel' | 'content'>>;
}): AuditAnswerPayload {
  return {
    sourcePage: page,
    sourceWorkspace: workspace,
    sourceArea: 'team-workspace',
    sourceAgentId: workerId,
    sourceAgentLabel: workerLabel,
    sourceAgentType: 'worker',
    sourceTeamId: teamId,
    sourceTeamLabel: teamLabel,
    sourceReturnTarget: buildTeamWorkerRoutingTarget({
      page,
      teamId,
      teamLabel,
      workspace,
      workerId,
      workerLabel,
    }),
    sourcePrimarySubManagerTarget: buildTeamSubManagerRoutingTarget({
      page,
      teamId,
      teamLabel,
      workspace,
    }),
    sourceGeneralManagerTarget: buildGeneralManagerRoutingTarget('A'),
    contentType: 'message-selection',
    selectedCount: selectedMessages.length,
    messageIds: selectedMessages.map((message) => message.id),
    content: buildAuditContent(selectedMessages),
  };
}

export function buildTeamSubManagerAuditAnswerPayload({
  page,
  workspace,
  teamId,
  teamLabel,
  label = `${teamLabel} Sub-Manager`,
  selectedMessages,
}: {
  page: Page;
  workspace: SecondaryWorkspaceTarget | null;
  teamId: string;
  teamLabel: string;
  label?: string;
  selectedMessages: Array<Pick<Message, 'id' | 'senderLabel' | 'content'>>;
}): AuditAnswerPayload {
  const subManagerTarget = buildTeamSubManagerRoutingTarget({
    page,
    teamId,
    teamLabel,
    workspace,
    label,
  });

  return {
    sourcePage: page,
    sourceWorkspace: workspace,
    sourceArea: 'team-workspace',
    sourceAgentId: subManagerTarget.id,
    sourceAgentLabel: subManagerTarget.label,
    sourceAgentType: 'sub-manager',
    sourceTeamId: teamId,
    sourceTeamLabel: teamLabel,
    sourceReturnTarget: subManagerTarget,
    sourcePrimarySubManagerTarget: subManagerTarget,
    sourceGeneralManagerTarget: buildGeneralManagerRoutingTarget('A'),
    contentType: 'message-selection',
    selectedCount: selectedMessages.length,
    messageIds: selectedMessages.map((message) => message.id),
    content: buildAuditContent(selectedMessages),
  };
}
