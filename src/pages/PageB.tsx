import { useEffect, useMemo, useState } from 'react';
import { AgentPanel } from '../components/AgentPanel';
import { DividerRail } from '../components/DividerRail';
import { DocumentationMirrorTree, DocumentationTree } from '../components/DocumentationTree';
import { FileViewer } from '../components/FileViewer';
import { Modal } from '../components/Modal';
import { Toast } from '../components/Toast';
import { useApp } from '../context';
import { buildDocumentationModeModel } from '../documentationModel';
import { getInitialTeamsMapState, TEAMS_STORAGE_KEY, type TeamsMapState } from '../data/teams';
import { getSecondarySubManagerLabel } from '../pageLabels';

const DOCUMENTATION_MODE_MANIFEST = [
  '# Manifiesto de Documentation Mode — AISync',
  '## Version 2',
  '',
  '## 1. Proposito',
  '',
  'Documentation Mode no es un simple explorador de carpetas.',
  'Es la capa documental estructural de AISync.',
  '',
  'Su funcion es transformar la actividad operativa de Teams, Sub-Managers y Workers en una estructura documental local, jerarquica, trazable y navegable, donde el usuario pueda comprender:',
  '',
  '- quien produjo cada documento,',
  '- desde que nivel jerarquico,',
  '- bajo que rol,',
  '- en que contexto operativo,',
  '- en que fase del trabajo,',
  '- y con que relacion respecto del resto del sistema.',
  '',
  'Documentation Mode debe actuar como memoria documental del proceso, no como almacenamiento indiferenciado.',
  '',
  '## 2. Principio rector',
  '',
  'La estructura documental debe reflejar la estructura real de Teams.',
  '',
  'Esto significa que el arbol de carpetas se organiza por:',
  '',
  '- jerarquia operativa,',
  '- proveniencia,',
  '- rol del agente,',
  '- continuidad del proceso,',
  '- y trazabilidad historica.',
  '',
  'La logica es coherente con el principio archivistico de proveniencia y con la preservacion del orden original, es decir, conservar el contexto de produccion y las relaciones reales entre documentos.',
  '',
  '## 3. Raiz del repositorio',
  '',
  'El usuario define manualmente la ubicacion raiz del repositorio documental.',
  '',
  'Ejemplo conceptual:',
  '',
  '/AISync_Repository/',
  '',
  'Esa raiz sera el punto de anclaje local a partir del cual Documentation Mode construira la estructura completa.',
  '',
  'AISync propone la estructura.',
  'El usuario define la ubicacion.',
  '',
  '## 4. Regla estructural general',
  '',
  'Debajo de la raiz, Documentation Mode debe reproducir fielmente la estructura de Teams.',
  '',
  'Cada Team tendra su propia carpeta.',
  'Dentro de cada Team existiran carpetas separadas por agente.',
  '',
  'La estructura debe reflejar:',
  '',
  '- General Manager,',
  '- Sub-Managers,',
  '- Workers,',
  '- sub-teams derivados por elasticidad organizacional,',
  '- y vinculos jerarquicos reales.',
  '',
  'No debe existir una organizacion plana que mezcle agentes de ramas distintas.',
  '',
  '## 5. Principio de proveniencia documental',
  '',
  'Cada agente debe tener su propia unidad documental.',
  '',
  'Eso implica:',
  '',
  '- una carpeta por Team,',
  '- una carpeta por Sub-Manager,',
  '- una carpeta por Worker,',
  '- y separacion documental por origen real.',
  '',
  'La carpeta no representa solo ubicacion fisica.',
  'Representa quien produjo que y desde donde.',
  '',
  '## 6. Principio de no reescritura historica',
  '',
  'Documentation Mode no debe reescribir retrospectivamente la historia operativa.',
  '',
  '### Regla obligatoria:',
  'Si un Worker es promovido a Sub-Manager:',
  '',
  '- no se renombra la carpeta historica del Worker',
  '- no se reutiliza esa carpeta como si siempre hubiese sido Sub-Manager',
  '- no se borra su etapa anterior',
  '',
  'En su lugar:',
  '',
  '- la carpeta historica del Worker se conserva,',
  '- y se crea una nueva carpeta para el nuevo rol de Sub-Manager.',
  '',
  'Motivo:',
  'el Worker cumplio funciones bajo un rol especifico; el nuevo Sub-Manager cumple funciones distintas y constituye una unidad operativa distinta.',
  '',
  'Renombrar la carpeta anterior destruiria trazabilidad.',
  '',
  '## 7. Regla de promocion de agentes',
  '',
  'Cuando ocurre elasticidad organizacional y un Worker es promovido:',
  '',
  '### Debe pasar esto:',
  '- la carpeta historica del Worker permanece intacta;',
  '- se crea una nueva carpeta para el nuevo Sub-Manager;',
  '- esa nueva carpeta pasa a ser cabeza de una nueva subestructura documental;',
  '- los nuevos Workers cuelgan de esa nueva unidad.',
  '',
  '### No debe pasar esto:',
  '- no se renombra la carpeta vieja;',
  '- no se fusionan roles distintos en una sola carpeta;',
  '- no se simula retrospectivamente que siempre tuvo el rol nuevo;',
  '- no se pierde continuidad historica.',
  '',
  '## 8. Identidad documental',
  '',
  'Cada unidad documental debe distinguir entre:',
  '',
  '- identidad estable',
  '- nombre visible',
  '- rol operativo',
  '- posicion jerarquica',
  '- estado temporal',
  '',
  'El nombre visible puede cambiar.',
  'La identidad documental no debe depender exclusivamente de ese nombre.',
  '',
  'Por eso, Documentation Mode debe usar una logica dual:',
  '',
  '- ID persistente',
  '- label visible editable',
  '',
  '## 9. Regla sobre renombres',
  '',
  'El renombre visible de un Team o un agente no debe destruir la trazabilidad historica.',
  '',
  'Por eso:',
  '',
  '- el sistema debe preservar continuidad aunque cambie el label,',
  '- y la estructura fisica no debe depender unicamente del nombre visible actual.',
  '',
  'La ruta fisica debe ser suficientemente estable como para no romper referencias, historial, indices o auditoria cuando cambian los nombres.',
  '',
  '## 10. Estructura minima por agente',
  '',
  'Dentro de la carpeta de cada agente, la documentacion debe organizarse por funcion operativa.',
  '',
  'La estructura minima recomendada es:',
  '',
  '- inbox / input',
  '- working',
  '- review & forward',
  '- output',
  '- archive',
  '',
  'El principio es claro:',
  '',
  'la carpeta del agente no es un cajon generico;',
  'debe reflejar el flujo real de trabajo del agente.',
  '',
  '## 11. La estructura fisica no alcanza',
  '',
  'Documentation Mode no debe depender solo del arbol de carpetas.',
  '',
  'La estructura fisica sirve para:',
  '',
  '- proveniencia,',
  '- jerarquia,',
  '- legibilidad,',
  '- y orden operativo.',
  '',
  'Pero la recuperacion rapida, el enlace con auditoria y la compatibilidad futura con compliance requieren ademas:',
  '',
  '- manifiestos',
  '- indice transversal',
  '- metadatos estructurados',
  '',
  'La carpeta da contexto.',
  'El indice y los metadatos dan velocidad, trazabilidad y recuperabilidad operativa.',
  '',
  '## 12. Manifiestos',
  '',
  'Cada Team y cada agente deben poder tener un manifiesto propio.',
  '',
  'Su funcion es registrar, como minimo:',
  '',
  '- team_id',
  '- team_label',
  '- agent_id',
  '- agent_label',
  '- agent_role',
  '- parent_team_id',
  '- parent_agent_id',
  '- created_at',
  '- updated_at',
  '- origin_workspace',
  '- status',
  '- record_class',
  '- sensitivity_level',
  '- retention_rule',
  '- official_copy',
  '- path',
  '- checksum',
  '- related_audit_events',
  '',
  'La carpeta es la estructura visible.',
  'El manifiesto es la estructura intelectual.',
  '',
  '## 13. Indice transversal',
  '',
  'Ademas del arbol y de los manifiestos individuales, Documentation Mode debe prever un indice transversal.',
  '',
  'Ese indice permitira busquedas rapidas por:',
  '',
  '- Team,',
  '- agente,',
  '- Sub-Manager,',
  '- Worker,',
  '- fecha,',
  '- evento,',
  '- tipo documental,',
  '- estado,',
  '- Review & Forward,',
  '- origen,',
  '- destino,',
  '- y relacion con Audit Log.',
  '',
  'Este indice es la pieza que hace posible que Documentation Mode sea compatible con:',
  '',
  '- Audit Log',
  '- Calendar Mode',
  '- busquedas rapidas',
  '- filtros por eventos o responsables',
  '',
  'Sin indice, el arbol es legible.',
  'Con indice, el sistema es operativamente explotable.',
  '',
  '## 14. Compatibilidad con Audit Log',
  '',
  'Documentation Mode debe ser compatible con Audit Log desde su diseno base.',
  '',
  'Eso significa que la documentacion debe poder vincularse con:',
  '',
  '- eventos de creacion,',
  '- eventos de edicion,',
  '- Review & Forward,',
  '- versiones,',
  '- outputs aprobados,',
  '- responsables,',
  '- y fechas relevantes.',
  '',
  'Audit Log debe poder consultar Documentation Mode no solo por ruta fisica, sino tambien por:',
  '',
  '- metadatos,',
  '- manifests,',
  '- indice transversal,',
  '- y vinculo entre evento y documento.',
  '',
  '## 15. Compatibilidad con Calendar Mode',
  '',
  'Documentation Mode debe prever compatibilidad futura con Calendar Mode.',
  '',
  'Eso requiere que los documentos y eventos puedan asociarse temporalmente a:',
  '',
  '- fecha de creacion,',
  '- fecha de revision,',
  '- fecha de forward,',
  '- fecha de aprobacion,',
  '- fecha de archivo,',
  '- hitos relevantes del proceso.',
  '',
  'De esta manera, Calendar Mode podra consultar y mostrar actividad documental por linea de tiempo, sin depender del nombre de archivo o de inspeccion manual del arbol.',
  '',
  '## 16. Separacion entre trabajo y archivo',
  '',
  'Documentation Mode debe distinguir claramente entre:',
  '',
  '- documentacion activa,',
  '- documentacion en revision,',
  '- documentacion final,',
  '- documentacion archivada.',
  '',
  'No todo debe convivir en el mismo nivel.',
  '',
  'Un sistema serio necesita distinguir entre:',
  '- lo que se esta produciendo,',
  '- lo que esta siendo revisado,',
  '- lo que fue enviado,',
  '- lo que fue aprobado,',
  '- y lo que queda como evidencia historica.',
  '',
  '## 17. Compatibilidad con data compliance',
  '',
  'Documentation Mode debe nacer preparado para compatibilidad futura con compliance documental y regulatorio.',
  '',
  'Eso implica prever desde ahora:',
  '',
  '- clasificacion documental,',
  '- regla de retencion,',
  '- copia oficial / record copy,',
  '- estados del documento,',
  '- legal hold,',
  '- politica de archivo,',
  '- y trazabilidad de cambios.',
  '',
  'Esto no significa que toda esa logica deba implementarse ya.',
  'Significa que la estructura debe dejar espacio para integrarla sin redisenar todo desde cero.',
  '',
  '## 18. Compatibilidad con data safety',
  '',
  'Documentation Mode tambien debe nacer preparado para compatibilidad futura con data safety.',
  '',
  'Eso exige dejar previstas capas para:',
  '',
  '- control de acceso por rol,',
  '- sensibilidad documental,',
  '- integridad del archivo,',
  '- checksum / fixity,',
  '- cifrado si corresponde,',
  '- y proteccion frente a alteracion o perdida.',
  '',
  '## 19. Regla de no mezcla entre copy oficial y working copy',
  '',
  'Documentation Mode debe distinguir entre:',
  '',
  '- working copy,',
  '- reviewed copy,',
  '- official copy,',
  '- archived record.',
  '',
  'Esto es importante para:',
  '- trazabilidad,',
  '- cumplimiento,',
  '- auditoria,',
  '- y seguridad juridica del sistema.',
  '',
  'Un archivo no debe quedar ambiguamente entre borrador, version aprobada y registro historico.',
  '',
  '## 20. Regla de legibilidad humana',
  '',
  'Aunque la estructura sea rigurosa, debe seguir siendo comprensible para el usuario.',
  '',
  'Eso exige:',
  '',
  '- nombres legibles,',
  '- jerarquias claras,',
  '- consistencia visual,',
  '- relacion evidente con Teams Map.',
  '',
  'El usuario debe poder mirar Documentation Mode y entender que esta viendo la traduccion documental del sistema operativo de AISync.',
  '',
  '## 21. Regla de coherencia con Teams Map',
  '',
  'Documentation Mode debe ser el espejo documental de Teams Map.',
  '',
  'Si Teams Map muestra:',
  '',
  '- un Team,',
  '- un Sub-Manager,',
  '- dos Workers,',
  '- y una rama promovida,',
  '',
  'Documentation Mode debe reflejar exactamente esa logica en carpetas y manifiestos.',
  '',
  'No deben existir dos realidades paralelas:',
  '- una operativa,',
  '- otra documental.',
  '',
  '## 22. Regla de estabilidad',
  '',
  'La estructura documental no debe cambiar caprichosamente frente a cambios menores de UI.',
  '',
  'Debe priorizarse:',
  '',
  '- estabilidad,',
  '- persistencia,',
  '- continuidad,',
  '- trazabilidad historica.',
  '',
  'Documentation Mode no es un efecto visual; es una capa estructural del sistema.',
  '',
  '## 23. Regla de expansion futura',
  '',
  'La estructura debe poder crecer para incorporar mas adelante:',
  '',
  '- manifests enlazados,',
  '- versiones,',
  '- hashes,',
  '- locks documentales,',
  '- estados de aprobacion,',
  '- legal hold,',
  '- busqueda por metadata,',
  '- vinculo fuerte con Audit Log,',
  '- y visualizacion cronologica en Calendar Mode.',
  '',
  'La base debe estar preparada desde el diseno, aunque esas funciones se implementen despues.',
  '',
  '## 24. Definicion final',
  '',
  'Documentation Mode en AISync sera un sistema documental local, jerarquico, trazable y compatible con gobernanza futura, construido a partir de la estructura real de Teams, donde:',
  '',
  '- cada Team tendra su unidad documental,',
  '- cada agente tendra su unidad documental propia,',
  '- los cambios de rol no reescribiran la historia,',
  '- el arbol fisico preservara proveniencia,',
  '- y los manifests + indices permitiran recuperacion rapida, auditoria, compliance y expansion futura hacia data safety.',
  '',
  '## 25. Regla operativa resumida',
  '',
  'En una linea:',
  '',
  'cada carpeta y cada manifiesto deben decir quien produjo que, desde donde, bajo que rol, en que momento, con que estado y con que relacion con el resto del sistema, sin destruir la historia cuando la estructura evoluciona.',
].join('\n');

function ProjectCard({
  projectId,
  projectName,
  onOpenFile,
  onToast,
}: {
  projectId: string;
  projectName: string;
  onOpenFile: (fileId: string) => void;
  onToast: (message: string) => void;
}) {
  const { state } = useApp();
  const files = state.savedFiles.filter((file) => file.projectId === projectId);

  const grouped = useMemo(
    () => ({
      conversations: files.filter((file) => file.type === 'Conversation'),
      documents: files.filter((file) => file.type === 'Document'),
      reports: files.filter((file) => file.type === 'Report'),
    }),
    [files],
  );

  return (
    <div className="min-h-0" data-docs-project-card={projectId}>
      <div className="mb-2 flex items-center gap-3">
        <h3 className="text-sm text-neutral-800">{projectName}</h3>
        <div className="h-px flex-1 bg-neutral-300" />
      </div>

      <div className="ui-surface h-full min-h-[320px] px-3 py-3">
        <DocumentationTree
          projectName={projectName}
          groupedFiles={grouped}
          onOpenFile={onOpenFile}
        />

        <div className="mt-4 flex flex-wrap gap-3 border-t border-neutral-200 pt-3 text-[11px]">
          <button
            className="text-neutral-700 underline-offset-2 transition-colors hover:text-neutral-950 hover:underline"
            onClick={() => onToast('Folder creation is a placeholder in this demo.')}
          >
            [+ New Folder]
          </button>
          <button
            className="text-neutral-700 underline-offset-2 transition-colors hover:text-neutral-950 hover:underline"
            onClick={() => onToast('Open in Finder/Explorer is not available in the web demo.')}
          >
            [Open in Finder/Explorer]
          </button>
        </div>
      </div>
    </div>
  );
}

export function PageB() {
  const { state, dispatch } = useApp();
  const subManagerLabel = getSecondarySubManagerLabel('B');
  const [showManagerMobile, setShowManagerMobile] = useState(false);
  const [showManifestView, setShowManifestView] = useState(false);
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [openFileId, setOpenFileId] = useState<string | null>(null);
  const [toast, setToast] = useState('');
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

    return () => {
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const openFile = state.savedFiles.find((file) => file.id === openFileId) ?? null;
  const openProject =
    state.projects.find((project) => project.id === openFile?.projectId) ?? null;
  const documentationModel = useMemo(
    () =>
      buildDocumentationModeModel({
        root: state.documentationRoot,
        teamsGraph: teamsMapState.teamsGraph,
        savedFiles: state.savedFiles,
        calendarEvents: state.calendarEvents,
      }),
    [state.calendarEvents, state.documentationRoot, state.savedFiles, teamsMapState.teamsGraph],
  );

  const handleCreateProject = () => {
    if (!newProjectName.trim()) {
      return;
    }

    dispatch({
      type: 'ADD_PROJECT',
      project: {
        id: `proj_${Date.now()}`,
        name: newProjectName.trim(),
      },
    });
    setNewProjectName('');
    setShowNewProjectModal(false);
    setToast('Project created.');
  };

  const documentationContent = (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-[var(--color-surface-soft)]">
      <div className="px-2 pb-2 pt-2 sm:px-3 sm:pt-3">
        <div className="ui-surface relative py-3 text-center sm:py-2">
          <span className="px-24 text-sm font-semibold tracking-[0.14em] text-neutral-900 sm:px-0">
            DOCUMENTATION MODE
          </span>
          <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-3 sm:right-3">
            <button
              className="text-[11px] font-normal text-neutral-500 underline-offset-2 transition-colors hover:text-neutral-900 hover:underline"
              onClick={() => setShowManifestView(true)}
            >
              (Manif.)
            </button>
            <button
              className="ui-button ui-button-primary min-h-9 px-2.5 text-[11px] text-white sm:min-h-8"
              onClick={() => setShowNewProjectModal(true)}
            >
              + new project
            </button>
          </div>
        </div>
      </div>

      <div className="scrollbar-thin flex-1 overflow-y-auto px-2 pb-3 sm:px-3 sm:pb-4" style={{ minHeight: 0 }}>
        <div className="grid gap-4 sm:gap-6">
          <DocumentationMirrorTree model={documentationModel} />

          <div className="grid gap-4 sm:gap-6 xl:grid-cols-2 xl:gap-8">
            {state.projects.map((project) => (
              <ProjectCard
                key={project.id}
                projectId={project.id}
                projectName={project.name}
                onOpenFile={setOpenFileId}
                onToast={setToast}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="app-page-shell h-full min-h-0 min-w-0 overflow-hidden px-2 py-2 sm:px-3 sm:py-3">
      <div className="mx-auto flex h-full min-h-0 w-full max-w-[1600px] flex-col gap-2">
        <div className="ui-surface app-short-landscape-flex flex items-center justify-between gap-3 px-3 py-2 sm:hidden">
          <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
            Sub-Manager Panel
          </div>
          <button
            data-docs-manager-toggle
            className="ui-button min-h-9 px-3 text-xs text-neutral-700"
            onClick={() => setShowManagerMobile((value) => !value)}
          >
            {showManagerMobile ? 'Hide Sub-Manager' : 'Show Sub-Manager'}
          </button>
        </div>

        {showManagerMobile && (
          <div className="app-frame app-short-landscape-flex flex h-[46dvh] min-h-0 overflow-hidden sm:hidden">
            <AgentPanel agent="manager" managerDisplayName={subManagerLabel} />
          </div>
        )}

        <div className="app-frame app-short-landscape-flex flex min-h-0 flex-1 overflow-hidden sm:hidden">
          {documentationContent}
        </div>

        <div className="app-frame app-short-landscape-hide hidden min-h-0 flex-1 overflow-hidden sm:flex">
          <AgentPanel
            agent="manager"
            managerDisplayName={subManagerLabel}
            className="w-[280px] shrink-0 md:w-[320px] lg:w-[432px]"
          />
          <DividerRail />
          {documentationContent}
        </div>
      </div>

      {openFile && openProject && (
        <FileViewer
          file={openFile}
          projectName={openProject.name}
          onClose={() => setOpenFileId(null)}
        />
      )}

      {showNewProjectModal && (
        <Modal title="New project" onClose={() => setShowNewProjectModal(false)}>
          <div className="grid gap-3">
            <label className="grid gap-1">
              <span className="ui-label">Project name</span>
              <input
                className="ui-input text-xs"
                value={newProjectName}
                onChange={(event) => setNewProjectName(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    handleCreateProject();
                  }
                }}
                autoFocus
              />
            </label>

            <div className="flex justify-end gap-2">
              <button
                className="ui-button text-neutral-700"
                onClick={() => setShowNewProjectModal(false)}
              >
                Cancel
              </button>
              <button
                className="ui-button ui-button-primary text-white"
                onClick={handleCreateProject}
              >
                Create
              </button>
            </div>
          </div>
        </Modal>
      )}

      {showManifestView && (
        <Modal title="Documentation Mode Manifest" onClose={() => setShowManifestView(false)}>
          <div className="max-h-[72vh] overflow-y-auto pr-1">
            <div className="mb-3 text-[11px] uppercase tracking-[0.16em] text-neutral-500">
              Temporary internal reference
            </div>
            <pre className="whitespace-pre-wrap text-sm leading-6 text-neutral-800">
              {DOCUMENTATION_MODE_MANIFEST}
            </pre>
          </div>
        </Modal>
      )}

      {toast && <Toast message={toast} onClose={() => setToast('')} />}
    </div>
  );
}
