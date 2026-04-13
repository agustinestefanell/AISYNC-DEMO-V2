import { useEffect, useMemo, useState } from 'react';
import { useApp } from '../context';
import { getInitialTeamsMapState, TEAMS_STORAGE_KEY, type TeamsMapState } from '../data/teams';
import { buildDocumentationModeModel } from '../documentationModel';
import type { DocumentationRepositoryItem, SavedFile, SavedObject, SourceDocumentReferenceObject } from '../types';

type DocumentPageModel = {
  item: DocumentationRepositoryItem;
  title: string;
  actionLabel: string;
  content: string | null;
  contentTypeLabel: string | null;
  mdFileName: string;
  metaFileName: string;
  metadata: Record<string, unknown>;
};

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'document';
}

function formatDate(value?: string | null) {
  if (!value) return 'n/a';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function buildReturnHref(itemId?: string | null) {
  const url = new URL(window.location.href);
  url.search = '';
  url.searchParams.set('page', 'B');
  url.searchParams.set('doc_view', 'repository');
  if (itemId) {
    url.searchParams.set('doc_item', itemId);
    url.searchParams.set('doc_focus', 'detail');
  }
  return url.toString();
}

function buildDocumentMetadata(item: DocumentationRepositoryItem, sourceFile: SavedFile | null, sourceObject: SavedObject | null) {
  const metadata: Record<string, unknown> = {
    repositoryItemId: item.id,
    title: item.title,
    itemType: item.itemType,
    objectType: item.objectType ?? null,
    documentKind: item.documentKind,
    documentState: item.documentState ?? item.status,
    documentVersion: item.documentVersion,
    sourceWorkspace: item.sourceWorkspace,
    sourcePanel: item.sourcePanelLabel ?? null,
    sourceConversation: item.sourceConversationLabel,
    team: item.teamLabel,
    project: item.projectLabel,
    owner: item.ownerLabel,
    user: item.userLabel,
    lastResponsible: item.lastResponsible,
    updatedAt: item.updatedAt,
    path: item.path,
    auditEventIds: item.auditEventIds,
    automaticTags: item.automaticTags ?? [],
    relatedFileId: item.relatedFileId ?? null,
    relatedObjectId: item.relatedObjectId ?? null,
  };

  if (sourceFile) {
    metadata.file = {
      id: sourceFile.id,
      type: sourceFile.type,
      agent: sourceFile.agent,
      createdAt: sourceFile.createdAt,
      sourceLabel: sourceFile.sourceLabel ?? null,
    };
  }

  if (sourceObject) {
    metadata.savedObject = {
      id: sourceObject.id,
      objectType: sourceObject.objectType,
      createdAt: sourceObject.createdAt,
      updatedAt: sourceObject.updatedAt,
      status: sourceObject.status,
      sourcePanelId: sourceObject.sourcePanelId,
      sourcePanelLabel: sourceObject.sourcePanelLabel,
      provenance: sourceObject.provenance,
    };
  }

  return metadata;
}

function buildHandoffContent(savedObject: SavedObject) {
  if (savedObject.objectType !== 'handoff-package') {
    return null;
  }

  return [
    `# ${savedObject.title}`,
    '',
    '## Objective',
    savedObject.payload.objective || 'No objective recorded.',
    '',
    '## Minimum Context',
    savedObject.payload.minimumContext || 'No minimum context recorded.',
    '',
    '## Expected Continuity',
    savedObject.payload.continuityExpected || 'No continuity recorded.',
    '',
    '## Transferred Content',
    savedObject.payload.transferredContent || 'No transferred content recorded.',
  ].join('\n');
}

function resolveSavedObjectDocument(
  savedObject: SavedObject,
  allFiles: SavedFile[],
  allObjects: SavedObject[],
  visited = new Set<string>(),
): { content: string | null; contentTypeLabel: string | null } {
  if (visited.has(savedObject.id)) {
    return { content: null, contentTypeLabel: null };
  }

  visited.add(savedObject.id);

  if (savedObject.objectType === 'derived-document') {
    return {
      content: savedObject.payload.content || null,
      contentTypeLabel: savedObject.payload.documentKind || 'Derived Document',
    };
  }

  if (savedObject.objectType === 'saved-selection') {
    return {
      content: savedObject.payload.content || null,
      contentTypeLabel: 'Saved Selection',
    };
  }

  if (savedObject.objectType === 'handoff-package') {
    return {
      content: buildHandoffContent(savedObject),
      contentTypeLabel: 'Handoff Package',
    };
  }

  if (savedObject.objectType === 'session-backup') {
    return {
      content: savedObject.payload.snapshotContent || savedObject.payload.draft || null,
      contentTypeLabel: 'Session Backup',
    };
  }

  if (savedObject.objectType === 'source-document-reference') {
    const linkedFile = savedObject.payload.linkedFileId
      ? allFiles.find((file) => file.id === savedObject.payload.linkedFileId) ?? null
      : null;
    if (linkedFile) {
      return {
        content: linkedFile.content,
        contentTypeLabel: 'Source Document Reference',
      };
    }

    const linkedObject =
      savedObject.payload.linkedSavedObjectId
        ? allObjects.find((candidate) => candidate.id === savedObject.payload.linkedSavedObjectId) ?? null
        : null;
    if (linkedObject) {
      return resolveSavedObjectDocument(linkedObject, allFiles, allObjects, visited);
    }

    return {
      content: savedObject.payload.referencePath || null,
      contentTypeLabel: 'Source Document Reference',
    };
  }

  if (savedObject.objectType === 'checkpoint') {
    return {
      content: savedObject.payload.snapshotContent || null,
      contentTypeLabel: 'Checkpoint',
    };
  }

  return { content: null, contentTypeLabel: null };
}

function resolveDocumentPageModel(
  item: DocumentationRepositoryItem,
  allFiles: SavedFile[],
  allObjects: SavedObject[],
): DocumentPageModel {
  const sourceFile = item.relatedFileId
    ? allFiles.find((file) => file.id === item.relatedFileId) ?? null
    : null;
  const sourceObject = item.relatedObjectId
    ? allObjects.find((savedObject) => savedObject.id === item.relatedObjectId) ?? null
    : null;

  let content = sourceFile?.content ?? null;
  let contentTypeLabel = item.documentKind ?? sourceFile?.type ?? null;
  let actionLabel = 'Open Document';

  if (!content && sourceObject) {
    const resolved = resolveSavedObjectDocument(sourceObject, allFiles, allObjects);
    content = resolved.content;
    contentTypeLabel = resolved.contentTypeLabel ?? contentTypeLabel;
  }

  if (item.objectType === 'saved-selection') {
    actionLabel = 'Open Selection';
  } else if (item.objectType === 'handoff-package') {
    actionLabel = 'Open Handoff';
  } else if (item.objectType === 'session-backup') {
    actionLabel = 'Open Backup';
  }

  const baseName = slugify(item.title);
  const metadata = buildDocumentMetadata(item, sourceFile, sourceObject);

  if (sourceObject?.objectType === 'source-document-reference') {
    metadata.reference = {
      referenceTitle: sourceObject.payload.referenceTitle,
      referencePath: sourceObject.payload.referencePath,
      linkedFileId: sourceObject.payload.linkedFileId,
      linkedSavedObjectId: sourceObject.payload.linkedSavedObjectId,
      recordClass: sourceObject.payload.recordClass,
    } satisfies SourceDocumentReferenceObject['payload'];
  }

  return {
    item,
    title: item.title,
    actionLabel,
    content,
    contentTypeLabel,
    mdFileName: `${baseName}.md`,
    metaFileName: `${baseName}.meta.json`,
    metadata,
  };
}

function MarkdownLikeContent({ content }: { content: string }) {
  const lines = content.split('\n');

  return (
    <div className="grid gap-3 text-[14px] leading-7 text-neutral-800">
      {lines.map((line, index) => {
        const trimmed = line.trim();
        if (!trimmed) {
          return <div key={`space-${index}`} className="h-2" />;
        }
        if (trimmed.startsWith('### ')) {
          return <h3 key={`h3-${index}`} className="text-lg font-semibold text-neutral-950">{trimmed.slice(4)}</h3>;
        }
        if (trimmed.startsWith('## ')) {
          return <h2 key={`h2-${index}`} className="text-xl font-semibold text-neutral-950">{trimmed.slice(3)}</h2>;
        }
        if (trimmed.startsWith('# ')) {
          return <h1 key={`h1-${index}`} className="text-2xl font-semibold text-neutral-950">{trimmed.slice(2)}</h1>;
        }
        if (trimmed.startsWith('- ')) {
          return (
            <div key={`li-${index}`} className="flex gap-3">
              <span className="pt-[9px] text-[10px] text-neutral-500">●</span>
              <div className="flex-1">{trimmed.slice(2)}</div>
            </div>
          );
        }
        return <p key={`p-${index}`}>{line}</p>;
      })}
    </div>
  );
}

export function DocumentPage() {
  const { state } = useApp();
  const [teamsMapState, setTeamsMapState] = useState<TeamsMapState>(getInitialTeamsMapState);

  useEffect(() => {
    const syncTeamsMapState = () => {
      setTeamsMapState(getInitialTeamsMapState());
    };
    const handleStorage = (event: StorageEvent) => {
      if (event.key === TEAMS_STORAGE_KEY) {
        syncTeamsMapState();
      }
    };

    syncTeamsMapState();
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const params = useMemo(() => new URLSearchParams(window.location.search), []);
  const itemId = params.get('doc_item');
  const documentationModel = useMemo(
    () =>
      buildDocumentationModeModel({
        root: state.documentationRoot,
        teamsGraph: teamsMapState.teamsGraph,
        savedObjects: state.savedObjects,
        activityEvents: state.activityEvents,
        savedFiles: state.savedFiles,
        calendarEvents: state.calendarEvents,
        mainWorkspace: {
          projectName: state.projectName,
          userName: state.userName,
          messages: state.messages,
          workspaceVersions: state.workspaceVersions,
          documentLocks: state.documentLocks,
        },
      }),
    [
      state.activityEvents,
      state.calendarEvents,
      state.documentLocks,
      state.documentationRoot,
      state.messages,
      state.projectName,
      state.savedFiles,
      state.savedObjects,
      state.userName,
      state.workspaceVersions,
      teamsMapState.teamsGraph,
    ],
  );

  const pageModel = useMemo(() => {
    if (!itemId) return null;
    const item = documentationModel.repositoryItems.find((candidate) => candidate.id === itemId) ?? null;
    if (!item) return null;
    return resolveDocumentPageModel(item, state.savedFiles, state.savedObjects);
  }, [documentationModel.repositoryItems, itemId, state.savedFiles, state.savedObjects]);

  return (
    <div className="flex h-full min-h-0 flex-col overflow-y-auto bg-neutral-100 text-neutral-900">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-5 py-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 pb-4">
          <div className="min-w-0">
            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
              Document Page
            </div>
            <div className="mt-1 text-2xl font-semibold tracking-[-0.02em] text-neutral-950">
              {pageModel?.title ?? 'Document not available'}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              className="ui-button ui-button-primary min-h-9 px-3 text-[12px] text-white"
              onClick={() => {
                window.close();
              }}
            >
              Close Document
            </button>
          </div>
        </div>

        {!pageModel ? (
          <div className="border border-neutral-200 bg-white px-5 py-6 text-sm text-neutral-700">
            The requested document was not found.
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.7fr)_minmax(280px,0.9fr)]">
            <section className="min-w-0">
              <div className="flex flex-wrap gap-2 border-b border-neutral-200 pb-4">
                <span className="rounded-full border border-neutral-300 px-2.5 py-1 text-[11px] font-semibold text-neutral-700">
                  {pageModel.contentTypeLabel ?? pageModel.item.documentKind ?? 'Document'}
                </span>
                {pageModel.item.documentState ? (
                  <span className="rounded-full border border-neutral-300 px-2.5 py-1 text-[11px] font-semibold text-neutral-700">
                    {pageModel.item.documentState}
                  </span>
                ) : null}
                {pageModel.item.documentVersion ? (
                  <span className="rounded-full border border-neutral-300 px-2.5 py-1 text-[11px] font-semibold text-neutral-700">
                    {pageModel.item.documentVersion}
                  </span>
                ) : null}
                <span className="rounded-full border border-neutral-300 px-2.5 py-1 text-[11px] font-semibold text-neutral-700">
                  {pageModel.actionLabel}
                </span>
              </div>

              <div className="mt-5 border-b border-neutral-200 pb-4">
                <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
                  `.md` File
                </div>
                <div className="mt-1 text-sm text-neutral-600">{pageModel.mdFileName}</div>
              </div>

              <div className="pt-5">
                {pageModel.content ? (
                  <MarkdownLikeContent content={pageModel.content} />
                ) : (
                  <div className="text-sm leading-6 text-neutral-600">
                    No readable documentary representation is available for this object.
                  </div>
                )}
              </div>
            </section>

            <aside className="min-w-0 border-l-0 border-neutral-200 lg:border-l lg:pl-8">
              <div className="grid gap-4">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
                    Useful Metadata
                  </div>
                  <div className="mt-3 grid gap-3 text-sm text-neutral-700">
                    <div>
                      <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-500">Type</div>
                      <div className="mt-1">{pageModel.contentTypeLabel ?? pageModel.item.documentKind ?? 'n/a'}</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-500">State</div>
                      <div className="mt-1">{pageModel.item.documentState ?? pageModel.item.status}</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-500">Version</div>
                      <div className="mt-1">{pageModel.item.documentVersion ?? 'n/a'}</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-500">Origin</div>
                      <div className="mt-1">{pageModel.item.sourceWorkspace}</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-500">Relevant Date</div>
                      <div className="mt-1">{formatDate(pageModel.item.updatedAt)}</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-500">Path</div>
                      <div className="mt-1 break-all">{pageModel.item.path}</div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-neutral-200 pt-4">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
                    `.meta.json` File
                  </div>
                  <div className="mt-1 text-sm text-neutral-600">{pageModel.metaFileName}</div>
                  <pre className="mt-3 overflow-x-auto bg-white p-4 text-[12px] leading-6 text-neutral-800">
                    {JSON.stringify(pageModel.metadata, null, 2)}
                  </pre>
                </div>
              </div>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}
