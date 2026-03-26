import type {
  CalendarEvent,
  DocumentationAgentManifest,
  DocumentationAgentUnit,
  DocumentationIndexEntry,
  DocumentationModeModel,
  DocumentationRepositoryRoot,
  DocumentationTeamFolder,
  DocumentationTeamManifest,
  SavedFile,
  TeamsGraphNode,
  TeamsNodeType,
} from './types';

export interface DocumentationMirrorNode {
  id: string;
  kind: 'root' | 'folder' | 'team' | 'agent';
  label: string;
  path: string;
  roleLabel?: string;
  children: DocumentationMirrorNode[];
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'unnamed';
}

function joinPath(...segments: string[]) {
  return segments
    .filter(Boolean)
    .map((segment, index) => {
      if (index === 0) {
        return segment.replace(/[\\/]+$/g, '');
      }
      return segment.replace(/^[\\/]+|[\\/]+$/g, '');
    })
    .join('/');
}

function getDocumentationRole(nodeType: TeamsNodeType) {
  if (nodeType === 'general_manager') return 'general_manager';
  if (nodeType === 'senior_manager') return 'sub_manager';
  return 'worker';
}

function isPromotedSubManagerNode(node: TeamsGraphNode) {
  return node.type === 'senior_manager' && node.parentId !== 'gm_1';
}

function getNodeDepth(node: TeamsGraphNode, nodesById: Map<string, TeamsGraphNode>) {
  let depth = 0;
  let currentParentId = node.parentId;

  while (currentParentId && currentParentId !== 'gm_1') {
    const parentNode = nodesById.get(currentParentId);
    if (!parentNode) {
      break;
    }

    depth += 1;
    currentParentId = parentNode.parentId;
  }

  return depth;
}

function buildChecksum(seed: string) {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) >>> 0;
  }
  return `chk_${hash.toString(16).padStart(8, '0')}`;
}

function getTopLevelDocumentationTeams(teamsGraph: TeamsGraphNode[]) {
  return teamsGraph.filter((node) => node.parentId === 'gm_1' && node.type !== 'general_manager');
}

export function buildDocumentationModeModel({
  root,
  teamsGraph,
  savedFiles,
  calendarEvents,
}: {
  root: DocumentationRepositoryRoot;
  teamsGraph: TeamsGraphNode[];
  savedFiles: SavedFile[];
  calendarEvents: CalendarEvent[];
}): DocumentationModeModel {
  const now = new Date().toISOString();
  const topLevelTeams = getTopLevelDocumentationTeams(teamsGraph);
  const nodesById = new Map(teamsGraph.map((node) => [node.id, node]));
  const teamRootsByTeamId = new Map(topLevelTeams.map((node) => [node.teamId, node]));

  const teamFolders: DocumentationTeamFolder[] = topLevelTeams.map((node) => ({
    teamId: node.teamId,
    teamLabel: node.label,
    parentTeamId: node.parentId && node.parentId !== 'gm_1' ? nodesById.get(node.parentId)?.teamId ?? null : null,
    rootAgentId: node.id,
    path: joinPath(root.path, 'teams', `${slugify(node.label)}__${node.teamId}`),
    agentUnitIds: [],
    childTeamIds: [],
  }));

  const teamFoldersByTeamId = new Map(teamFolders.map((folder) => [folder.teamId, folder]));
  const agentUnitsById = new Map<string, DocumentationAgentUnit>();
  const currentUnitIdByNodeId = new Map<string, string>();

  const buildAgentUnitPath = (
    node: TeamsGraphNode,
    role: TeamsNodeType,
    lifecycleStage: DocumentationAgentUnit['lifecycleStage'],
  ): string => {
    const teamFolder = teamFoldersByTeamId.get(node.teamId);
    const parentNode = node.parentId ? nodesById.get(node.parentId) ?? null : null;
    const roleSlug = role === 'senior_manager' ? 'sub-manager' : role;
    const stageSuffix = lifecycleStage === 'historical-worker-stage' ? '__historical' : '';
    const unitFolderName = `${slugify(node.label)}__${node.id}__${roleSlug}${stageSuffix}`;

    if (!teamFolder) {
      return joinPath(root.path, 'teams', `orphan__${node.teamId}`, unitFolderName);
    }

    if (!parentNode || parentNode.id === 'gm_1' || parentNode.teamId !== node.teamId) {
      return joinPath(teamFolder.path, unitFolderName);
    }

    const parentUnitId = currentUnitIdByNodeId.get(parentNode.id);
    const parentUnit = parentUnitId ? agentUnitsById.get(parentUnitId) ?? null : null;
    return joinPath(parentUnit?.path ?? teamFolder.path, unitFolderName);
  };

  const orderedNodes = teamsGraph
    .filter((node) => node.type !== 'general_manager')
    .sort((left, right) => {
      const leftDepth = getNodeDepth(left, nodesById);
      const rightDepth = getNodeDepth(right, nodesById);
      if (leftDepth !== rightDepth) {
        return leftDepth - rightDepth;
      }
      return left.label.localeCompare(right.label);
    });

  orderedNodes.forEach((node) => {
    const teamFolder = teamFoldersByTeamId.get(node.teamId);
    const parentTeamId =
      node.parentId && node.parentId !== 'gm_1' ? nodesById.get(node.parentId)?.teamId ?? null : null;
    const parentAgentId = node.parentId && node.parentId !== 'gm_1' ? node.parentId : null;
    const treeParentUnitId = parentAgentId ? currentUnitIdByNodeId.get(parentAgentId) ?? null : null;

    if (isPromotedSubManagerNode(node)) {
      const historicalUnitId = `${node.id}:worker-history`;
      const historicalWorkerLabel = node.documentationHistory?.historicalWorkerLabel?.trim() || node.label;
      const historicalWorkerUnit: DocumentationAgentUnit = {
        unitId: historicalUnitId,
        stableIdentityId: node.id,
        teamId: node.teamId,
        teamLabel: teamRootsByTeamId.get(node.teamId)?.label ?? node.label,
        agentId: node.id,
        agentLabel: historicalWorkerLabel,
        agentRole: 'worker',
        parentTeamId,
        parentAgentId,
        treeParentUnitId,
        path: buildAgentUnitPath(node, 'worker', 'historical-worker-stage'),
        createdAt: now,
        updatedAt: now,
        historical: true,
        lifecycleStage: 'historical-worker-stage',
      };

      const currentSubManagerUnitId = `${node.id}:senior_manager`;
      const currentSubManagerUnit: DocumentationAgentUnit = {
        unitId: currentSubManagerUnitId,
        stableIdentityId: node.id,
        teamId: node.teamId,
        teamLabel: teamRootsByTeamId.get(node.teamId)?.label ?? node.label,
        agentId: node.id,
        agentLabel: node.label,
        agentRole: 'senior_manager',
        parentTeamId,
        parentAgentId,
        treeParentUnitId,
        path: buildAgentUnitPath(node, 'senior_manager', 'current'),
        createdAt: now,
        updatedAt: now,
        historical: false,
        lifecycleStage: 'current',
      };

      agentUnitsById.set(historicalUnitId, historicalWorkerUnit);
      agentUnitsById.set(currentSubManagerUnitId, currentSubManagerUnit);
      currentUnitIdByNodeId.set(node.id, currentSubManagerUnitId);
      if (teamFolder) {
        teamFolder.agentUnitIds.push(historicalUnitId, currentSubManagerUnitId);
      }
      return;
    }

    const unitId = `${node.id}:${node.type}`;
    const agentUnit: DocumentationAgentUnit = {
      unitId,
      stableIdentityId: node.id,
      teamId: node.teamId,
      teamLabel: teamRootsByTeamId.get(node.teamId)?.label ?? node.label,
      agentId: node.id,
      agentLabel: node.label,
      agentRole: node.type,
      parentTeamId,
      parentAgentId,
      treeParentUnitId,
      path: buildAgentUnitPath(node, node.type, 'current'),
      createdAt: now,
      updatedAt: now,
      historical: false,
      lifecycleStage: 'current',
    };

    agentUnitsById.set(unitId, agentUnit);
    currentUnitIdByNodeId.set(node.id, unitId);
    if (teamFolder) {
      teamFolder.agentUnitIds.push(unitId);
    }
  });

  const teamManifests: DocumentationTeamManifest[] = teamFolders.map((folder) => ({
    kind: 'team',
    manifest_id: `manifest_team_${folder.teamId}`,
    team_folder_id: folder.teamId,
    team_id: folder.teamId,
    team_label: folder.teamLabel,
    agent_id: null,
    agent_label: null,
    agent_role: null,
    parent_team_id: folder.parentTeamId,
    parent_agent_id: folder.rootAgentId,
    created_at: now,
    updated_at: now,
    origin_workspace: 'documentation-mode',
    status: 'active',
    record_class: 'team-record',
    sensitivity_level: 'internal',
    retention_rule: 'retain-until-policy-defined',
    official_copy: false,
    path: joinPath(folder.path, '_manifest', 'team.manifest.json'),
    checksum: buildChecksum(`${folder.teamId}|${folder.path}`),
    related_audit_events: calendarEvents
      .filter((event) => event.teamId === folder.teamId)
      .map((event) => event.id),
  }));

  const agentManifests: DocumentationAgentManifest[] = Array.from(agentUnitsById.values()).map((unit) => ({
    kind: 'agent',
    manifest_id: `manifest_agent_${unit.unitId}`,
    agent_unit_id: unit.unitId,
    stable_identity_id: unit.stableIdentityId,
    visible_label: unit.agentLabel,
    team_id: unit.teamId,
    team_label: unit.teamLabel,
    agent_id: unit.agentId,
    agent_label: unit.agentLabel,
    agent_role: getDocumentationRole(unit.agentRole),
    parent_team_id: unit.parentTeamId,
    parent_agent_id: unit.parentAgentId,
    created_at: unit.createdAt,
    updated_at: unit.updatedAt,
    origin_workspace: unit.agentRole === 'worker' ? 'team-workspace' : 'documentation-mode',
    status: unit.historical ? 'archived' : 'active',
    record_class: 'agent-record',
    sensitivity_level: 'internal',
    retention_rule: 'retain-until-policy-defined',
    official_copy: false,
    path: joinPath(unit.path, '_manifest', 'agent.manifest.json'),
    checksum: buildChecksum(`${unit.unitId}|${unit.path}`),
    related_audit_events: calendarEvents
      .filter((event) => event.teamId === unit.teamId && (event.workerLabel === unit.agentLabel || event.actorLabel === unit.agentLabel))
      .map((event) => event.id),
  }));

  const teamIndexEntries: DocumentationIndexEntry[] = teamFolders.map((folder) => ({
    id: `idx_team_${folder.teamId}`,
    entryKind: 'team',
    teamId: folder.teamId,
    teamLabel: folder.teamLabel,
    agentId: null,
    agentLabel: null,
    agentRole: null,
    eventId: null,
    date: null,
    status: 'active',
    origin: 'documentation-mode',
    destination: null,
    auditEventIds: calendarEvents.filter((event) => event.teamId === folder.teamId).map((event) => event.id),
    path: folder.path,
  }));

  const agentIndexEntries: DocumentationIndexEntry[] = Array.from(agentUnitsById.values()).map((unit) => ({
    id: `idx_agent_${unit.unitId}`,
    entryKind: 'agent',
    teamId: unit.teamId,
    teamLabel: unit.teamLabel,
    agentId: unit.agentId,
    agentLabel: unit.agentLabel,
    agentRole: getDocumentationRole(unit.agentRole),
    eventId: null,
    date: unit.updatedAt.slice(0, 10),
    status: unit.historical ? 'historical' : 'active',
    origin: getDocumentationRole(unit.agentRole),
    destination: unit.parentAgentId,
    auditEventIds: calendarEvents
      .filter((event) => event.teamId === unit.teamId && (event.actorLabel === unit.agentLabel || event.workerLabel === unit.agentLabel))
      .map((event) => event.id),
    path: unit.path,
  }));

  const fileIndexEntries: DocumentationIndexEntry[] = savedFiles.map((file) => {
    const relatedEvent = calendarEvents.find((event) => event.fileId === file.id) ?? null;
    const teamId = relatedEvent?.teamId ?? 'global';
    const teamLabel = relatedEvent?.teamLabel ?? 'Main Workspace';
    return {
      id: `idx_file_${file.id}`,
      entryKind: 'file',
      teamId,
      teamLabel,
      agentId: null,
      agentLabel: file.sourceLabel ?? null,
      agentRole: file.agent,
      eventId: relatedEvent?.id ?? null,
      date: file.createdAt.slice(0, 10),
      status: file.phaseState ?? 'Open',
      origin: file.sourceLabel ?? file.agent,
      destination: relatedEvent?.managerLabel ?? null,
      auditEventIds: relatedEvent ? [relatedEvent.id] : [],
      path: joinPath(root.path, 'projects', `${slugify(file.projectId)}__${file.id}`),
      relatedFileId: file.id,
    };
  });

  return {
    root,
    teamFolders,
    agentUnits: Array.from(agentUnitsById.values()),
    teamManifests,
    agentManifests,
    indexEntries: [...teamIndexEntries, ...agentIndexEntries, ...fileIndexEntries],
    compatibility: {
      auditLog: true,
      calendarMode: true,
      complianceReady: true,
      dataSafetyReady: true,
    },
  };
}

function getMirrorRoleLabel(role?: TeamsNodeType) {
  if (role === 'general_manager') return 'General Manager';
  if (role === 'senior_manager') return 'Sub-Manager';
  if (role === 'worker') return 'Worker';
  return undefined;
}

export function buildDocumentationMirrorTree(
  model: DocumentationModeModel,
): DocumentationMirrorNode {
  const unitsByParentAgentId = model.agentUnits.reduce<Record<string, DocumentationAgentUnit[]>>(
    (accumulator, unit) => {
      const key = unit.treeParentUnitId ?? `team:${unit.teamId}`;
      accumulator[key] = [...(accumulator[key] ?? []), unit];
      return accumulator;
    },
    {},
  );

  const buildAgentBranch = (unit: DocumentationAgentUnit): DocumentationMirrorNode => ({
    id: `agent:${unit.unitId}`,
    kind: 'agent',
    label: unit.agentLabel,
    path: unit.path,
    roleLabel: `${getMirrorRoleLabel(unit.agentRole)}${unit.historical ? ' • Historical' : ''}`,
    children: (unitsByParentAgentId[unit.unitId] ?? [])
      .sort((left, right) => {
        if (left.stableIdentityId === right.stableIdentityId && left.historical !== right.historical) {
          return left.historical ? -1 : 1;
        }
        if (left.agentRole !== right.agentRole) {
          return left.agentRole === 'senior_manager' ? -1 : 1;
        }
        return left.agentLabel.localeCompare(right.agentLabel);
      })
      .map(buildAgentBranch),
  });

  const teamNodes = model.teamFolders
    .slice()
    .sort((left, right) => left.teamLabel.localeCompare(right.teamLabel))
    .map((teamFolder) => ({
      id: `team:${teamFolder.teamId}`,
      kind: 'team' as const,
      label: teamFolder.teamLabel,
      path: teamFolder.path,
      children: (unitsByParentAgentId[`team:${teamFolder.teamId}`] ?? [])
        .sort((left, right) => {
          if (left.stableIdentityId === right.stableIdentityId && left.historical !== right.historical) {
            return left.historical ? -1 : 1;
          }
          if (left.agentRole !== right.agentRole) {
            return left.agentRole === 'senior_manager' ? -1 : 1;
          }
          return left.agentLabel.localeCompare(right.agentLabel);
        })
        .map(buildAgentBranch),
    }));

  return {
    id: 'docs-root',
    kind: 'root',
    label: model.root.path,
    path: model.root.path,
    children: [
      {
        id: 'docs-folder-teams',
        kind: 'folder',
        label: 'teams',
        path: `${model.root.path}/teams`,
        children: teamNodes,
      },
    ],
  };
}
