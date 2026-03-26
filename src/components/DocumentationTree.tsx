import { useMemo, useRef, useState, type ReactNode } from 'react';
import { buildDocumentationMirrorTree, type DocumentationMirrorNode } from '../documentationModel';
import type { DocumentationModeModel, SavedFile } from '../types';

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      className={`h-3 w-3 transition-transform ${open ? 'rotate-90' : ''}`}
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M4 2.5L8 6L4 9.5" />
    </svg>
  );
}

function FolderIcon() {
  return (
    <svg className="h-3.5 w-3.5 text-amber-500" viewBox="0 0 16 16" fill="currentColor">
      <path d="M1.5 3.25h4l1 1.25h8v7.75H1.5z" />
      <path d="M1.5 4.5h13v-1H6.9L5.9 2.25H1.5z" className="opacity-70" />
    </svg>
  );
}

function FileIcon() {
  return (
    <svg className="h-3.5 w-3.5 text-neutral-500" viewBox="0 0 16 16" fill="currentColor">
      <path d="M3 1.5h6.5L13 5v9.5H3z" />
      <path d="M9.5 1.5V5H13" className="opacity-50" />
    </svg>
  );
}

function TreeFolder({
  label,
  depth,
  open,
  onToggle,
  children,
}: {
  label: string;
  depth: number;
  open: boolean;
  onToggle: () => void;
  children?: ReactNode;
}) {
  return (
    <div>
      <button
        className="flex w-full items-center gap-1.5 rounded-md px-1.5 py-1 text-left text-[11px] font-medium text-neutral-700 transition-colors hover:bg-neutral-50"
        onClick={onToggle}
        style={{ paddingLeft: `${depth * 14}px` }}
      >
        <Chevron open={open} />
        <FolderIcon />
        <span>{label}</span>
      </button>

      {open && children}
    </div>
  );
}

function FileBranch({
  file,
  extension,
  depth,
  onOpenFile,
}: {
  file: SavedFile;
  extension: string;
  depth: number;
  onOpenFile: (fileId: string) => void;
}) {
  return (
    <button
      className="flex w-full items-center gap-1.5 rounded-md px-1.5 py-1 text-left text-[11px] text-neutral-600 transition-colors hover:bg-neutral-50 hover:text-neutral-900"
      style={{ paddingLeft: `${depth * 14}px` }}
      onClick={() => onOpenFile(file.id)}
    >
      <span className="inline-block w-3" />
      <FileIcon />
      <span className="truncate">{file.title}.{extension}</span>
    </button>
  );
}

function TreeViewport({
  children,
  minHeightClass = 'min-h-[320px]',
}: {
  children: ReactNode;
  minHeightClass?: string;
}) {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const dragStateRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    scrollLeft: number;
    scrollTop: number;
  } | null>(null);
  const suppressClickUntilRef = useRef(0);
  const [zoom, setZoom] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const clampZoom = (nextZoom: number) => Math.min(2.2, Math.max(0.75, Number(nextZoom.toFixed(2))));

  return (
    <div
      ref={viewportRef}
      className={`ui-surface-subtle scrollbar-thin overflow-auto px-3 py-3 ${minHeightClass}`}
      style={{ cursor: isPanning ? 'grabbing' : 'grab' }}
      onClickCapture={(event) => {
        if (Date.now() < suppressClickUntilRef.current) {
          event.preventDefault();
          event.stopPropagation();
        }
      }}
      onWheel={(event) => {
        const viewport = viewportRef.current;
        if (!viewport) {
          return;
        }

        event.preventDefault();
        const rect = viewport.getBoundingClientRect();
        const pointerOffsetX = event.clientX - rect.left;
        const pointerOffsetY = event.clientY - rect.top;
        const localX = (viewport.scrollLeft + pointerOffsetX) / zoom;
        const localY = (viewport.scrollTop + pointerOffsetY) / zoom;
        const nextZoom = clampZoom(zoom + (event.deltaY < 0 ? 0.12 : -0.12));

        if (nextZoom === zoom) {
          return;
        }

        setZoom(nextZoom);

        window.requestAnimationFrame(() => {
          if (!viewportRef.current) {
            return;
          }

          viewportRef.current.scrollLeft = localX * nextZoom - pointerOffsetX;
          viewportRef.current.scrollTop = localY * nextZoom - pointerOffsetY;
        });
      }}
      onPointerDown={(event) => {
        if ((event.target as HTMLElement).closest('button, [data-docs-no-pan="true"]')) {
          return;
        }

        dragStateRef.current = {
          pointerId: event.pointerId,
          startX: event.clientX,
          startY: event.clientY,
          scrollLeft: event.currentTarget.scrollLeft,
          scrollTop: event.currentTarget.scrollTop,
        };
        setIsPanning(true);
        event.currentTarget.setPointerCapture(event.pointerId);
      }}
      onPointerMove={(event) => {
        const dragState = dragStateRef.current;
        if (!dragState || dragState.pointerId !== event.pointerId) {
          return;
        }

        const deltaX = event.clientX - dragState.startX;
        const deltaY = event.clientY - dragState.startY;
        if (!isPanning && Math.abs(deltaX) + Math.abs(deltaY) < 6) {
          return;
        }

        if (!isPanning) {
          setIsPanning(true);
        }

        event.currentTarget.scrollLeft = dragState.scrollLeft - deltaX;
        event.currentTarget.scrollTop = dragState.scrollTop - deltaY;
      }}
      onPointerUp={(event) => {
        if (dragStateRef.current?.pointerId !== event.pointerId) {
          return;
        }

        if (isPanning) {
          suppressClickUntilRef.current = Date.now() + 180;
        }
        dragStateRef.current = null;
        setIsPanning(false);
        event.currentTarget.releasePointerCapture(event.pointerId);
      }}
      onPointerCancel={(event) => {
        if (dragStateRef.current?.pointerId !== event.pointerId) {
          return;
        }

        dragStateRef.current = null;
        setIsPanning(false);
        event.currentTarget.releasePointerCapture(event.pointerId);
      }}
    >
      <div
        className="inline-block min-w-full origin-top-left"
        style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}
      >
        {children}
      </div>
    </div>
  );
}

export function DocumentationTree({
  projectName,
  groupedFiles,
  onOpenFile,
}: {
  projectName: string;
  groupedFiles: {
    conversations: SavedFile[];
    documents: SavedFile[];
    reports: SavedFile[];
  };
  onOpenFile: (fileId: string) => void;
}) {
  const [openState, setOpenState] = useState({
    cDrive: true,
    desktop: true,
    projects: true,
    project: true,
    conversations: true,
    documents: true,
    reports: true,
  });

  const toggle = (key: keyof typeof openState) =>
    setOpenState((current) => ({ ...current, [key]: !current[key] }));

  return (
    <TreeViewport>
      <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
        Local Documentation Tree
      </div>

      <div className="relative border-l border-neutral-200/80 pl-1">
        <TreeFolder
          label="C:"
          depth={0}
          open={openState.cDrive}
          onToggle={() => toggle('cDrive')}
        >
          <TreeFolder
            label="Escritorio"
            depth={1}
            open={openState.desktop}
            onToggle={() => toggle('desktop')}
          >
            <TreeFolder
              label="Proyectos"
              depth={2}
              open={openState.projects}
              onToggle={() => toggle('projects')}
            >
              <TreeFolder
                label={projectName}
                depth={3}
                open={openState.project}
                onToggle={() => toggle('project')}
              >
                <TreeFolder
                  label="Conversations"
                  depth={4}
                  open={openState.conversations}
                  onToggle={() => toggle('conversations')}
                >
                  <div className="grid gap-0.5">
                    {groupedFiles.conversations.length > 0 ? (
                      groupedFiles.conversations.map((file) => (
                        <FileBranch
                          key={file.id}
                          file={file}
                          extension="txt"
                          depth={5}
                          onOpenFile={onOpenFile}
                        />
                      ))
                    ) : (
                      <div
                        className="px-1.5 py-0.5 text-[11px] text-neutral-400"
                        style={{ paddingLeft: `${5 * 14}px` }}
                      >
                        No files yet.
                      </div>
                    )}
                  </div>
                </TreeFolder>

                <TreeFolder
                  label="Documents"
                  depth={4}
                  open={openState.documents}
                  onToggle={() => toggle('documents')}
                >
                  <div className="grid gap-0.5">
                    {groupedFiles.documents.length > 0 ? (
                      groupedFiles.documents.map((file) => (
                        <FileBranch
                          key={file.id}
                          file={file}
                          extension="docx"
                          depth={5}
                          onOpenFile={onOpenFile}
                        />
                      ))
                    ) : (
                      <div
                        className="px-1.5 py-0.5 text-[11px] text-neutral-400"
                        style={{ paddingLeft: `${5 * 14}px` }}
                      >
                        No files yet.
                      </div>
                    )}
                  </div>
                </TreeFolder>

                <TreeFolder
                  label="Reports"
                  depth={4}
                  open={openState.reports}
                  onToggle={() => toggle('reports')}
                >
                  <div className="grid gap-0.5">
                    {groupedFiles.reports.length > 0 ? (
                      groupedFiles.reports.map((file) => (
                        <FileBranch
                          key={file.id}
                          file={file}
                          extension="md"
                          depth={5}
                          onOpenFile={onOpenFile}
                        />
                      ))
                    ) : (
                      <div
                        className="px-1.5 py-0.5 text-[11px] text-neutral-400"
                        style={{ paddingLeft: `${5 * 14}px` }}
                      >
                        No files yet.
                      </div>
                    )}
                  </div>
                </TreeFolder>
              </TreeFolder>
            </TreeFolder>
          </TreeFolder>
        </TreeFolder>
      </div>
    </TreeViewport>
  );
}

function MirrorTreeNode({
  node,
  depth,
  openState,
  onToggle,
}: {
  node: DocumentationMirrorNode;
  depth: number;
  openState: Record<string, boolean>;
  onToggle: (nodeId: string) => void;
}) {
  const hasChildren = node.children.length > 0;
  const open = openState[node.id] ?? depth < 3;

  return (
    <div>
      <button
        className="flex w-full items-center gap-1.5 rounded-md px-1.5 py-1 text-left text-[11px] text-neutral-700 transition-colors hover:bg-neutral-50"
        onClick={() => hasChildren && onToggle(node.id)}
        style={{ paddingLeft: `${depth * 14}px` }}
      >
        {hasChildren ? <Chevron open={open} /> : <span className="inline-block w-3" />}
        <FolderIcon />
        <span className={node.kind === 'root' ? 'font-semibold text-neutral-900' : ''}>{node.label}</span>
        {node.roleLabel && (
          <span className="text-[10px] uppercase tracking-[0.14em] text-neutral-400">
            {node.roleLabel}
          </span>
        )}
      </button>

      {open &&
        hasChildren &&
        node.children.map((child) => (
          <MirrorTreeNode
            key={child.id}
            node={child}
            depth={depth + 1}
            openState={openState}
            onToggle={onToggle}
          />
        ))}
    </div>
  );
}

export function DocumentationMirrorTree({
  model,
}: {
  model: DocumentationModeModel;
}) {
  const tree = useMemo(() => buildDocumentationMirrorTree(model), [model]);
  const [openState, setOpenState] = useState<Record<string, boolean>>({});

  const toggle = (nodeId: string) =>
    setOpenState((current) => ({ ...current, [nodeId]: !(current[nodeId] ?? true) }));

  return (
    <div className="ui-surface h-full min-h-[500px] px-3 py-3">
      <div className="mb-2 flex items-center justify-between gap-3">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
            Documentation Mirror Tree
          </div>
          <div className="mt-1 text-[11px] text-neutral-500">
            Repository root chosen by user, mirrored from Teams hierarchy.
          </div>
        </div>
        <div className="text-right text-[10px] text-neutral-500">
          <div>{model.teamFolders.length} teams</div>
          <div>{model.agentUnits.length} agent units</div>
        </div>
      </div>

      <TreeViewport minHeightClass="min-h-[430px]">
        <div className="relative border-l border-neutral-200/80 pl-1">
          <MirrorTreeNode node={tree} depth={0} openState={openState} onToggle={toggle} />
        </div>
      </TreeViewport>
    </div>
  );
}
