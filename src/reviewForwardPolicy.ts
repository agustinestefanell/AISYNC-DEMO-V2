import { GENERAL_MANAGER_LABEL } from './context';
import { getInitialTeamsMapState, getTopLevelUnits } from './data/teams';
import type {
  AgentRole,
  AuditAnswerPayload,
  AuditAnswerRoutingTarget,
  Page,
  ReviewForwardSourceKind,
  ReviewForwardTargetOption,
} from './types';

function dedupeReviewTargets(targets: ReviewForwardTargetOption[]) {
  const seen = new Set<string>();

  return targets.filter((target) => {
    if (seen.has(target.id)) {
      return false;
    }

    seen.add(target.id);
    return true;
  });
}

function buildGeneralManagerTarget(): ReviewForwardTargetOption {
  return {
    id: 'main_workspace:manager',
    label: GENERAL_MANAGER_LABEL,
    kind: 'general-manager',
    agentRole: 'manager',
    teamId: 'main_workspace',
  };
}

function buildGeneralManagerAuditRoutingTarget(page: Page = 'A'): AuditAnswerRoutingTarget {
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

function getSystemSubManagerTargets(): ReviewForwardTargetOption[] {
  const { teamsGraph } = getInitialTeamsMapState();

  return getTopLevelUnits(teamsGraph)
    .filter((node) => node.type === 'senior_manager')
    .map((node) => ({
      id: `team:${node.teamId}:sub-manager`,
      label: `${node.label} Sub-Manager`,
      kind: 'team-sub-manager' as const,
      teamId: node.teamId,
    }));
}

export function getAgentPanelForwardTargets(
  agent: AgentRole,
  managerDisplayName?: string,
): ReviewForwardTargetOption[] {
  if (agent === 'manager') {
    const isSecondaryPageSubManager =
      Boolean(managerDisplayName) && managerDisplayName !== GENERAL_MANAGER_LABEL;

    if (isSecondaryPageSubManager) {
      return [buildGeneralManagerTarget()];
    }

    return dedupeReviewTargets([
      {
        id: 'worker1',
        label: 'Worker 1',
        kind: 'main-worker',
        agentRole: 'worker1',
      },
      {
        id: 'worker2',
        label: 'Worker 2',
        kind: 'main-worker',
        agentRole: 'worker2',
      },
      ...getSystemSubManagerTargets(),
    ]);
  }

  return [buildGeneralManagerTarget()];
}

export function isValidAgentPanelForwardTarget(
  agent: AgentRole,
  targetId: string,
  managerDisplayName?: string,
) {
  return getAgentPanelForwardTargets(agent, managerDisplayName).some(
    (target) => target.id === targetId,
  );
}

export function getTeamSubManagerForwardTargets(
  workers: Array<{ id: string; label: string }>,
): ReviewForwardTargetOption[] {
  return [
    ...workers.map((worker) => ({
      id: worker.id,
      label: worker.label,
      kind: 'team-worker' as const,
      workerId: worker.id,
    })),
    buildGeneralManagerTarget(),
  ];
}

export function isValidTeamSubManagerForwardTarget(
  target: Pick<ReviewForwardTargetOption, 'id' | 'agentRole' | 'workerId'> | null | undefined,
  workerIds: string[],
) {
  if (!target) {
    return false;
  }

  if (
    target.id === 'main_workspace:manager' &&
    target.agentRole === 'manager'
  ) {
    return true;
  }

  return Boolean(target.workerId && workerIds.includes(target.workerId));
}

export function getCrossVerificationForwardTargets(
  payload: AuditAnswerPayload | null,
  preservedTargets?: AuditAnswerRoutingTarget[] | null,
): AuditAnswerRoutingTarget[] {
  const dedupedPreservedTargets = (preservedTargets ?? []).filter(
    (target, index, collection) =>
      collection.findIndex((candidate) => candidate.id === target.id) === index,
  );
  if (dedupedPreservedTargets.length > 0) {
    return dedupedPreservedTargets;
  }

  const contextualTargets = [
    payload?.sourceReturnTarget ?? null,
    payload?.sourcePrimarySubManagerTarget ?? null,
  ].filter((target): target is AuditAnswerRoutingTarget => Boolean(target));

  const dedupedContextualTargets = contextualTargets.filter(
    (target, index, collection) =>
      collection.findIndex((candidate) => candidate.id === target.id) === index,
  );
  if (dedupedContextualTargets.length > 0) {
    return dedupedContextualTargets;
  }

  const fallback = buildGeneralManagerAuditRoutingTarget();
  const supervisorTarget = payload?.sourceGeneralManagerTarget;
  return [
    supervisorTarget && isValidCrossVerificationForwardTarget(supervisorTarget)
      ? supervisorTarget
      : fallback,
  ];
}

export function isValidCrossVerificationForwardTarget(
  target: AuditAnswerRoutingTarget | null | undefined,
) {
  return Boolean(
    target &&
      target.id === 'main_workspace:manager' &&
      target.kind === 'general-manager' &&
      target.sourceArea === 'main-workspace' &&
      target.agentRole === 'manager',
  );
}

export function isValidAuditRoutingTargetForReviewForward(
  sourceKind: ReviewForwardSourceKind,
  target: AuditAnswerRoutingTarget | null | undefined,
) {
  if (sourceKind === 'cross-verification-sub-manager') {
    return Boolean(
      target &&
        ((target.kind === 'worker' && target.sourceArea === 'team-workspace' && target.teamId && target.workerId) ||
          (target.kind === 'sub-manager' &&
            (target.sourceArea === 'team-workspace' || target.sourceArea === 'main-workspace') &&
            target.teamId) ||
          isValidCrossVerificationForwardTarget(target)),
    );
  }

  return false;
}
