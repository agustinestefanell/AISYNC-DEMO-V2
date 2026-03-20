export type Page = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H';
export type AgentRole = 'manager' | 'worker1' | 'worker2';
export type MessageRole = 'user' | 'agent' | 'system';
export type FileType = 'Conversation' | 'Document' | 'Report';
export type AIProvider = 'OpenAI' | 'Anthropic' | 'Google';
export type TeamsNodeType = 'general_manager' | 'senior_manager' | 'worker';
export type PromptVisibility = 'public' | 'private';
export type WorkPhaseState = 'Open' | 'In Review' | 'Closed';
export type AuditAnswerContentType = 'message-selection';
export type AuditAnswerSourceAgentType = 'manager' | 'sub-manager' | 'worker';
export type WorkspaceVersionSource = 'main' | 'team';
export type AuditAnswerRoutingTargetKind =
  | 'origin-agent'
  | 'origin-team-sub-manager'
  | 'origin-supervisor'
  | 'cross-verification-sub-manager';

export interface SecondaryWorkspaceTarget {
  teamId: string;
  label: string;
  color: string;
}

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: string;
  agent: AgentRole;
  senderLabel: string;
  variant?: 'standard' | 'forwarded';
}

export interface Project {
  id: string;
  name: string;
}

export interface SavedFile {
  id: string;
  projectId: string;
  agent: AgentRole;
  sourceLabel?: string;
  phaseState?: WorkPhaseState;
  title: string;
  type: FileType;
  content: string;
  createdAt: string;
}

export interface CalendarEvent {
  id: string;
  projectId: string;
  agent: AgentRole;
  sourceLabel?: string;
  teamId?: string;
  teamLabel?: string;
  userLabel?: string;
  actorLabel?: string;
  managerLabel?: string;
  workerLabel?: string;
  actionLabel?: string;
  outputLabel?: string;
  phaseState?: WorkPhaseState;
  fileId: string;
  title: string;
  date: string;
  time: string;
  versionId?: string;
  versionSource?: WorkspaceVersionSource;
  versionThreadId?: string;
}

export interface WorkerConfig {
  id: string;
  workerName: string;
  provider: AIProvider;
  promptFileName: string;
  promptContent: string;
  createdAt: string;
}

export interface TeamsGraphNode {
  id: string;
  type: TeamsNodeType;
  label: string;
  provider: AIProvider;
  parentId: string | null;
  teamId: string;
  phaseState?: WorkPhaseState;
}

export interface TeamFolderItem {
  id: string;
  name: string;
  type: 'folder' | 'file';
  children?: TeamFolderItem[];
  content?: string;
  createdAt?: string;
  fileType?: FileType;
  linkedFileId?: string;
  phaseState?: WorkPhaseState;
}

export interface PromptItem {
  id: string;
  visibility: PromptVisibility;
  collection: string;
  code: string;
  title: string;
  description: string;
  tags: string[];
  promptText: string;
  usageCount: number;
  updatedAt: string;
}

export interface WorkspaceVersion {
  id: string;
  versionNumber: number;
  savedAt: string;
  label?: string;
  messageCount: number;
  locked: boolean;
  draft: string;
  snapshotContent: string;
}

export interface WorkspaceVersionReference {
  source: WorkspaceVersionSource;
  versionId: string;
  threadId: string;
  agent?: AgentRole;
  teamId?: string;
}

export interface AuditAnswerRoutingTarget {
  id: string;
  kind: AuditAnswerRoutingTargetKind;
  label: string;
  page: Page;
  sourceArea: 'main-workspace' | 'team-workspace' | 'cross-verification';
  teamId?: string;
  teamLabel?: string;
  workspace?: SecondaryWorkspaceTarget | null;
  agentRole?: AgentRole;
  workerId?: string;
}

export interface AuditAnswerPayload {
  sourcePage: Page;
  sourceWorkspace: SecondaryWorkspaceTarget | null;
  sourceArea: 'main-workspace' | 'team-workspace';
  sourceAgentId: string;
  sourceAgentLabel: string;
  sourceAgentType: AuditAnswerSourceAgentType;
  sourceTeamId: string;
  sourceTeamLabel: string;
  sourceReturnTarget: AuditAnswerRoutingTarget;
  sourceTeamManagerTarget?: AuditAnswerRoutingTarget | null;
  sourceSupervisorTarget?: AuditAnswerRoutingTarget | null;
  contentType: AuditAnswerContentType;
  selectedCount: number;
  messageIds: string[];
  content: string;
}

export interface AppState {
  currentPage: Page;
  projectName: string;
  userName: string;
  messages: Record<AgentRole, Message[]>;
  selectedMessages: Record<AgentRole, string[]>;
  drafts: Record<AgentRole, string>;
  documentLocks: Record<AgentRole, boolean>;
  workspaceVersions: Record<AgentRole, WorkspaceVersion[]>;
  projects: Project[];
  savedFiles: SavedFile[];
  calendarEvents: CalendarEvent[];
  workerRoles: {
    worker1: string;
    worker2: string;
  };
  workerConfigs: WorkerConfig[];
  workspaceFocusAgent: AgentRole | null;
  secondaryWorkspace: SecondaryWorkspaceTarget | null;
  auditAnswerPayload: AuditAnswerPayload | null;
  crossVerificationDraft: string;
  selectedWorkspaceVersion: WorkspaceVersionReference | null;
}
