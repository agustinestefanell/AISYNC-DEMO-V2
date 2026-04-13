import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent, type WheelEvent as ReactWheelEvent } from 'react';
import { AgentPanel } from '../components/AgentPanel';
import { CollapsibleManagerSidebar } from '../components/CollapsibleManagerSidebar';
import { DocumentationMirrorTree, DocumentationTree } from '../components/DocumentationTree';
import { Modal } from '../components/Modal';
import { Toast } from '../components/Toast';
import { useApp } from '../context';
import { buildDocumentationModeModel } from '../documentationModel';
import { getInitialTeamsMapState, TEAMS_STORAGE_KEY, type TeamsMapState } from '../data/teams';
import {
  getDocumentationViewDescription,
  getDocumentationViewLabel,
  getSecondarySubManagerLabel,
} from '../pageLabels';
import type {
  DocumentationAuditEntry,
  DocumentationDocumentState,
  DocumentationKnowledgeEdge,
  DocumentationKnowledgeNode,
  DocumentationRepositoryItem,
  DocumentationViewMode,
  SavedObject,
  WorkspaceVersionReference,
} from '../types';

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

const DOCUMENTATION_MODE_MANIFEST_EN = [
  '# Documentation Mode Manifest - AISync',
  '## Version 2',
  '',
  '## 1. Purpose',
  '',
  'Documentation Mode is not a simple folder explorer.',
  'It is AISync\'s structural documentary layer.',
  '',
  'Its function is to transform the operational activity of Teams, Sub-Managers, and Workers into a local, hierarchical, traceable, and navigable documentary structure in which the user can understand:',
  '',
  '- who produced each document,',
  '- from which hierarchical level,',
  '- under which role,',
  '- in which operational context,',
  '- in which phase of the work,',
  '- and with what relationship to the rest of the system.',
  '',
  'Documentation Mode must act as the documentary memory of the process, not as undifferentiated storage.',
  '',
  '## 2. Guiding principle',
  '',
  'The documentary structure must reflect the real structure of Teams.',
  '',
  'This means the folder tree is organized by operational hierarchy, provenance, agent role, process continuity, and historical traceability.',
  '',
  'This logic is consistent with the archival principle of provenance and the preservation of original order, that is, preserving the production context and the real relationships between documents.',
  '',
  '## 3. Repository root',
  '',
  'The user manually defines the root location of the documentary repository.',
  '',
  'Conceptual example:',
  '',
  '/AISync_Repository/',
  '',
  'That root becomes the local anchor point from which Documentation Mode builds the full structure.',
  '',
  'AISync proposes the structure. The user defines the location.',
  '',
  '## 4. General structural rule',
  '',
  'Below the root, Documentation Mode must faithfully reproduce the structure of Teams.',
  '',
  'Each Team will have its own folder. Within each Team there will be separate folders by agent.',
  '',
  'The structure must reflect the General Manager, Sub-Managers, Workers, sub-teams derived from organizational elasticity, and real hierarchical links.',
  '',
  'There must not be a flat organization that mixes agents from different branches.',
  '',
  '## 5. Documentary provenance principle',
  '',
  'Each agent must have its own documentary unit.',
  '',
  'This implies one folder per Team, one folder per Sub-Manager, one folder per Worker, and documentary separation by real origin.',
  '',
  'A folder does not represent only physical location. It represents who produced what and from where.',
  '',
  '## 6. Historical non-rewriting principle',
  '',
  'Documentation Mode must not retrospectively rewrite operational history.',
  '',
  'Mandatory rule: if a Worker is promoted to Sub-Manager, the historical Worker folder is not renamed, not reused as if it had always been a Sub-Manager folder, and the previous stage is not erased.',
  '',
  'Instead, the Worker\'s historical folder is preserved and a new folder is created for the new Sub-Manager role.',
  '',
  'Renaming the previous folder would destroy traceability.',
  '',
  '## 7. Agent promotion rule',
  '',
  'When organizational elasticity occurs and a Worker is promoted, the historical folder remains intact, a new folder is created for the new Sub-Manager, that folder becomes the head of a new documentary substructure, and the new Workers hang from that new unit.',
  '',
  'Different roles must not be merged into a single folder and the system must not retrospectively simulate that the agent always had the new role.',
  '',
  '## 8. Documentary identity',
  '',
  'Each documentary unit must distinguish between stable identity, visible name, operational role, hierarchical position, and temporal state.',
  '',
  'The visible name may change. Documentary identity must not depend exclusively on that name.',
  '',
  'For that reason, Documentation Mode must use a dual logic: persistent ID plus editable visible label.',
  '',
  '## 9. Renaming rule',
  '',
  'The visible renaming of a Team or an agent must not destroy historical traceability.',
  '',
  'The system must preserve continuity even if the label changes, and the physical structure must not depend solely on the current visible name.',
  '',
  'The physical path must be stable enough not to break references, history, indexes, or auditing when names change.',
  '',
  '## 10. Minimum per-agent structure',
  '',
  'Within each agent folder, documentation must be organized by operational function.',
  '',
  'The recommended minimum structure is:',
  '',
  '- inbox / input',
  '- working',
  '- review & forward',
  '- output',
  '- archive',
  '',
  'The agent folder is not a generic drawer; it must reflect the agent\'s real workflow.',
  '',
  '## 11. Physical structure is not enough',
  '',
  'Documentation Mode must not depend only on the folder tree.',
  '',
  'Physical structure provides provenance, hierarchy, legibility, and operational order. Fast retrieval, audit linkage, and future compliance compatibility also require manifests, a cross-index, and structured metadata.',
  '',
  'The folder provides context. The index and metadata provide speed, traceability, and operational recoverability.',
  '',
  '## 12. Manifests',
  '',
  'Each Team and each agent must be able to have its own manifest.',
  '',
  'Its function is to record, at minimum: team_id, team_label, agent_id, agent_label, agent_role, parent_team_id, parent_agent_id, created_at, updated_at, origin_workspace, status, record_class, sensitivity_level, retention_rule, official_copy, path, checksum, and related_audit_events.',
  '',
  'The folder is the visible structure. The manifest is the intellectual structure.',
  '',
  '## 13. Cross-index',
  '',
  'In addition to the tree and individual manifests, Documentation Mode must provide for a cross-index.',
  '',
  'That index enables fast searches by Team, agent, Sub-Manager, Worker, date, event, documentary type, state, Review & Forward, origin, destination, and relationship with Audit Log.',
  '',
  'This index is what makes Documentation Mode compatible with Audit Log, Calendar Mode, fast search, and filters by events or responsible actors.',
  '',
  'Without an index, the tree is readable. With an index, the system is operationally usable.',
  '',
  '## 14. Compatibility with Audit Log',
  '',
  'Documentation Mode must be compatible with Audit Log from its base design.',
  '',
  'This means documentation must be able to link to creation events, editing events, Review & Forward, versions, approved outputs, responsible actors, and relevant dates.',
  '',
  'Audit Log must be able to query Documentation Mode not only by physical path, but also by metadata, manifests, the cross-index, and the link between event and document.',
  '',
  '## 15. Compatibility with Calendar Mode',
  '',
  'Documentation Mode must anticipate future compatibility with Calendar Mode.',
  '',
  'That requires documents and events to be temporally associated with creation date, review date, forward date, approval date, archive date, and relevant process milestones.',
  '',
  'In this way, Calendar Mode will be able to query and display documentary activity on a timeline without depending on file names or manual tree inspection.',
  '',
  '## 16. Separation between work and archive',
  '',
  'Documentation Mode must clearly distinguish between active documentation, documentation under review, final documentation, and archived documentation.',
  '',
  'A serious system must distinguish between what is being produced, what is being reviewed, what was forwarded, what was approved, and what remains as historical evidence.',
  '',
  '## 17. Compatibility with data compliance',
  '',
  'Documentation Mode must be born prepared for future compatibility with documentary and regulatory compliance.',
  '',
  'That implies anticipating documentary classification, retention rules, official copy / record copy, document states, legal hold, archive policy, and change traceability.',
  '',
  'This does not mean all that logic must be implemented now. It means the structure must leave room to integrate it without redesigning everything from scratch.',
  '',
  '## 18. Compatibility with data safety',
  '',
  'Documentation Mode must also be born prepared for future compatibility with data safety.',
  '',
  'That requires role-based access control, documentary sensitivity, file integrity, checksum / fixity, encryption when applicable, and protection against alteration or loss.',
  '',
  '## 19. Non-mixing rule between official copy and working copy',
  '',
  'Documentation Mode must distinguish between working copy, reviewed copy, official copy, and archived record.',
  '',
  'This is important for traceability, compliance, auditing, and the legal robustness of the system.',
  '',
  'A file must not remain ambiguously positioned between draft, approved version, and historical record.',
  '',
  '## 20. Human legibility rule',
  '',
  'Even if the structure is rigorous, it must remain understandable for the user.',
  '',
  'This requires readable names, clear hierarchies, visual consistency, and an evident relationship with Teams Map.',
  '',
  'The user must be able to look at Documentation Mode and understand that they are seeing the documentary translation of AISync\'s operating system.',
  '',
  '## 21. Coherence rule with Teams Map',
  '',
  'Documentation Mode must be the documentary mirror of Teams Map.',
  '',
  'If Teams Map shows a Team, a Sub-Manager, two Workers, and a promoted branch, Documentation Mode must reflect exactly that logic in folders and manifests.',
  '',
  'There must not be two parallel realities: one operational and another documentary.',
  '',
  '## 22. Stability rule',
  '',
  'The documentary structure must not change capriciously in response to minor UI changes.',
  '',
  'Priority must be given to stability, persistence, continuity, and historical traceability.',
  '',
  'Documentation Mode is not a visual effect; it is a structural layer of the system.',
  '',
  '## 23. Future expansion rule',
  '',
  'The structure must be able to grow later to incorporate linked manifests, versions, hashes, document locks, approval states, legal hold, metadata search, strong linkage with Audit Log, and chronological visualization in Calendar Mode.',
  '',
  'The foundation must be prepared from the design stage, even if those functions are implemented later.',
  '',
  '## 24. Final definition',
  '',
  'Documentation Mode in AISync will be a local, hierarchical, traceable documentary system compatible with future governance, built from the real structure of Teams.',
  '',
  'Each Team will have its documentary unit, each agent will have its own documentary unit, role changes will not rewrite history, the physical tree will preserve provenance, and manifests plus indexes will enable fast retrieval, auditing, compliance, and future expansion toward data safety.',
  '',
  '## 25. Summarized operational rule',
  '',
  'In one line:',
  '',
  'Each folder and each manifest must say who produced what, from where, under which role, at what moment, with what state, and with what relationship to the rest of the system, without destroying history when the structure evolves.',
].join('\n');

function isRepositoryDocumentItem(item: DocumentationRepositoryItem) {
  return item.itemType === 'file' || item.itemType === 'saved-object';
}

function getRepositoryItemTypeLabel(item: DocumentationRepositoryItem) {
  if (item.objectType === 'checkpoint') return 'Checkpoint';
  if (item.objectType === 'saved-selection') return 'Saved Selection';
  if (item.objectType === 'handoff-package') return 'Handoff Package';
  if (item.objectType === 'source-document-reference') return 'Source Reference';
  if (item.objectType === 'derived-document') return 'Derived Document';
  if (item.itemType === 'file') return 'File';
  if (item.itemType === 'saved-object') return 'Saved Object';
  if (item.itemType === 'agent-unit') return 'Agent Unit';
  if (item.itemType === 'workspace-agent') return 'Workspace Agent';
  return 'Team Folder';
}

function getRepositoryStatusLabel(item: DocumentationRepositoryItem) {
  if (item.documentState) return item.documentState;
  if (item.status === 'active') return 'Active';
  if (item.status === 'archived') return 'Archived';
  return item.status;
}

function getDocumentStateClasses(state: DocumentationDocumentState) {
  if (state === 'Active') return 'border-cyan-200 bg-cyan-50 text-cyan-700';
  if (state === 'Draft') return 'border-neutral-200 bg-neutral-100 text-neutral-700';
  if (state === 'In Progress') return 'border-sky-200 bg-sky-50 text-sky-700';
  if (state === 'Under Review') return 'border-amber-200 bg-amber-50 text-amber-700';
  if (state === 'Approved') return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  if (state === 'Archived') return 'border-stone-200 bg-stone-100 text-stone-700';
  return 'border-neutral-300 bg-neutral-900 text-white';
}

function getAuditEventClasses(kind: DocumentationAuditEntry['eventKind']) {
  if (kind === 'created') return 'border-neutral-200 bg-neutral-100 text-neutral-700';
  if (kind === 'updated') return 'border-sky-200 bg-sky-50 text-sky-700';
  if (kind === 'state-changed') return 'border-amber-200 bg-amber-50 text-amber-700';
  if (kind === 'version-advanced') return 'border-violet-200 bg-violet-50 text-violet-700';
  if (kind === 'locked') return 'border-neutral-300 bg-neutral-900 text-white';
  return 'border-emerald-200 bg-emerald-50 text-emerald-700';
}

function getCheckpointVersionReference(savedObject: SavedObject | null): WorkspaceVersionReference | null {
  if (!savedObject || savedObject.objectType !== 'checkpoint') {
    return null;
  }

  const threadId = savedObject.payload.threadId;
  const isBaseMainThread =
    threadId === 'manager' || threadId === 'worker1' || threadId === 'worker2';
  const isTeamWorkspace = savedObject.sourceWorkspace === 'team-workspace';

  return {
    source: isTeamWorkspace ? 'team' : 'main',
    versionId: savedObject.payload.legacyVersionId,
    threadId,
    agent: !isTeamWorkspace && isBaseMainThread ? threadId : 'manager',
    teamId: isTeamWorkspace ? savedObject.sourceTeamId ?? undefined : undefined,
    panelScope: !isTeamWorkspace && !isBaseMainThread ? threadId : undefined,
  };
}

const KNOWLEDGE_FOCUS_MODE_OPTIONS: Array<{ value: KnowledgeFocusMode; label: string }> = [
  { value: 'documents', label: 'Documents' },
  { value: 'users', label: 'Users' },
  { value: 'projects', label: 'Projects' },
  { value: 'folders', label: 'Folders' },
  { value: 'saved-files', label: 'Saved Files' },
  { value: 'document-types', label: 'Document Types' },
];

const KNOWLEDGE_GRAPH_TARGET = {
  centerStrength: 0.32,
  repelStrength: 12,
  linkStrength: 0.5,
  linkDistance: 140,
  nodeSizeMultiplier: 1.1,
  lineSizeMultiplier: 0.9,
  textFadeMultiplier: -1.8,
  showArrow: false,
  scale: 0.55,
} as const;

type InvestigationThread = {
  repositoryItemId: string;
  title: string;
  projectLabel: string | null;
  teamId: string;
  teamLabel: string;
  sourceWorkspace: string;
  documentKind: string | null;
  userLabel: string | null;
  lastResponsible: string | null;
  documentState: DocumentationDocumentState | null;
  documentVersion: string | null;
  relatedFileId?: string;
  chronology: DocumentationAuditEntry[];
  firstSeen: string | null;
  lastSeen: string | null;
  relatedActors: string[];
  thematicText: string;
};

type KnowledgeFocusMode =
  | 'documents'
  | 'users'
  | 'projects'
  | 'folders'
  | 'saved-files'
  | 'document-types';

type KnowledgeGraphNodeType =
  | DocumentationKnowledgeNode['nodeType']
  | 'user'
  | 'folder'
  | 'saved-file';

type KnowledgeGraphNode = Omit<DocumentationKnowledgeNode, 'nodeType'> & {
  nodeType: KnowledgeGraphNodeType;
};

type DocumentationHelpTopic =
  | 'repository'
  | 'structure'
  | 'audit'
  | 'investigate'
  | 'knowledge-map';

type RepositoryAction = {
  key: string;
  label: string;
  href?: string;
  onClick?: () => void;
  primary?: boolean;
  newTab?: boolean;
};

function getAuditEntryActorLabel(entry: DocumentationAuditEntry) {
  return entry.responsibleLabel ?? entry.userLabel ?? 'n/a';
}

function getAuditEntryTypeLabel(entry: DocumentationAuditEntry) {
  return entry.documentKind ?? entry.objectType ?? entry.recordClass;
}

function getDocumentReadinessFields(item: DocumentationRepositoryItem) {
  const isBackup = item.objectType === 'session-backup';
  const isReference = item.objectType === 'source-document-reference';
  const isWorking =
    item.objectType === 'checkpoint' ||
    item.objectType === 'saved-selection' ||
    item.itemType === 'workspace-agent';
  const isOutput =
    item.itemType === 'file' ||
    item.objectType === 'derived-document' ||
    item.objectType === 'handoff-package';

  const recordClass = isBackup
    ? 'Backup'
    : isReference
      ? 'Reference'
      : isOutput
        ? 'Output'
        : isWorking
          ? 'Working'
          : 'Working';

  const sensitivity =
    item.objectType === 'handoff-package' || item.lockState === true
      ? 'Restricted'
      : item.projectLabel || item.teamLabel !== 'Main Workspace'
        ? 'Internal'
        : 'Public';

  const officialCopy = isBackup || isWorking ? 'No' : isReference || isOutput ? 'Yes' : 'No';

  const accessScope =
    item.sourceWorkspace === 'main-workspace'
      ? 'Local cell'
      : item.teamLabel && item.teamLabel !== 'Main Workspace'
        ? 'Team'
        : item.projectLabel
          ? 'Project'
          : 'Local cell';

  const retentionReadiness =
    isBackup || officialCopy === 'Yes'
      ? 'Basic'
      : item.auditEventIds.length > 0
        ? 'Review needed'
        : 'Not set';

  const integrityReadiness =
    item.auditEventIds.length > 0 || Boolean(item.documentVersion) || Boolean(item.path)
      ? 'Basic trace'
      : 'Not set';

  const sourceOfTruth =
    officialCopy === 'Yes'
      ? 'Shared documentary base'
      : item.provenanceSummary
        ? 'Derived from source metadata'
        : 'Working layer only';

  return {
    recordClass,
    sensitivity,
    officialCopy,
    accessScope,
    retentionReadiness,
    integrityReadiness,
    sourceOfTruth,
  };
}

const DOCUMENTATION_HELP_LINKS: Array<{
  id: DocumentationHelpTopic;
  label: string;
  modalTitle: string;
}> = [
  {
    id: 'repository',
    label: 'How to use Repository review',
    modalTitle: 'How to use Repository View',
  },
  {
    id: 'structure',
    label: 'How to use Structure view',
    modalTitle: 'How to use Structure View',
  },
  {
    id: 'audit',
    label: 'How to use Audit View',
    modalTitle: 'How to use Audit View',
  },
  {
    id: 'investigate',
    label: 'How to use Investigate View',
    modalTitle: 'How to use Investigate View',
  },
  {
    id: 'knowledge-map',
    label: 'How to use Knowledge Map',
    modalTitle: 'How to use Knowledge Map',
  },
];

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
  const [showAuditManifestView, setShowAuditManifestView] = useState(false);
  const [activeHelpTopic, setActiveHelpTopic] = useState<DocumentationHelpTopic | null>(null);
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [toast, setToast] = useState('');
  const [activeView, setActiveView] = useState<DocumentationViewMode>('repository');
  const [repositoryQuery, setRepositoryQuery] = useState('');
  const [repositoryProjectFilter, setRepositoryProjectFilter] = useState('all');
  const [repositoryTeamFilter, setRepositoryTeamFilter] = useState('all');
  const [repositoryTypeFilter, setRepositoryTypeFilter] = useState('all');
  const [repositoryStatusFilter, setRepositoryStatusFilter] = useState('all');
  const [repositoryDateFilter, setRepositoryDateFilter] = useState('');
  const [auditStateFilter, setAuditStateFilter] = useState('all');
  const [auditEventFilter, setAuditEventFilter] = useState('all');
  const [auditResponsibleFilter, setAuditResponsibleFilter] = useState('all');
  const [auditTeamFilter, setAuditTeamFilter] = useState('all');
  const [auditTypeFilter, setAuditTypeFilter] = useState('all');
  const [auditDateFilter, setAuditDateFilter] = useState('');
  const [investigateProjectFilter, setInvestigateProjectFilter] = useState('all');
  const [investigateTeamFilter, setInvestigateTeamFilter] = useState('all');
  const [investigateWorkspaceFilter, setInvestigateWorkspaceFilter] = useState('all');
  const [investigateKindFilter, setInvestigateKindFilter] = useState('all');
  const [investigateThemeQuery, setInvestigateThemeQuery] = useState('');
  const [investigateDateFilter, setInvestigateDateFilter] = useState('');
  const [knowledgeProjectFilter, setKnowledgeProjectFilter] = useState('');
  const [knowledgeTeamFilter, setKnowledgeTeamFilter] = useState('all');
  const [knowledgeWorkspaceFilter, setKnowledgeWorkspaceFilter] = useState('all');
  const [knowledgeTypeFilter, setKnowledgeTypeFilter] = useState('all');
  const [knowledgeActorFilter, setKnowledgeActorFilter] = useState('all');
  const [knowledgeDateFilter, setKnowledgeDateFilter] = useState('');
  const [knowledgeFocusMode, setKnowledgeFocusMode] = useState<KnowledgeFocusMode>('documents');
  const [selectedKnowledgeNodeId, setSelectedKnowledgeNodeId] = useState<string | null>(null);
  const [selectedRepositoryItemId, setSelectedRepositoryItemId] = useState<string | null>(null);
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
      state.userName,
      state.savedObjects,
      state.savedFiles,
      state.workspaceVersions,
      teamsMapState.teamsGraph,
    ],
  );
  const activeViewDefinition =
    documentationModel.views.find((view) => view.mode === activeView) ?? documentationModel.views[0];
  const recentIndexEntries = useMemo(
    () =>
      [...documentationModel.indexEntries]
        .sort((left, right) => (right.date ?? '').localeCompare(left.date ?? ''))
        .slice(0, 8),
    [documentationModel.indexEntries],
  );
  const teamSummaries = useMemo(
    () =>
      documentationModel.teamFolders.map((folder) => {
        const units = documentationModel.agentUnits.filter((unit) => unit.teamId === folder.teamId);
        const manifests = documentationModel.agentManifests.filter((manifest) => manifest.team_id === folder.teamId);
        const events = documentationModel.indexEntries.filter((entry) => entry.teamId === folder.teamId);

        return {
          teamId: folder.teamId,
          teamLabel: folder.teamLabel,
          units: units.length,
          manifests: manifests.length,
          events: events.length,
        };
      }),
    [documentationModel.agentManifests, documentationModel.agentUnits, documentationModel.indexEntries, documentationModel.teamFolders],
  );
  const repositoryProjectOptions = useMemo(
    () =>
      Array.from(
        new Set(documentationModel.repositoryItems.map((item) => item.projectLabel).filter((value): value is string => Boolean(value))),
      ).sort((left, right) => left.localeCompare(right)),
    [documentationModel.repositoryItems],
  );
  const repositoryTeamOptions = useMemo(
    () =>
      Array.from(
        documentationModel.repositoryItems.reduce(
          (accumulator, item) => accumulator.set(item.teamId, item.teamLabel),
          new Map<string, string>(),
        ),
      )
        .map(([value, label]) => ({ value, label }))
        .sort((left, right) => left.label.localeCompare(right.label)),
    [documentationModel.repositoryItems],
  );
  const auditResponsibleOptions = useMemo(
    () =>
      Array.from(
        new Set(
          documentationModel.auditEntries
            .map((entry) => getAuditEntryActorLabel(entry))
            .filter((value): value is string => Boolean(value)),
        ),
      ).sort((left, right) => left.localeCompare(right)),
    [documentationModel.auditEntries],
  );
  const auditTeamOptions = useMemo(
    () =>
      Array.from(
        new Set(
          documentationModel.auditEntries
            .map((entry) => entry.teamLabel)
            .filter((value): value is string => Boolean(value)),
        ),
      ).sort((left, right) => left.localeCompare(right)),
    [documentationModel.auditEntries],
  );
  const auditTypeOptions = useMemo(
    () =>
      Array.from(
        new Set(
          documentationModel.auditEntries
            .map((entry) => getAuditEntryTypeLabel(entry))
            .filter((value): value is string => Boolean(value)),
        ),
      ).sort((left, right) => left.localeCompare(right)),
    [documentationModel.auditEntries],
  );
  const auditEventOptions = useMemo(
    () =>
      Array.from(
        documentationModel.auditEntries.reduce(
          (accumulator, entry) => accumulator.set(entry.eventKind, entry.eventLabel),
          new Map<string, string>(),
        ),
      )
        .map(([value, label]) => ({ value, label }))
        .sort((left, right) => left.label.localeCompare(right.label)),
    [documentationModel.auditEntries],
  );
  const investigateProjectOptions = useMemo(
    () =>
      Array.from(
        new Set(
          documentationModel.repositoryItems
            .filter((item) => isRepositoryDocumentItem(item))
            .map((item) => item.projectLabel)
            .filter((value): value is string => Boolean(value)),
        ),
      ).sort((left, right) => left.localeCompare(right)),
    [documentationModel.repositoryItems],
  );
  const investigateTeamOptions = useMemo(
    () =>
      Array.from(
        documentationModel.repositoryItems
          .filter((item) => isRepositoryDocumentItem(item))
          .reduce((accumulator, item) => accumulator.set(item.teamId, item.teamLabel), new Map<string, string>()),
      )
        .map(([value, label]) => ({ value, label }))
        .sort((left, right) => left.label.localeCompare(right.label)),
    [documentationModel.repositoryItems],
  );
  const investigateWorkspaceOptions = useMemo(
    () =>
      Array.from(
        new Set(
          documentationModel.repositoryItems
            .filter((item) => isRepositoryDocumentItem(item))
            .map((item) => item.sourceWorkspace),
        ),
      ).sort((left, right) => left.localeCompare(right)),
    [documentationModel.repositoryItems],
  );
  const investigateKindOptions = useMemo(
    () =>
      Array.from(
        new Set(
          documentationModel.repositoryItems
            .filter((item) => isRepositoryDocumentItem(item))
            .map((item) => item.documentKind)
            .filter((value): value is string => Boolean(value)),
        ),
      ).sort((left, right) => left.localeCompare(right)),
    [documentationModel.repositoryItems],
  );
  const repositoryFilteredItems = useMemo(() => {
    const query = repositoryQuery.trim().toLowerCase();

    return documentationModel.repositoryItems
      .filter((item) => {
        const matchesQuery =
          query.length === 0 ||
          [
            item.title,
            item.teamLabel,
            item.ownerLabel ?? '',
            item.itemType,
            item.recordClass,
            item.projectLabel ?? '',
            item.documentState ?? '',
            item.documentVersion ?? '',
            item.lastResponsible ?? '',
          ]
            .join(' ')
            .toLowerCase()
            .includes(query);
        const matchesProject =
          repositoryProjectFilter === 'all' || item.projectLabel === repositoryProjectFilter;
        const matchesTeam = repositoryTeamFilter === 'all' || item.teamId === repositoryTeamFilter;
        const matchesType = repositoryTypeFilter === 'all' || item.itemType === repositoryTypeFilter;
        const statusValue = getRepositoryStatusLabel(item);
        const matchesStatus =
          repositoryStatusFilter === 'all' || statusValue === repositoryStatusFilter;
        const matchesDate =
          !repositoryDateFilter || (item.updatedAt ?? '').slice(0, 10) === repositoryDateFilter;

        return (
          matchesQuery &&
          matchesProject &&
          matchesTeam &&
          matchesType &&
          matchesStatus &&
          matchesDate
        );
      })
      .sort((left, right) => {
        const leftMain = left.teamId === 'main-workspace' ? 0 : 1;
        const rightMain = right.teamId === 'main-workspace' ? 0 : 1;
        if (leftMain !== rightMain) {
          return leftMain - rightMain;
        }

        return (right.updatedAt ?? '').localeCompare(left.updatedAt ?? '') || left.title.localeCompare(right.title);
      });
  }, [
    documentationModel.repositoryItems,
    repositoryDateFilter,
    repositoryProjectFilter,
    repositoryQuery,
    repositoryStatusFilter,
    repositoryTeamFilter,
    repositoryTypeFilter,
  ]);
  const selectedRepositoryItem =
    repositoryFilteredItems.find((item) => item.id === selectedRepositoryItemId) ??
    documentationModel.repositoryItems.find((item) => item.id === selectedRepositoryItemId) ??
    repositoryFilteredItems[0] ??
    null;
  const selectedRepositoryDocumentProject =
    selectedRepositoryItem && isRepositoryDocumentItem(selectedRepositoryItem)
      ? selectedRepositoryItem.projectLabel ?? null
      : null;
  const repositoryResultSummary = useMemo(
    () => ({
      total: repositoryFilteredItems.length,
      savedObjects: repositoryFilteredItems.filter((item) => item.itemType === 'saved-object').length,
      controlled: repositoryFilteredItems.filter((item) => item.documentState === 'Locked').length,
      underReview: repositoryFilteredItems.filter((item) => item.documentState === 'Under Review').length,
    }),
    [repositoryFilteredItems],
  );
  const auditFilteredEntries = useMemo(
    () =>
      documentationModel.auditEntries
        .filter((entry) => {
          const matchesState =
            auditStateFilter === 'all' || entry.documentState === auditStateFilter;
          const matchesEvent =
            auditEventFilter === 'all' || entry.eventKind === auditEventFilter;
          const matchesResponsible =
            auditResponsibleFilter === 'all' || getAuditEntryActorLabel(entry) === auditResponsibleFilter;
          const matchesTeam =
            auditTeamFilter === 'all' || entry.teamLabel === auditTeamFilter;
          const matchesType =
            auditTypeFilter === 'all' || getAuditEntryTypeLabel(entry) === auditTypeFilter;
          const matchesDate =
            !auditDateFilter || (entry.occurredAt ?? '').slice(0, 10) === auditDateFilter;

          return matchesState && matchesEvent && matchesResponsible && matchesTeam && matchesType && matchesDate;
        })
        .sort((left, right) => (right.occurredAt ?? '').localeCompare(left.occurredAt ?? '')),
    [
      auditDateFilter,
      auditEventFilter,
      auditResponsibleFilter,
      auditStateFilter,
      auditTeamFilter,
      auditTypeFilter,
      documentationModel.auditEntries,
    ],
  );
  const investigateThreads = useMemo<InvestigationThread[]>(
    () =>
      documentationModel.repositoryItems
        .filter((item) => isRepositoryDocumentItem(item))
        .map((item) => {
          const chronology = documentationModel.auditEntries
            .filter((entry) => entry.repositoryItemId === item.id)
            .sort((left, right) => (left.occurredAt ?? '').localeCompare(right.occurredAt ?? ''));
          const firstSeen = chronology[0]?.occurredAt ?? item.updatedAt;
          const lastSeen = chronology[chronology.length - 1]?.occurredAt ?? item.updatedAt;
          const relatedActors = Array.from(
            new Set(
              chronology
                .flatMap((entry) => [entry.responsibleLabel, entry.userLabel])
                .filter((value): value is string => Boolean(value)),
            ),
          );
          const thematicText = [
            item.title,
            item.projectLabel ?? '',
            item.teamLabel,
            item.sourceWorkspace,
            item.documentKind ?? '',
            item.userLabel ?? '',
            item.lastResponsible ?? '',
            item.provenanceSummary ?? '',
            item.automaticTags?.join(' ') ?? '',
            chronology.map((entry) => `${entry.eventLabel} ${entry.responsibleLabel ?? ''}`).join(' '),
          ]
            .join(' ')
            .toLowerCase();
          return {
            repositoryItemId: item.id,
            title: item.title,
            projectLabel: item.projectLabel,
            teamId: item.teamId,
            teamLabel: item.teamLabel,
            sourceWorkspace: item.sourceWorkspace,
            documentKind: item.documentKind,
            userLabel: item.userLabel,
            lastResponsible: item.lastResponsible,
            documentState: item.documentState,
            documentVersion: item.documentVersion,
            relatedFileId: item.relatedFileId,
            chronology,
            firstSeen,
            lastSeen,
            relatedActors,
            thematicText,
          };
        })
        .filter((thread) => {
          const query = investigateThemeQuery.trim().toLowerCase();
          const matchesProject =
            investigateProjectFilter === 'all' || thread.projectLabel === investigateProjectFilter;
          const matchesTeam =
            investigateTeamFilter === 'all' || thread.teamId === investigateTeamFilter;
          const matchesWorkspace =
            investigateWorkspaceFilter === 'all' || thread.sourceWorkspace === investigateWorkspaceFilter;
          const matchesKind =
            investigateKindFilter === 'all' || thread.documentKind === investigateKindFilter;
          const matchesTheme =
            query.length === 0 || thread.thematicText.includes(query);
          const matchesDate =
            !investigateDateFilter || (thread.lastSeen ?? '').slice(0, 10) === investigateDateFilter;

          return matchesProject && matchesTeam && matchesWorkspace && matchesKind && matchesTheme && matchesDate;
        })
        .sort((left, right) => (right.lastSeen ?? '').localeCompare(left.lastSeen ?? '')),
    [
      documentationModel.auditEntries,
      documentationModel.repositoryItems,
      investigateDateFilter,
      investigateKindFilter,
      investigateProjectFilter,
      investigateTeamFilter,
      investigateThemeQuery,
      investigateWorkspaceFilter,
    ],
  );
  const investigateTimelineGroups = useMemo(
    () =>
      investigateThreads.reduce<Array<{ date: string; threads: InvestigationThread[] }>>((accumulator, thread) => {
        const date = (thread.lastSeen ?? thread.firstSeen ?? 'n/a').slice(0, 10) || 'n/a';
        const existing = accumulator.find((group) => group.date === date);
        if (existing) {
          existing.threads.push(thread);
          return accumulator;
        }
        return [...accumulator, { date, threads: [thread] }];
      }, []),
    [investigateThreads],
  );
  const investigateContextSummary = useMemo(() => {
    const actorCount = new Set(investigateThreads.flatMap((thread) => thread.relatedActors)).size;
    const firstSeen = investigateThreads[investigateThreads.length - 1]?.firstSeen ?? null;
    const lastSeen = investigateThreads[0]?.lastSeen ?? null;
    return {
      threadCount: investigateThreads.length,
      actorCount,
      firstSeen,
      lastSeen,
      query: investigateThemeQuery.trim(),
    };
  }, [investigateThreads, investigateThemeQuery]);
  const knowledgeProjectOptions = useMemo(
    () =>
      Array.from(
        new Set(
          documentationModel.knowledgeMap.nodes
            .filter((node) => node.nodeType === 'project')
            .map((node) => node.label),
        ),
      ).sort((left, right) => left.localeCompare(right)),
    [documentationModel.knowledgeMap.nodes],
  );
  const knowledgeTeamOptions = useMemo(
    () =>
      documentationModel.knowledgeMap.nodes
        .filter((node) => node.nodeType === 'team' && node.teamId)
        .map((node) => ({ value: node.teamId as string, label: node.label }))
        .sort((left, right) => left.label.localeCompare(right.label)),
    [documentationModel.knowledgeMap.nodes],
  );
  const knowledgeWorkspaceOptions = useMemo(
    () =>
      Array.from(
        new Set(
          documentationModel.knowledgeMap.nodes
            .filter((node) => node.nodeType === 'workspace')
            .map((node) => node.label),
        ),
      ).sort((left, right) => left.localeCompare(right)),
    [documentationModel.knowledgeMap.nodes],
  );
  const knowledgeTypeOptions = useMemo(
    () =>
      Array.from(
        new Set(
          documentationModel.knowledgeMap.nodes
            .filter((node) => node.nodeType === 'document-type')
            .map((node) => node.label),
        ),
      ).sort((left, right) => left.localeCompare(right)),
    [documentationModel.knowledgeMap.nodes],
  );
  const knowledgeActorOptions = useMemo(
    () =>
      Array.from(
        new Set(
          documentationModel.knowledgeMap.nodes
            .filter((node) => node.nodeType === 'document')
            .flatMap((node) => [node.userLabel, node.lastResponsible])
            .filter((value): value is string => Boolean(value)),
        ),
      ).sort((left, right) => left.localeCompare(right)),
    [documentationModel.knowledgeMap.nodes],
  );
  const knowledgeFilteredDocumentNodes = useMemo(() => {
    const effectiveProjectFilter =
      knowledgeProjectFilter || selectedRepositoryDocumentProject || knowledgeProjectOptions[0] || 'all';

    return documentationModel.knowledgeMap.nodes
      .filter((node) => node.nodeType === 'document')
      .filter((node) => {
        const matchesProject =
          effectiveProjectFilter === 'all' || node.projectLabel === effectiveProjectFilter;
        const matchesTeam = knowledgeTeamFilter === 'all' || node.teamId === knowledgeTeamFilter;
        const matchesWorkspace =
          knowledgeWorkspaceFilter === 'all' || node.workspaceLabel === knowledgeWorkspaceFilter;
        const matchesType = knowledgeTypeFilter === 'all' || node.documentKind === knowledgeTypeFilter;
        const matchesActor =
          knowledgeActorFilter === 'all' ||
          node.userLabel === knowledgeActorFilter ||
          node.lastResponsible === knowledgeActorFilter;
        const matchesDate =
          !knowledgeDateFilter || (node.updatedAt ?? '').slice(0, 10) === knowledgeDateFilter;
        return matchesProject && matchesTeam && matchesWorkspace && matchesType && matchesActor && matchesDate;
      })
      .sort(
        (left, right) =>
          (right.updatedAt ?? '').localeCompare(left.updatedAt ?? '') || left.label.localeCompare(right.label),
      )
      .slice(0, 8);
  }, [
    documentationModel.knowledgeMap.nodes,
    knowledgeProjectFilter,
    knowledgeProjectOptions,
    knowledgeActorFilter,
    knowledgeDateFilter,
    knowledgeTeamFilter,
    knowledgeTypeFilter,
    knowledgeWorkspaceFilter,
    selectedRepositoryDocumentProject,
  ]);
  const knowledgeGraph = useMemo(() => {
    const nodes = new Map<string, KnowledgeGraphNode>();
    const edges = new Map<string, DocumentationKnowledgeEdge>();

    const addNode = (node: KnowledgeGraphNode) => {
      if (!nodes.has(node.id)) {
        nodes.set(node.id, node);
      }
    };

    const addEdge = (edge: DocumentationKnowledgeEdge) => {
      if (!edges.has(edge.id)) {
        edges.set(edge.id, edge);
      }
    };

    const registerDocumentContext = (documentNode: DocumentationKnowledgeNode) => {
      addNode({ ...documentNode });
      if (documentNode.projectLabel) {
        const projectId = `focus:project:${documentNode.projectLabel}`;
        addNode({
          id: projectId,
          nodeType: 'project',
          label: documentNode.projectLabel,
          description: 'Project context',
          repositoryItemId: null,
          projectLabel: documentNode.projectLabel,
          teamId: null,
          teamLabel: null,
          workspaceLabel: null,
          documentKind: null,
          documentState: null,
          documentVersion: null,
          userLabel: null,
          lastResponsible: null,
          updatedAt: null,
          auditLinked: false,
        });
        addEdge({
          id: `${documentNode.id}->${projectId}:belongs-to`,
          sourceId: documentNode.id,
          targetId: projectId,
          edgeType: 'belongs-to',
          label: 'belongs to',
        });
      }
      if (documentNode.teamId && documentNode.teamLabel) {
        const teamId = `focus:team:${documentNode.teamId}`;
        addNode({
          id: teamId,
          nodeType: 'team',
          label: documentNode.teamLabel,
          description: 'Team context',
          repositoryItemId: null,
          projectLabel: documentNode.projectLabel,
          teamId: documentNode.teamId,
          teamLabel: documentNode.teamLabel,
          workspaceLabel: null,
          documentKind: null,
          documentState: null,
          documentVersion: null,
          userLabel: null,
          lastResponsible: null,
          updatedAt: null,
          auditLinked: false,
        });
        addEdge({
          id: `${documentNode.id}->${teamId}:linked-to-team`,
          sourceId: documentNode.id,
          targetId: teamId,
          edgeType: 'linked-to-team',
          label: 'linked to team',
        });
      }
      if (documentNode.workspaceLabel) {
        const workspaceId = `focus:workspace:${documentNode.workspaceLabel}`;
        addNode({
          id: workspaceId,
          nodeType: 'workspace',
          label: documentNode.workspaceLabel,
          description: 'Workspace context',
          repositoryItemId: null,
          projectLabel: null,
          teamId: null,
          teamLabel: null,
          workspaceLabel: documentNode.workspaceLabel,
          documentKind: null,
          documentState: null,
          documentVersion: null,
          userLabel: null,
          lastResponsible: null,
          updatedAt: null,
          auditLinked: false,
        });
        addEdge({
          id: `${documentNode.id}->${workspaceId}:created-in`,
          sourceId: documentNode.id,
          targetId: workspaceId,
          edgeType: 'created-in',
          label: 'created in',
        });
      }
      if (documentNode.documentKind) {
        const typeId = `focus:document-type:${documentNode.documentKind}`;
        addNode({
          id: typeId,
          nodeType: 'document-type',
          label: documentNode.documentKind,
          description: 'Document type',
          repositoryItemId: null,
          projectLabel: null,
          teamId: null,
          teamLabel: null,
          workspaceLabel: null,
          documentKind: documentNode.documentKind,
          documentState: null,
          documentVersion: null,
          userLabel: null,
          lastResponsible: null,
          updatedAt: null,
          auditLinked: false,
        });
        addEdge({
          id: `${documentNode.id}->${typeId}:typed-as`,
          sourceId: documentNode.id,
          targetId: typeId,
          edgeType: 'typed-as',
          label: 'typed as',
        });
      }
    };

    knowledgeFilteredDocumentNodes.forEach((documentNode) => {
      if (knowledgeFocusMode === 'documents') {
        registerDocumentContext(documentNode);
        return;
      }

      if (knowledgeFocusMode === 'users') {
        addNode({ ...documentNode });
        const userNodes: Array<{
          id: string;
          label: string;
          edgeLabel: string;
          userLabel: string | null;
          lastResponsible: string | null;
        }> = [
          {
            id: `focus:user:owner:${documentNode.userLabel ?? 'unknown'}`,
            label: documentNode.userLabel ?? 'Unknown User',
            edgeLabel: 'owned by',
            userLabel: documentNode.userLabel,
            lastResponsible: documentNode.lastResponsible,
          },
          documentNode.lastResponsible && documentNode.lastResponsible !== documentNode.userLabel
            ? {
                id: `focus:user:responsible:${documentNode.lastResponsible}`,
                label: documentNode.lastResponsible,
                edgeLabel: 'responsible for',
                userLabel: documentNode.userLabel,
                lastResponsible: documentNode.lastResponsible,
              }
            : null,
        ].filter(
          (
            entry,
          ): entry is {
            id: string;
            label: string;
            edgeLabel: string;
            userLabel: string | null;
            lastResponsible: string | null;
          } => Boolean(entry),
        );

        userNodes.forEach((userNode) => {
          addNode({
            id: userNode.id,
            nodeType: 'user',
            label: userNode.label,
            description: 'Accountability lens',
            repositoryItemId: null,
            projectLabel: documentNode.projectLabel,
            teamId: documentNode.teamId,
            teamLabel: documentNode.teamLabel,
            workspaceLabel: documentNode.workspaceLabel,
            documentKind: null,
            documentState: null,
            documentVersion: null,
            userLabel: userNode.userLabel,
            lastResponsible: userNode.lastResponsible,
            updatedAt: null,
            auditLinked: documentNode.auditLinked,
          });
          addEdge({
            id: `${userNode.id}->${documentNode.id}:${userNode.edgeLabel}`,
            sourceId: userNode.id,
            targetId: documentNode.id,
            edgeType: 'belongs-to',
            label: userNode.edgeLabel,
          });
        });
        if (documentNode.teamId && documentNode.teamLabel) {
          const teamId = `focus:team:${documentNode.teamId}`;
          addNode({
            id: teamId,
            nodeType: 'team',
            label: documentNode.teamLabel,
            description: 'Team context',
            repositoryItemId: null,
            projectLabel: documentNode.projectLabel,
            teamId: documentNode.teamId,
            teamLabel: documentNode.teamLabel,
            workspaceLabel: null,
            documentKind: null,
            documentState: null,
            documentVersion: null,
            userLabel: null,
            lastResponsible: null,
            updatedAt: null,
            auditLinked: false,
          });
          addEdge({
            id: `${documentNode.id}->${teamId}:linked-to-team`,
            sourceId: documentNode.id,
            targetId: teamId,
            edgeType: 'linked-to-team',
            label: 'linked to team',
          });
        }
        return;
      }

      if (knowledgeFocusMode === 'projects') {
        addNode({ ...documentNode });
        if (documentNode.projectLabel) {
          const projectId = `focus:project:${documentNode.projectLabel}`;
          addNode({
            id: projectId,
            nodeType: 'project',
            label: documentNode.projectLabel,
            description: 'Project context',
            repositoryItemId: null,
            projectLabel: documentNode.projectLabel,
            teamId: null,
            teamLabel: null,
            workspaceLabel: null,
            documentKind: null,
            documentState: null,
            documentVersion: null,
            userLabel: null,
            lastResponsible: null,
            updatedAt: null,
            auditLinked: false,
          });
          addEdge({
            id: `${documentNode.id}->${projectId}:belongs-to`,
            sourceId: documentNode.id,
            targetId: projectId,
            edgeType: 'belongs-to',
            label: 'belongs to',
          });
          if (documentNode.lastResponsible) {
            const actorId = `focus:user:project:${documentNode.lastResponsible}`;
            addNode({
              id: actorId,
              nodeType: 'user',
              label: documentNode.lastResponsible,
              description: 'Relevant actor',
              repositoryItemId: null,
              projectLabel: documentNode.projectLabel,
              teamId: documentNode.teamId,
              teamLabel: documentNode.teamLabel,
              workspaceLabel: documentNode.workspaceLabel,
              documentKind: null,
              documentState: null,
              documentVersion: null,
              userLabel: documentNode.userLabel,
              lastResponsible: documentNode.lastResponsible,
              updatedAt: null,
              auditLinked: documentNode.auditLinked,
            });
            addEdge({
              id: `${actorId}->${projectId}:created-in`,
              sourceId: actorId,
              targetId: projectId,
              edgeType: 'created-in',
              label: 'active in project',
            });
          }
        }
        if (documentNode.teamId && documentNode.teamLabel && documentNode.projectLabel) {
          const teamId = `focus:team:${documentNode.teamId}`;
          const projectId = `focus:project:${documentNode.projectLabel}`;
          addNode({
            id: teamId,
            nodeType: 'team',
            label: documentNode.teamLabel,
            description: 'Team context',
            repositoryItemId: null,
            projectLabel: documentNode.projectLabel,
            teamId: documentNode.teamId,
            teamLabel: documentNode.teamLabel,
            workspaceLabel: null,
            documentKind: null,
            documentState: null,
            documentVersion: null,
            userLabel: null,
            lastResponsible: null,
            updatedAt: null,
            auditLinked: false,
          });
          addEdge({
            id: `${teamId}->${projectId}:linked-to-team`,
            sourceId: teamId,
            targetId: projectId,
            edgeType: 'linked-to-team',
            label: 'supports project',
          });
          addEdge({
            id: `${documentNode.id}->${teamId}:linked-to-team`,
            sourceId: documentNode.id,
            targetId: teamId,
            edgeType: 'linked-to-team',
            label: 'linked to team',
          });
        }
        return;
      }

      if (knowledgeFocusMode === 'folders') {
        const folderLabel =
          documentNode.teamLabel && documentNode.teamLabel !== 'Main Workspace'
            ? `${documentNode.teamLabel} folder`
            : `${documentNode.workspaceLabel ?? 'Workspace'} folder`;
        const folderId = `focus:folder:${folderLabel}`;
        addNode({
          id: folderId,
          nodeType: 'folder',
          label: folderLabel,
          description: documentNode.description,
          repositoryItemId: null,
          projectLabel: documentNode.projectLabel,
          teamId: documentNode.teamId,
          teamLabel: documentNode.teamLabel,
          workspaceLabel: documentNode.workspaceLabel,
          documentKind: null,
          documentState: null,
          documentVersion: null,
          userLabel: null,
          lastResponsible: null,
          updatedAt: null,
          auditLinked: false,
        });
        addNode({ ...documentNode });
        addEdge({
          id: `${documentNode.id}->${folderId}:belongs-to`,
          sourceId: documentNode.id,
          targetId: folderId,
          edgeType: 'belongs-to',
          label: 'stored in',
        });
        if (documentNode.projectLabel) {
          const projectId = `focus:project:${documentNode.projectLabel}`;
          addNode({
            id: projectId,
            nodeType: 'project',
            label: documentNode.projectLabel,
            description: 'Project context',
            repositoryItemId: null,
            projectLabel: documentNode.projectLabel,
            teamId: null,
            teamLabel: null,
            workspaceLabel: null,
            documentKind: null,
            documentState: null,
            documentVersion: null,
            userLabel: null,
            lastResponsible: null,
            updatedAt: null,
            auditLinked: false,
          });
          addEdge({
            id: `${folderId}->${projectId}:belongs-to`,
            sourceId: folderId,
            targetId: projectId,
            edgeType: 'belongs-to',
            label: 'belongs to',
          });
        }
        return;
      }

      if (knowledgeFocusMode === 'saved-files') {
        const savedFileId = `focus:saved-file:${documentNode.id}`;
        addNode({
          ...documentNode,
          id: savedFileId,
          nodeType: 'saved-file',
          description: 'Persisted saved file',
        });
        addNode({ ...documentNode });
        addEdge({
          id: `${savedFileId}->${documentNode.id}:created-in`,
          sourceId: savedFileId,
          targetId: documentNode.id,
          edgeType: 'created-in',
          label: 'materializes as',
        });
        if (documentNode.projectLabel) {
          const projectId = `focus:project:${documentNode.projectLabel}`;
          addNode({
            id: projectId,
            nodeType: 'project',
            label: documentNode.projectLabel,
            description: 'Project context',
            repositoryItemId: null,
            projectLabel: documentNode.projectLabel,
            teamId: null,
            teamLabel: null,
            workspaceLabel: null,
            documentKind: null,
            documentState: null,
            documentVersion: null,
            userLabel: null,
            lastResponsible: null,
            updatedAt: null,
            auditLinked: false,
          });
          addEdge({
            id: `${savedFileId}->${projectId}:belongs-to`,
            sourceId: savedFileId,
            targetId: projectId,
            edgeType: 'belongs-to',
            label: 'belongs to',
          });
        }
        if (documentNode.teamId && documentNode.teamLabel) {
          const teamId = `focus:team:${documentNode.teamId}`;
          addNode({
            id: teamId,
            nodeType: 'team',
            label: documentNode.teamLabel,
            description: 'Team context',
            repositoryItemId: null,
            projectLabel: documentNode.projectLabel,
            teamId: documentNode.teamId,
            teamLabel: documentNode.teamLabel,
            workspaceLabel: null,
            documentKind: null,
            documentState: null,
            documentVersion: null,
            userLabel: null,
            lastResponsible: null,
            updatedAt: null,
            auditLinked: false,
          });
          addEdge({
            id: `${savedFileId}->${teamId}:linked-to-team`,
            sourceId: savedFileId,
            targetId: teamId,
            edgeType: 'linked-to-team',
            label: 'linked to team',
          });
        }
        return;
      }

      if (knowledgeFocusMode === 'document-types') {
        addNode({ ...documentNode });
        if (documentNode.documentKind) {
          const typeId = `focus:document-type:${documentNode.documentKind}`;
          addNode({
            id: typeId,
            nodeType: 'document-type',
            label: documentNode.documentKind,
            description: 'Document type',
            repositoryItemId: null,
            projectLabel: null,
            teamId: null,
            teamLabel: null,
            workspaceLabel: null,
            documentKind: documentNode.documentKind,
            documentState: null,
            documentVersion: null,
            userLabel: null,
            lastResponsible: null,
            updatedAt: null,
            auditLinked: false,
          });
          addEdge({
            id: `${documentNode.id}->${typeId}:typed-as`,
            sourceId: documentNode.id,
            targetId: typeId,
            edgeType: 'typed-as',
            label: 'typed as',
          });
          if (documentNode.projectLabel) {
            const projectId = `focus:project:${documentNode.projectLabel}`;
            addNode({
              id: projectId,
              nodeType: 'project',
              label: documentNode.projectLabel,
              description: 'Project context',
              repositoryItemId: null,
              projectLabel: documentNode.projectLabel,
              teamId: null,
              teamLabel: null,
              workspaceLabel: null,
              documentKind: null,
              documentState: null,
              documentVersion: null,
              userLabel: null,
              lastResponsible: null,
              updatedAt: null,
              auditLinked: false,
            });
            addEdge({
              id: `${projectId}->${typeId}:belongs-to`,
              sourceId: projectId,
              targetId: typeId,
              edgeType: 'belongs-to',
              label: 'contains type',
            });
          }
        }
      }
    });

    return {
      nodes: Array.from(nodes.values()),
      edges: Array.from(edges.values()),
    };
  }, [knowledgeFilteredDocumentNodes, knowledgeFocusMode]);
  const knowledgeConnectionsByNodeId = useMemo(() => {
    const connections = new Map<string, number>();
    knowledgeGraph.edges.forEach((edge) => {
      connections.set(edge.sourceId, (connections.get(edge.sourceId) ?? 0) + 1);
      connections.set(edge.targetId, (connections.get(edge.targetId) ?? 0) + 1);
    });
    return connections;
  }, [knowledgeGraph.edges]);
  const selectedKnowledgeNode =
    knowledgeGraph.nodes.find((node) => node.id === selectedKnowledgeNodeId) ??
    knowledgeGraph.nodes.find((node) => node.nodeType === 'document' || node.nodeType === 'saved-file') ??
    knowledgeGraph.nodes[0] ??
    null;
  const selectedKnowledgeRelations = useMemo(() => {
    if (!selectedKnowledgeNode) {
      return [];
    }

    return knowledgeGraph.edges
      .filter(
        (edge) =>
          edge.sourceId === selectedKnowledgeNode.id || edge.targetId === selectedKnowledgeNode.id,
      )
      .map((edge) => {
        const relatedNode =
          knowledgeGraph.nodes.find((node) =>
            node.id === (edge.sourceId === selectedKnowledgeNode.id ? edge.targetId : edge.sourceId),
          ) ?? null;
        return {
          edge,
          relatedNode,
        };
      })
      .filter((entry) => entry.relatedNode !== null)
      .slice(0, 6);
  }, [knowledgeGraph.edges, knowledgeGraph.nodes, selectedKnowledgeNode]);
  const knowledgeContextSummary = useMemo(() => {
    const auditLinkedDocuments = knowledgeFilteredDocumentNodes.filter((node) => node.auditLinked).length;
    const relatedActors = new Set(
      knowledgeFilteredDocumentNodes
        .flatMap((node) => [node.userLabel, node.lastResponsible])
        .filter((value): value is string => Boolean(value)),
    ).size;
    return {
      documentCount: knowledgeFilteredDocumentNodes.length,
      nodeCount: knowledgeGraph.nodes.length,
      edgeCount: knowledgeGraph.edges.length,
      auditLinkedDocuments,
      relatedActors,
    };
  }, [knowledgeFilteredDocumentNodes, knowledgeGraph.edges.length, knowledgeGraph.nodes.length]);
  const knowledgeModeSummary = useMemo(() => {
    if (knowledgeFocusMode === 'documents') {
      return 'Documents shows documentary pieces connected through their team and project context.';
    }
    if (knowledgeFocusMode === 'users') {
      return 'Users shows owners and responsible actors linked to the documents they touched.';
    }
    if (knowledgeFocusMode === 'projects') {
      return 'Projects shows projects as the main container, with teams, documents, and relevant actors around them.';
    }
    if (knowledgeFocusMode === 'folders') {
      return 'Folders shows the structural storage layer and the documents organized inside it.';
    }
    if (knowledgeFocusMode === 'saved-files') {
      return 'Saved Files shows persisted pieces and how they materialize into documents, teams, and projects.';
    }
    return 'Document Types shows each documentary class and the concrete pieces linked to that type.';
  }, [knowledgeFocusMode]);

  useEffect(() => {
    if (!knowledgeProjectFilter) {
      setKnowledgeProjectFilter(selectedRepositoryDocumentProject ?? knowledgeProjectOptions[0] ?? 'all');
    }
  }, [knowledgeProjectFilter, knowledgeProjectOptions, selectedRepositoryDocumentProject]);

  useEffect(() => {
    if (knowledgeGraph.nodes.length === 0) {
      if (selectedKnowledgeNodeId !== null) {
        setSelectedKnowledgeNodeId(null);
      }
      return;
    }

    if (
      selectedKnowledgeNodeId &&
      knowledgeGraph.nodes.some((node) => node.id === selectedKnowledgeNodeId)
    ) {
      return;
    }

    const selectedDocumentNode =
      selectedRepositoryItem && isRepositoryDocumentItem(selectedRepositoryItem)
        ? knowledgeGraph.nodes.find((node) => node.repositoryItemId === selectedRepositoryItem.id) ?? null
        : null;

    setSelectedKnowledgeNodeId(
      selectedDocumentNode?.id ??
        knowledgeGraph.nodes.find((node) => node.nodeType === 'document' || node.nodeType === 'saved-file')?.id ??
        knowledgeGraph.nodes[0].id,
    );
  }, [knowledgeGraph.nodes, selectedKnowledgeNodeId, selectedRepositoryItem]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const itemIdFromLocation = params.get('doc_item');
    const viewFromLocation = params.get('doc_view');
    if (
      viewFromLocation &&
      (viewFromLocation === 'repository' ||
        viewFromLocation === 'audit' ||
        viewFromLocation === 'investigate' ||
        viewFromLocation === 'knowledge-map' ||
        viewFromLocation === 'structure') &&
      activeView !== viewFromLocation
    ) {
      setActiveView(viewFromLocation);
    }
    if (itemIdFromLocation && documentationModel.repositoryItems.some((item) => item.id === itemIdFromLocation)) {
      setSelectedRepositoryItemId(itemIdFromLocation);
      return;
    }

    if (!selectedRepositoryItemId && repositoryFilteredItems[0]) {
      setSelectedRepositoryItemId(repositoryFilteredItems[0].id);
    }
  }, [
    activeView,
    documentationModel.repositoryItems,
    repositoryFilteredItems,
    selectedRepositoryItemId,
  ]);

  useEffect(() => {
    if (activeView !== 'repository') {
      return;
    }

    if (!selectedRepositoryItemId) {
      if (repositoryFilteredItems[0]) {
        setSelectedRepositoryItemId(repositoryFilteredItems[0].id);
      }
      return;
    }

    if (
      repositoryFilteredItems.length > 0 &&
      !repositoryFilteredItems.some((item) => item.id === selectedRepositoryItemId)
    ) {
      setSelectedRepositoryItemId(repositoryFilteredItems[0].id);
    }
  }, [activeView, repositoryFilteredItems, selectedRepositoryItemId]);

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

  const focusRepositoryDocument = (
    repositoryItemId: string,
    _options?: {
      focusDetail?: boolean;
    },
  ) => {
    const canonicalItem =
      documentationModel.repositoryItems.find((candidate) => candidate.id === repositoryItemId) ?? null;
    if (!canonicalItem) {
      return;
    }
    setSelectedRepositoryItemId(canonicalItem.id);
  };

  const buildDocumentPageHref = (itemId: string) => {
    const item = documentationModel.repositoryItems.find((candidate) => candidate.id === itemId) ?? null;
    if (!item) return '#';

    const url = new URL(window.location.href);
    url.search = '';
    url.searchParams.set('doc_page', 'document');
    url.searchParams.set('doc_item', item.id);
    return url.toString();
  };

  const openParallelHref = (href: string) => {
    const launchedWindow = window.open(href, '_blank', 'noopener,noreferrer');
    if (!launchedWindow) {
      setToast('Could not open the requested page.');
    }
  };

  const openDocumentPage = (itemId: string) => {
    const href = buildDocumentPageHref(itemId);
    if (href === '#') {
      setToast('Requested document was not found.');
      return;
    }
    openParallelHref(href);
  };

  const buildAuditLogHref = (item: DocumentationRepositoryItem) => {
    const auditEventId = item.auditEventIds[item.auditEventIds.length - 1] ?? null;
    if (!auditEventId) return '#';

    const url = new URL(window.location.href);
    url.search = '';
    url.searchParams.set('page', 'C');
    url.searchParams.set('audit_event', auditEventId);
    return url.toString();
  };

  const buildResumeWorkHref = (item: DocumentationRepositoryItem) => {
    if (!item.relatedObjectId) return '#';
    const savedObject = state.savedObjects.find((candidate) => candidate.id === item.relatedObjectId) ?? null;
    const versionReference = getCheckpointVersionReference(savedObject);
    if (!versionReference) return '#';

    const url = new URL(window.location.href);
    url.search = '';
    url.searchParams.set('page', 'H');
    url.searchParams.set('version_source', versionReference.source);
    url.searchParams.set('version_id', versionReference.versionId);
    url.searchParams.set('version_thread', versionReference.threadId);
    if (versionReference.source === 'main' && versionReference.agent) {
      url.searchParams.set('version_agent', versionReference.agent);
    }
    if (versionReference.source === 'main' && versionReference.panelScope) {
      url.searchParams.set('version_panel', versionReference.panelScope);
    }
    if (versionReference.source === 'team' && versionReference.teamId) {
      url.searchParams.set('version_team', versionReference.teamId);
    }
    return url.toString();
  };

  const getRepositoryActions = (
    item: DocumentationRepositoryItem,
    options?: { includeDetail?: boolean },
  ): RepositoryAction[] => {
    const actions: RepositoryAction[] = [];

    if (options?.includeDetail ?? true) {
      actions.push({
        key: 'detail',
        label: 'View Details',
        onClick: () => focusRepositoryDocument(item.id, { focusDetail: true }),
      });
    }

    if (item.itemType === 'file') {
      actions.push({
        key: 'document',
        label: 'Open Document',
        onClick: () => openDocumentPage(item.id),
        primary: true,
      });
      return actions;
    }

    if (item.objectType === 'source-document-reference' || item.objectType === 'derived-document') {
      actions.push({
        key: 'document',
        label: 'Open Document',
        onClick: () => openDocumentPage(item.id),
        primary: true,
      });
      return actions;
    }

    if (item.objectType === 'checkpoint') {
      const resumeHref = buildResumeWorkHref(item);
      actions.push({
        key: 'resume',
        label: 'Resume Work',
        href: resumeHref === '#' ? undefined : resumeHref,
        onClick: resumeHref === '#' ? undefined : () => window.location.assign(resumeHref),
        primary: true,
      });
      return actions;
    }

    if (item.objectType === 'saved-selection') {
      actions.push({
        key: 'selection',
        label: 'Open Selection',
        onClick: () => openDocumentPage(item.id),
        primary: true,
      });
      return actions;
    }

    if (item.objectType === 'handoff-package') {
      actions.push({
        key: 'handoff',
        label: 'Open Handoff',
        onClick: () => openDocumentPage(item.id),
        primary: true,
      });
      return actions;
    }

    if (item.objectType === 'session-backup') {
      actions.push({
        key: 'backup',
        label: 'Open Backup',
        onClick: () => openDocumentPage(item.id),
        primary: true,
      });
      return actions;
    }

    if (item.auditEventIds.length > 0) {
      const auditHref = buildAuditLogHref(item);
      actions.push({
        key: 'audit',
        label: 'View in Audit Log',
        href: auditHref === '#' ? undefined : auditHref,
        onClick: auditHref === '#' ? undefined : () => openParallelHref(auditHref),
        primary: true,
      });
    }

    return actions;
  };

  const getAuditEntryActions = (entry: DocumentationAuditEntry): RepositoryAction[] => {
    const repositoryItem =
      documentationModel.repositoryItems.find((item) => item.id === entry.repositoryItemId) ?? null;
    if (!repositoryItem) {
      return [
        {
          key: 'audit-detail',
          label: 'View Details',
          onClick: () => focusRepositoryDocument(entry.repositoryItemId, { focusDetail: true }),
        },
      ];
    }

    const actions = getRepositoryActions(repositoryItem);
    if (!actions.some((action) => action.key === 'audit')) {
      const auditHref = buildAuditLogHref(repositoryItem);
      if (auditHref !== '#') {
        actions.push({
          key: 'audit',
          label: 'View in Audit Log',
          onClick: () => openParallelHref(auditHref),
        });
      }
    }
    return actions;
  };

  const getInvestigateThreadActions = (thread: InvestigationThread): RepositoryAction[] => {
    const repositoryItem =
      documentationModel.repositoryItems.find((item) => item.id === thread.repositoryItemId) ?? null;
    if (!repositoryItem) {
      return [];
    }

    const actions = getRepositoryActions(repositoryItem);
    if (!actions.some((action) => action.key === 'audit')) {
      const auditHref = buildAuditLogHref(repositoryItem);
      if (auditHref !== '#') {
        actions.push({
          key: 'audit',
          label: 'View in Audit Log',
          onClick: () => openParallelHref(auditHref),
        });
      }
    }
    return actions;
  };

  const getKnowledgeNodeActions = (node: KnowledgeGraphNode | null): RepositoryAction[] => {
    if (!node?.repositoryItemId) {
      return [];
    }

    const repositoryItem =
      documentationModel.repositoryItems.find((item) => item.id === node.repositoryItemId) ?? null;
    if (!repositoryItem) {
      return [];
    }

    const actions = getRepositoryActions(repositoryItem);
    if (!actions.some((action) => action.key === 'audit')) {
      const auditHref = buildAuditLogHref(repositoryItem);
      if (auditHref !== '#') {
        actions.push({
          key: 'audit',
          label: 'View in Audit Log',
          onClick: () => openParallelHref(auditHref),
        });
      }
    }
    return actions;
  };

  const documentationViewContent =
    activeView === 'structure' ? (
      <DocumentationMirrorTree model={documentationModel} />
    ) : activeView === 'repository' ? (
      <div className="flex h-full min-h-0 flex-col gap-2.5">
        <div className="ui-surface-subtle rounded-[16px] px-2.5 py-1.5">
          <div className="grid gap-1.5">
            <div className="grid gap-2 xl:grid-cols-[minmax(330px,2.05fr)_minmax(250px,1.65fr)_repeat(4,minmax(118px,0.76fr))]">
              <div className="ui-surface rounded-[14px] px-3 py-2">
                <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
                  Repository search
                </div>
                <div className="mt-0.5 text-[12px] font-semibold tracking-[-0.02em] text-neutral-900">
                  Find documents and operational objects from the shared documentary base.
                </div>
                <div className="mt-0.5 text-[10px] leading-[1.3] text-neutral-600">
                  Search by name, team, origin, agent, or basic type without switching to the structural tree.
                </div>
                <label className="mt-1.5 grid gap-1">
                  <span className="ui-label">Search repository</span>
                  <input
                    className="ui-input text-xs"
                    value={repositoryQuery}
                    onChange={(event) => setRepositoryQuery(event.target.value)}
                    placeholder="Search by name, team, owner, type..."
                  />
                </label>
              </div>

              <div className="ui-surface rounded-[14px] px-3 py-2">
                <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
                  Root context
                </div>
                <div className="mt-0.5 truncate text-[12px] font-semibold tracking-[-0.02em] text-neutral-900" title={documentationModel.root.path}>
                  {documentationModel.root.path}
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-neutral-500">
                  <span>Teams <span className="text-neutral-800 normal-case tracking-normal">{documentationModel.teamFolders.length}</span></span>
                  <span>Agent Units <span className="text-neutral-800 normal-case tracking-normal">{documentationModel.agentUnits.length}</span></span>
                  <span>Indexed Records <span className="text-neutral-800 normal-case tracking-normal">{documentationModel.indexEntries.length}</span></span>
                </div>
              </div>

              <div className="ui-surface rounded-[14px] px-3 py-2">
                <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
                  Results
                </div>
                <div className="mt-0.5 text-[18px] font-semibold tracking-[-0.04em] text-neutral-900">
                  {repositoryResultSummary.total}
                </div>
                <div className="mt-0.5 text-[10px] leading-[1.28] text-neutral-600">
                  items currently visible in Repository View
                </div>
              </div>

              <div className="ui-surface rounded-[14px] px-3 py-2">
                <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
                  Saved Objects
                </div>
                <div className="mt-0.5 text-[18px] font-semibold tracking-[-0.04em] text-neutral-900">
                  {repositoryResultSummary.savedObjects}
                </div>
                <div className="mt-0.5 text-[10px] leading-[1.28] text-neutral-600">
                  checkpoints, selections, handoffs, and related operational objects
                </div>
              </div>

              <div className="ui-surface rounded-[14px] px-3 py-2">
                <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
                  Under Review
                </div>
                <div className="mt-0.5 text-[18px] font-semibold tracking-[-0.04em] text-neutral-900">
                  {repositoryResultSummary.underReview}
                </div>
                <div className="mt-0.5 text-[10px] leading-[1.28] text-neutral-600">
                  records that still need review or controlled follow-through
                </div>
              </div>

              <div className="ui-surface rounded-[14px] px-3 py-2">
                <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
                  Controlled
                </div>
                <div className="mt-0.5 text-[18px] font-semibold tracking-[-0.04em] text-neutral-900">
                  {repositoryResultSummary.controlled}
                </div>
                <div className="mt-0.5 text-[10px] leading-[1.28] text-neutral-600">
                  locked or controlled documentary states visible in the current result set
                </div>
              </div>
            </div>

            <div className="grid gap-x-2 gap-y-1 xl:grid-cols-[repeat(5,minmax(108px,0.92fr))_auto] xl:items-end">
              <label className="grid gap-1">
                <span className="ui-label">Project</span>
                <select
                  className="ui-input text-xs"
                  value={repositoryProjectFilter}
                  onChange={(event) => setRepositoryProjectFilter(event.target.value)}
                >
                  <option value="all">All projects</option>
                  {repositoryProjectOptions.map((project) => (
                    <option key={project} value={project}>
                      {project}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-1">
                <span className="ui-label">Team</span>
                <select
                  className="ui-input text-xs"
                  value={repositoryTeamFilter}
                  onChange={(event) => setRepositoryTeamFilter(event.target.value)}
                >
                  <option value="all">All teams</option>
                  {repositoryTeamOptions.map((team) => (
                    <option key={team.value} value={team.value}>
                      {team.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-1">
                <span className="ui-label">Type</span>
                <select
                  className="ui-input text-xs"
                  value={repositoryTypeFilter}
                  onChange={(event) => setRepositoryTypeFilter(event.target.value)}
                >
                  <option value="all">All types</option>
                  <option value="file">Files</option>
                  <option value="saved-object">Saved objects</option>
                  <option value="agent-unit">Agent units</option>
                  <option value="workspace-agent">Workspace agents</option>
                  <option value="team-folder">Team folders</option>
                </select>
              </label>

              <label className="grid gap-1">
                <span className="ui-label">State</span>
                <select
                  className="ui-input text-xs"
                  value={repositoryStatusFilter}
                  onChange={(event) => setRepositoryStatusFilter(event.target.value)}
                >
                  <option value="all">All states</option>
                  <option value="Active">Active</option>
                  <option value="Draft">Draft</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Under Review">Under Review</option>
                  <option value="Approved">Approved</option>
                  <option value="Locked">Locked</option>
                  <option value="Archived">Archived</option>
                </select>
              </label>

              <label className="grid gap-1">
                <span className="ui-label">Date</span>
                <input
                  className="ui-input text-xs"
                  type="date"
                  value={repositoryDateFilter}
                  onChange={(event) => setRepositoryDateFilter(event.target.value)}
                />
              </label>
              <div className="flex items-end justify-end">
                <button
                  className="ui-button min-h-8 px-3 text-[11px] text-neutral-700"
                  onClick={() => {
                    setRepositoryQuery('');
                    setRepositoryProjectFilter('all');
                    setRepositoryTeamFilter('all');
                    setRepositoryTypeFilter('all');
                    setRepositoryStatusFilter('all');
                    setRepositoryDateFilter('');
                  }}
                >
                  Reset filters
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="ui-surface min-h-0 flex flex-1 flex-col overflow-hidden rounded-[22px] px-4 py-2.5 sm:px-5">
          <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
                Repository Results
              </div>
              <div className="mt-0.5 text-[13px] leading-[1.3] text-neutral-700">
                <span className="font-semibold text-neutral-900">{repositoryFilteredItems.length}</span>{' '}
                items available from the shared documentary base.
              </div>
            </div>
            <div className="text-[10px] leading-[1.3] text-neutral-600">
              Repository View is the fast access surface for operating documentation without depending on the tree.
            </div>
          </div>
          <div className="grid min-h-0 flex-1 gap-3 xl:grid-cols-[minmax(0,1.28fr)_minmax(320px,0.72fr)] xl:items-stretch">
              {false && selectedRepositoryItem ? (
                <div className="ui-surface rounded-[20px] px-4 py-4">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
                    Detail Focus
                  </div>
                  <div className="mt-2 text-xs leading-[1.5] text-neutral-600">
                    This tab was opened directly for the selected repository item.
                  </div>
                </div>
              ) : (
                <div className="grid min-h-0 content-start gap-2.5 overflow-y-auto pr-1">
                  {repositoryFilteredItems.map((item) => (
                    <RepositoryItemCard
                      key={item.id}
                      itemType={item.itemType}
                      typeLabel={getRepositoryItemTypeLabel(item)}
                      teamLabel={item.teamLabel}
                      ownerLabel={item.ownerLabel}
                      sourcePanelLabel={item.sourcePanelLabel ?? null}
                      updatedAt={item.updatedAt}
                      title={item.title}
                      meta={`${item.objectType ?? item.itemType} · ${item.teamLabel} · ${item.sourcePanelLabel ?? item.ownerLabel ?? 'system ownership'}`}
                      secondary={`${item.recordClass} · updated ${item.updatedAt?.slice(0, 10) ?? 'n/a'}${item.provenanceSummary ? ` · ${item.provenanceSummary}` : ''}`}
                      status={item.status}
                      documentState={item.documentState}
                      documentVersion={item.documentVersion}
                      lastResponsible={item.lastResponsible}
                      readiness={getDocumentReadinessFields(item)}
                      selected={selectedRepositoryItem?.id === item.id}
                      onSelect={() => setSelectedRepositoryItemId(item.id)}
                      actions={getRepositoryActions(item)}
                    />
                  ))}

                  {repositoryFilteredItems.length === 0 ? (
                    <div className="ui-surface-subtle rounded-[18px] px-4 py-6 text-sm text-neutral-600">
                      No repository items match the current search and filters.
                    </div>
                  ) : null}
                </div>
              )}

              <div className="ui-surface-subtle rounded-[20px] px-4 py-4 xl:sticky xl:top-0">
                <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
                  Documentary Detail
                </div>

                {selectedRepositoryItem ? (
                  <RepositoryDetailPanel
                    item={selectedRepositoryItem}
                    actions={getRepositoryActions(selectedRepositoryItem, { includeDetail: false })}
                  />
                ) : (
                  <div className="mt-3 text-sm text-neutral-600">
                    Select a repository item to inspect its documentary metadata.
                  </div>
                )}
              </div>
          </div>
        </div>
      </div>
    ) : activeView === 'audit' ? (
      <div className="flex h-full min-h-0 flex-col gap-3">
        <div className="ui-surface-subtle rounded-[18px] px-3 py-2">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
            <span>Audit Records: <span className="text-neutral-800 normal-case tracking-normal">{auditFilteredEntries.length}</span></span>
            <span>Controlled Docs: <span className="text-neutral-800 normal-case tracking-normal">{documentationModel.repositoryItems.filter((item) => item.documentState === 'Locked').length}</span></span>
            <span>Under Review: <span className="text-neutral-800 normal-case tracking-normal">{documentationModel.repositoryItems.filter((item) => item.documentState === 'Under Review').length}</span></span>
            <span>Audit Links: <span className="text-neutral-800 normal-case tracking-normal">{auditFilteredEntries.reduce((sum, entry) => sum + entry.auditEventIds.length, 0)}</span></span>
          </div>
        </div>

        <div className="ui-surface-subtle rounded-[18px] px-3 py-2">
          <div className="grid gap-x-3 gap-y-2 xl:grid-cols-[repeat(4,minmax(150px,1fr))_auto] xl:items-end">
            {false ? recentIndexEntries.map((entry) => (
              <div key={entry.id} className="ui-surface-subtle rounded-[16px] px-4 py-3 text-xs text-neutral-700">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-semibold text-neutral-900">{entry.teamLabel}</span>
                  <span className="text-neutral-500">{entry.date}</span>
                </div>
                <div className="mt-2 leading-[1.5]">
                  {entry.entryKind} · {entry.agentLabel ?? 'system'} · status {entry.status}
                </div>
                <div className="mt-1 text-neutral-500">
                  origin {entry.origin ?? 'n/a'} · destination {entry.destination ?? 'n/a'}
                </div>
              </div>
            )) : (
              <>
                <div className="grid gap-x-3 gap-y-2 xl:grid-cols-[repeat(6,minmax(130px,1fr))_auto] xl:items-end">
                  <label className="grid gap-1">
                    <span className="ui-label">Document state</span>
                    <select
                      className="ui-input text-xs"
                      value={auditStateFilter}
                      onChange={(event) => setAuditStateFilter(event.target.value)}
                    >
                      <option value="all">All states</option>
                      <option value="Draft">Draft</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Under Review">Under Review</option>
                      <option value="Approved">Approved</option>
                      <option value="Locked">Locked</option>
                    </select>
                  </label>

                  <label className="grid gap-1">
                    <span className="ui-label">Event type</span>
                    <select
                      className="ui-input text-xs"
                      value={auditEventFilter}
                      onChange={(event) => setAuditEventFilter(event.target.value)}
                    >
                      <option value="all">All events</option>
                      {auditEventOptions.map((event) => (
                        <option key={event.value} value={event.value}>
                          {event.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="grid gap-1">
                    <span className="ui-label">Actor</span>
                    <select
                      className="ui-input text-xs"
                      value={auditResponsibleFilter}
                      onChange={(event) => setAuditResponsibleFilter(event.target.value)}
                    >
                      <option value="all">All responsible</option>
                      {auditResponsibleOptions.map((responsible) => (
                        <option key={responsible} value={responsible}>
                          {responsible}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="grid gap-1">
                    <span className="ui-label">Team</span>
                    <select
                      className="ui-input text-xs"
                      value={auditTeamFilter}
                      onChange={(event) => setAuditTeamFilter(event.target.value)}
                    >
                      <option value="all">All teams</option>
                      {auditTeamOptions.map((team) => (
                        <option key={team} value={team}>
                          {team}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="grid gap-1">
                    <span className="ui-label">Document type</span>
                    <select
                      className="ui-input text-xs"
                      value={auditTypeFilter}
                      onChange={(event) => setAuditTypeFilter(event.target.value)}
                    >
                      <option value="all">All document types</option>
                      {auditTypeOptions.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="grid gap-1">
                    <span className="ui-label">Date</span>
                    <input
                      className="ui-input text-xs"
                      type="date"
                      value={auditDateFilter}
                      onChange={(event) => setAuditDateFilter(event.target.value)}
                    />
                  </label>
                  <div className="flex items-end justify-end">
                    <button
                      className="ui-button min-h-8 px-3 text-[11px] text-neutral-700"
                      onClick={() => {
                        setAuditStateFilter('all');
                        setAuditEventFilter('all');
                        setAuditResponsibleFilter('all');
                        setAuditTeamFilter('all');
                        setAuditTypeFilter('all');
                        setAuditDateFilter('');
                      }}
                    >
                      Reset Search
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="ui-surface min-h-0 flex flex-1 flex-col overflow-hidden rounded-[22px] px-4 py-3 sm:px-5">
          <div className="mb-3 flex flex-wrap items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
            <span className="text-neutral-800 normal-case tracking-normal">
              {auditFilteredEntries.length} audit records available from the shared documentary base.
            </span>
            <span className="text-neutral-800 normal-case tracking-normal">
              Trace each document through event, actor, and linked audit context.
            </span>
          </div>
          <div className="grid min-h-0 flex-1 gap-3 overflow-y-auto pr-1">
                {auditFilteredEntries.map((entry) => (
                  <AuditEntryReferenceRow
                    key={entry.id}
                    entry={entry}
                    actions={getAuditEntryActions(entry)}
                  />
                ))}

                {auditFilteredEntries.length === 0 ? (
                  <div className="ui-surface-subtle rounded-[18px] px-4 py-6 text-sm text-neutral-600">
                    No audit records match the current control filters.
                  </div>
                ) : null}
          </div>
        </div>
      </div>
    ) : activeView === 'investigate' ? (
      <div className="flex h-full min-h-0 flex-col gap-3">
        <div className="ui-surface-subtle rounded-[18px] px-3 py-2">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
            <span>Threads: <span className="text-neutral-800 normal-case tracking-normal">{investigateThreads.length}</span></span>
            <span>Timeline Groups: <span className="text-neutral-800 normal-case tracking-normal">{investigateTimelineGroups.length}</span></span>
            <span>Versioned Docs: <span className="text-neutral-800 normal-case tracking-normal">{investigateThreads.filter((thread) => thread.documentVersion && thread.documentVersion !== 'v1').length}</span></span>
            <span>Review Paths: <span className="text-neutral-800 normal-case tracking-normal">{investigateThreads.filter((thread) => thread.documentState === 'Under Review').length}</span></span>
          </div>
        </div>

        <div className="ui-surface rounded-[22px] px-4 py-3 sm:px-5">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,0.95fr)]">
            <div className="grid gap-2">
              <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
                Investigation focus
              </div>
              <div className="text-[13px] font-semibold tracking-[-0.02em] text-neutral-900">
                Study a documentary line by theme, actor, project, or trace context.
              </div>
              <label className="grid gap-1">
                <span className="ui-label">Theme or context</span>
                <input
                  className="ui-input text-xs"
                  type="text"
                  value={investigateThemeQuery}
                  placeholder="Search a topic, actor, project, document, or linked trace..."
                  onChange={(event) => setInvestigateThemeQuery(event.target.value)}
                />
              </label>
              <div className="text-[11px] leading-[1.5] text-neutral-600">
                Use this view to reconstruct an issue across related documents, not just to find one item.
              </div>
            </div>

            <div className="ui-surface-subtle rounded-[18px] px-3 py-3">
              <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
                Investigation context
              </div>
              <div className="mt-2 grid gap-2 text-xs text-neutral-700 sm:grid-cols-2">
                <DetailField
                  label="Focus"
                  value={investigateContextSummary.query || 'All documentary lines'}
                />
                <DetailField
                  label="Related actors"
                  value={String(investigateContextSummary.actorCount)}
                />
                <DetailField
                  label="Related pieces"
                  value={String(investigateContextSummary.threadCount)}
                />
                <DetailField
                  label="Timeline span"
                  value={
                    investigateContextSummary.firstSeen || investigateContextSummary.lastSeen
                      ? `${investigateContextSummary.firstSeen ?? 'n/a'} to ${investigateContextSummary.lastSeen ?? 'n/a'}`
                      : 'No timeline available'
                  }
                />
              </div>
            </div>
          </div>
        </div>

        <div className="ui-surface-subtle rounded-[18px] px-3 py-2">
          <div className="grid gap-2 xl:grid-cols-[repeat(5,minmax(0,1fr))_auto] xl:items-end">
              <label className="grid gap-1">
                <span className="ui-label">Project</span>
                <select
                  className="ui-input text-xs"
                  value={investigateProjectFilter}
                  onChange={(event) => setInvestigateProjectFilter(event.target.value)}
                >
                  <option value="all">All projects</option>
                  {investigateProjectOptions.map((project) => (
                    <option key={project} value={project}>
                      {project}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-1">
                <span className="ui-label">Team</span>
                <select
                  className="ui-input text-xs"
                  value={investigateTeamFilter}
                  onChange={(event) => setInvestigateTeamFilter(event.target.value)}
                >
                  <option value="all">All teams</option>
                  {investigateTeamOptions.map((team) => (
                    <option key={team.value} value={team.value}>
                      {team.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-1">
                <span className="ui-label">Workspace</span>
                <select
                  className="ui-input text-xs"
                  value={investigateWorkspaceFilter}
                  onChange={(event) => setInvestigateWorkspaceFilter(event.target.value)}
                >
                  <option value="all">All workspaces</option>
                  {investigateWorkspaceOptions.map((workspace) => (
                    <option key={workspace} value={workspace}>
                      {workspace}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-1">
                <span className="ui-label">Document type</span>
                <select
                  className="ui-input text-xs"
                  value={investigateKindFilter}
                  onChange={(event) => setInvestigateKindFilter(event.target.value)}
                >
                  <option value="all">All types</option>
                  {investigateKindOptions.map((kind) => (
                    <option key={kind} value={kind}>
                      {kind}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-1">
                <span className="ui-label">Date</span>
                <input
                  className="ui-input text-xs"
                  type="date"
                  value={investigateDateFilter}
                  onChange={(event) => setInvestigateDateFilter(event.target.value)}
                />
              </label>
              <div className="flex items-end justify-end">
                <button
                  className="ui-button min-h-8 px-3 text-[11px] text-neutral-700"
                  onClick={() => {
                    setInvestigateThemeQuery('');
                    setInvestigateProjectFilter('all');
                    setInvestigateTeamFilter('all');
                    setInvestigateWorkspaceFilter('all');
                    setInvestigateKindFilter('all');
                    setInvestigateDateFilter('');
                  }}
                >
                  Reset investigation filters
                </button>
              </div>
          </div>
        </div>

        <div className="ui-surface min-h-0 flex flex-1 flex-col overflow-hidden rounded-[22px] px-4 py-3 sm:px-5">
          <div className="min-h-0 flex-1 overflow-y-auto pr-1">
              {investigateTimelineGroups.map((group) => (
                <div key={group.date} className="grid gap-3">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
                    {group.date === 'n/a'
                      ? `Undated context · ${investigateThreads.length} investigative threads available from the shared documentary base.`
                      : `Timeline block · ${group.date} · ${investigateThreads.length} investigative threads available from the shared documentary base.`}
                  </div>
                  <div className="grid gap-3">
                    {group.threads.map((thread) => (
                      <InvestigationThreadCard
                        key={thread.repositoryItemId}
                        thread={thread}
                        actions={getInvestigateThreadActions(thread)}
                      />
                    ))}
                  </div>
                </div>
              ))}

              {investigateTimelineGroups.length === 0 ? (
                <div className="ui-surface-subtle rounded-[18px] px-4 py-6 text-sm text-neutral-600">
                  No investigative chronology matches the selected context filters.
                </div>
              ) : null}
          </div>
          </div>
        </div>
    ) : (
      <div className="grid h-full min-h-0 gap-3">
        <div className="ui-surface h-full overflow-hidden rounded-[22px] px-4 py-4 sm:px-5">
          <div className="mb-2 grid h-full min-h-0 gap-4 xl:grid-cols-[280px_minmax(0,1fr)] xl:items-stretch">
            <div className="flex min-h-0 flex-col gap-3 xl:max-h-[740px] xl:overflow-y-auto xl:pr-1">
            <div className="grid gap-2 rounded-[20px] border border-neutral-200 bg-white/70 px-3 py-3">
              <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
                Graph Focus Modes
              </div>
              <div className="text-[11px] leading-[1.45] text-neutral-600">
                {knowledgeModeSummary}
              </div>
              <div className="grid gap-2">
                {KNOWLEDGE_FOCUS_MODE_OPTIONS.map((mode) => (
                  <button
                    key={mode.value}
                    className={`ui-button min-h-8 justify-start px-3 text-[11px] ${
                      knowledgeFocusMode === mode.value ? 'ui-button-primary text-white' : 'text-neutral-700'
                    }`}
                    onClick={() => setKnowledgeFocusMode(mode.value)}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid gap-3 rounded-[20px] border border-neutral-200 bg-white/70 px-3 py-3">
              <label className="grid gap-1">
                <span className="ui-label">Project</span>
                <select
                  className="ui-input text-xs"
                  value={knowledgeProjectFilter || 'all'}
                  onChange={(event) => setKnowledgeProjectFilter(event.target.value)}
                >
                  <option value="all">All projects</option>
                  {knowledgeProjectOptions.map((project) => (
                    <option key={project} value={project}>
                      {project}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-1">
                <span className="ui-label">Team</span>
                <select
                  className="ui-input text-xs"
                  value={knowledgeTeamFilter}
                  onChange={(event) => setKnowledgeTeamFilter(event.target.value)}
                >
                  <option value="all">All teams</option>
                  {knowledgeTeamOptions.map((team) => (
                    <option key={team.value} value={team.value}>
                      {team.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-1">
                <span className="ui-label">Workspace</span>
                <select
                  className="ui-input text-xs"
                  value={knowledgeWorkspaceFilter}
                  onChange={(event) => setKnowledgeWorkspaceFilter(event.target.value)}
                >
                  <option value="all">All workspaces</option>
                  {knowledgeWorkspaceOptions.map((workspace) => (
                    <option key={workspace} value={workspace}>
                      {workspace}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-1">
                <span className="ui-label">Document type</span>
                <select
                  className="ui-input text-xs"
                  value={knowledgeTypeFilter}
                  onChange={(event) => setKnowledgeTypeFilter(event.target.value)}
                >
                  <option value="all">All document types</option>
                  {knowledgeTypeOptions.map((kind) => (
                    <option key={kind} value={kind}>
                      {kind}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-1">
                <span className="ui-label">Actor / responsible</span>
                <select
                  className="ui-input text-xs"
                  value={knowledgeActorFilter}
                  onChange={(event) => setKnowledgeActorFilter(event.target.value)}
                >
                  <option value="all">All actors</option>
                  {knowledgeActorOptions.map((actor) => (
                    <option key={actor} value={actor}>
                      {actor}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-1">
                <span className="ui-label">Updated</span>
                <input
                  className="ui-input text-xs"
                  type="date"
                  value={knowledgeDateFilter}
                  onChange={(event) => setKnowledgeDateFilter(event.target.value)}
                />
              </label>

              <button
                className="ui-button min-h-8 px-3 text-[11px] text-neutral-700"
                onClick={() => {
                  setKnowledgeFocusMode('documents');
                  setKnowledgeProjectFilter(selectedRepositoryDocumentProject ?? knowledgeProjectOptions[0] ?? 'all');
                  setKnowledgeTeamFilter('all');
                  setKnowledgeWorkspaceFilter('all');
                  setKnowledgeTypeFilter('all');
                  setKnowledgeActorFilter('all');
                  setKnowledgeDateFilter('');
                }}
              >
                Reset map focus
              </button>
            </div>

            <div className="rounded-[16px] border border-neutral-200 bg-white/75 px-3 py-3">
              <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
                {knowledgeFilteredDocumentNodes.length} docs · {knowledgeGraph.nodes.length} nodes · {knowledgeGraph.edges.length} relations
              </div>
            </div>

            </div>

            <div className="grid min-w-0 min-h-0">
              <KnowledgeMapCanvas
                nodes={knowledgeGraph.nodes}
                edges={knowledgeGraph.edges}
                selectedNode={selectedKnowledgeNode}
                connectionCount={selectedKnowledgeNode ? knowledgeConnectionsByNodeId.get(selectedKnowledgeNode.id) ?? 0 : 0}
                onSelectNode={setSelectedKnowledgeNodeId}
                onOpenDocument={
                  selectedKnowledgeNode?.repositoryItemId
                    ? () => focusRepositoryDocument(selectedKnowledgeNode.repositoryItemId as string, { focusDetail: true })
                    : undefined
                }
                onOpenFile={
                  selectedKnowledgeNode?.repositoryItemId && selectedKnowledgeNode.relatedFileId
                    ? () => openDocumentPage(selectedKnowledgeNode.repositoryItemId as string)
                    : undefined
                }
              />
              <div className="hidden ui-surface min-h-0 rounded-[20px] px-4 py-3">
                {selectedKnowledgeNode ? (
                  <div className="grid gap-3">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="grid gap-1">
                        <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
                          Selected relation context
                        </div>
                        <div className="text-[15px] font-semibold tracking-[-0.02em] text-neutral-900">
                          {selectedKnowledgeNode.label}
                        </div>
                        <div className="text-[11px] leading-[1.45] text-neutral-600">
                          {[selectedKnowledgeNode.projectLabel, selectedKnowledgeNode.teamLabel, selectedKnowledgeNode.workspaceLabel]
                            .filter((value): value is string => Boolean(value))
                            .join(' · ') || selectedKnowledgeNode.description || 'No contextual metadata'}
                        </div>
                      </div>
                      <div className="rounded-full border border-neutral-200 bg-white px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-neutral-600">
                        {selectedKnowledgeNode.nodeType.replace('-', ' ')}
                      </div>
                    </div>

                    <div className="grid gap-2 text-xs text-neutral-700 sm:grid-cols-2 xl:grid-cols-4">
                      <DetailField label="State" value={selectedKnowledgeNode.documentState ?? 'n/a'} />
                      <DetailField label="Version" value={selectedKnowledgeNode.documentVersion ?? 'n/a'} />
                      <DetailField label="User" value={selectedKnowledgeNode.userLabel ?? 'n/a'} />
                      <DetailField label="Responsible" value={selectedKnowledgeNode.lastResponsible ?? 'n/a'} />
                    </div>

                    <div className="grid gap-2 rounded-[16px] border border-neutral-200 bg-white/80 px-3 py-3">
                      <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
                        Visible linked context
                      </div>
                      {selectedKnowledgeRelations.length > 0 ? (
                        <div className="grid gap-2">
                          {selectedKnowledgeRelations.map(({ edge, relatedNode }) => (
                            <div
                              key={edge.id}
                              className="flex flex-wrap items-center justify-between gap-2 rounded-[12px] border border-neutral-200 bg-white px-3 py-2"
                            >
                              <div className="grid gap-0.5">
                                <div className="text-xs font-semibold text-neutral-900">
                                  {relatedNode?.label}
                                </div>
                                <div className="text-[11px] leading-[1.45] text-neutral-600">
                                  {edge.label} · {relatedNode?.nodeType.replace('-', ' ')}
                                </div>
                              </div>
                              <button
                                className="ui-button min-h-7 px-2.5 text-[10px] text-neutral-700"
                                onClick={() => relatedNode && setSelectedKnowledgeNodeId(relatedNode.id)}
                              >
                                Focus node
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-xs text-neutral-600">
                          No linked nodes are visible in the current filtered slice.
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {getKnowledgeNodeActions(selectedKnowledgeNode).map((action) => (
                        <button
                          key={action.key}
                          className={`ui-button min-h-8 px-3 text-[11px] ${
                            action.primary ? 'ui-button-primary text-white' : 'text-neutral-700'
                          }`}
                          onClick={action.onClick}
                        >
                          {action.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-neutral-600">
                    Select a node to inspect its documentary relations and open linked pieces.
                  </div>
                )}
              </div>
            </div>

            {knowledgeGraph.nodes.length === 0 ? (
              <div className="ui-surface-subtle rounded-[18px] px-4 py-6 text-sm text-neutral-600">
                No knowledge map slice matches the selected context filters.
              </div>
            ) : null}
          </div>
        </div>
      </div>
    );

  const documentationContent = (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-[var(--color-surface-soft)]">
      <div className="px-2 pb-1.5 pt-1.5 sm:px-3 sm:pt-2">
        <div className="ui-surface px-3 py-2 sm:px-4 sm:py-2">
          <div className="grid gap-2 xl:grid-cols-[minmax(220px,1fr)_auto_minmax(220px,1fr)] xl:items-start">
            <div className="min-w-0">
              <div className="text-center text-sm font-semibold tracking-[0.14em] text-neutral-900 sm:text-left">
                DOCUMENTATION MODE
              </div>
              <div className="mt-0.5 text-[10px] leading-[1.3] text-neutral-500">
                Multiple production views over one shared documentary base.
              </div>
            </div>

            <div className="flex flex-wrap items-start justify-center self-center justify-self-center gap-x-3 gap-y-2 xl:pt-0.5">
              {documentationModel.views.map((view) => {
                const isActive = view.mode === activeView;
                const helpLink =
                  DOCUMENTATION_HELP_LINKS.find((link) => link.id === view.mode) ??
                  (view.mode === 'knowledge-map'
                    ? DOCUMENTATION_HELP_LINKS.find((link) => link.id === 'knowledge-map')
                    : null);
                return (
                  <div key={view.mode} className="grid min-w-max justify-items-center gap-1">
                    <button
                      className={`ui-button min-h-7 w-full px-3 text-[10px] ${
                        isActive ? 'ui-button-primary text-white' : 'text-neutral-700'
                      }`}
                      onClick={() => setActiveView(view.mode)}
                    >
                      {getDocumentationViewLabel(view.mode)}
                    </button>
                    {helpLink ? (
                      <button
                        className="w-full text-center text-[10px] font-normal text-[var(--color-accent-strong)] underline underline-offset-2 transition-colors hover:text-[var(--color-accent)]"
                        onClick={() => setActiveHelpTopic(helpLink.id)}
                      >
                        {helpLink.label}
                      </button>
                    ) : null}
                  </div>
                );
              })}
            </div>

            <div className="grid gap-1 justify-items-center xl:justify-items-end xl:justify-self-end">
              <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-center xl:justify-end xl:text-right">
                <button
                  className="text-[10px] font-normal text-neutral-500 underline-offset-2 transition-colors hover:text-neutral-900 hover:underline"
                  onClick={() => setShowManifestView(true)}
                >
                  (Manif.)
                </button>
                <a
                  className="text-[10px] font-normal text-neutral-500 underline-offset-2 transition-colors hover:text-neutral-900 hover:underline"
                  href="/landing/aisync-landing.html"
                  target="_blank"
                  rel="noreferrer"
                >
                  Landing
                </a>
                {activeView === 'audit' ? (
                  <button
                    className="text-[10px] font-normal text-neutral-400 underline-offset-2 transition-colors hover:text-neutral-700 hover:underline"
                    onClick={() => setShowAuditManifestView(true)}
                  >
                    Audit manif.
                  </button>
                ) : null}
              </div>
              <button
                className="ui-button ui-button-primary min-h-8 px-3 text-[11px] text-white justify-self-center xl:justify-self-center"
                onClick={() => setShowNewProjectModal(true)}
              >
                + new project
              </button>
            </div>
          </div>

          {activeView === 'structure' ? (
            <div className="mt-2 ui-surface-subtle rounded-[16px] px-3 py-1.5">
              <div className="flex flex-wrap items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
                <span>{activeViewDefinition?.productRole === 'primary' ? 'Primary production view' : activeViewDefinition?.productRole === 'secondary' ? 'Secondary analytical view' : 'Supporting production view'}</span>
                <span className="text-neutral-300">|</span>
                <span>{activeViewDefinition?.label ?? getDocumentationViewLabel(activeView)}</span>
              </div>
              <div className="mt-1 text-xs leading-[1.35] text-neutral-700">
                {activeViewDefinition?.description ?? getDocumentationViewDescription(activeView)}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <div
        className={`scrollbar-thin flex-1 px-2 pb-3 sm:px-3 sm:pb-4 ${
          activeView === 'repository' || activeView === 'audit' || activeView === 'investigate'
            ? 'overflow-hidden'
            : 'overflow-y-auto'
        }`}
        style={{ minHeight: 0 }}
      >
        {documentationViewContent}
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
            <AgentPanel
              agent="manager"
              managerDisplayName={subManagerLabel}
              selectionScope="page-b:manager"
              panelScope="page-b:manager"
              sourceWorkspace="documentation-mode"
            />
          </div>
        )}

        <div className="app-frame app-short-landscape-flex flex min-h-0 flex-1 overflow-hidden sm:hidden">
          {documentationContent}
        </div>

        <div className="app-frame app-short-landscape-hide hidden min-h-0 flex-1 overflow-hidden sm:flex">
          <CollapsibleManagerSidebar
            managerDisplayName={subManagerLabel}
            className="w-[280px] shrink-0 md:w-[320px] lg:w-[432px]"
            storageKey="aisync_sm_sidebar_page_b"
            selectionScope="page-b:manager"
            panelScope="page-b:manager"
          />
          {documentationContent}
        </div>
      </div>

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
              {DOCUMENTATION_MODE_MANIFEST_EN}
            </pre>
          </div>
        </Modal>
      )}

      {activeHelpTopic && (
        <Modal
          title={DOCUMENTATION_HELP_LINKS.find((link) => link.id === activeHelpTopic)?.modalTitle ?? 'How to use Documentation Mode'}
          onClose={() => setActiveHelpTopic(null)}
          width="max-w-3xl"
        >
          <div className="max-h-[72vh] overflow-y-auto pr-1">
            <div className="mb-3 text-[11px] uppercase tracking-[0.16em] text-neutral-500">
              Operational guidance
            </div>
            <DocumentationHelpContent topic={activeHelpTopic} />
          </div>
        </Modal>
      )}

      {showAuditManifestView && (
        <Modal title="Audit manif." onClose={() => setShowAuditManifestView(false)} width="max-w-2xl">
          <div className="grid gap-4">
            <div className="text-[11px] uppercase tracking-[0.16em] text-neutral-500">
              Audit View logic
            </div>
            <div className="grid gap-3 text-sm leading-6 text-neutral-800">
              <p>
                Audit View is the operational traceability view of Documentation Mode.
              </p>
              <p>
                It is not designed to find files like Repository View, nor to investigate a thematic
                sequence like Investigate View. It is designed to answer this question: what
                happened, to which document, when, and with which responsible actor or operational
                linkage.
              </p>
              <div className="grid gap-1">
                <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
                  What it actually shows
                </div>
                <p>
                  Audit View does not show only documents. It shows auditable records. Each record
                  combines two things: a real document or documentary item, and an auditable event
                  associated with that document. In other words, you do not simply see the file. You
                  see the file plus the relevant fact that happened to it.
                </p>
              </div>
              <div className="grid gap-1">
                <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
                  Event logic
                </div>
                <p>
                  Audit View is intentionally oriented to minimal, legible, useful events rather than
                  raw technical logs. The correct events are things like Created / first indexed,
                  Updated, State changed, Locked, and Version advanced. It should not invent events
                  that the base cannot support with real evidence. If there is no real traceability
                  for something like a responsibility change, that history should not be faked.
                </p>
              </div>
              <div className="grid gap-1">
                <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
                  What it helps answer
                </div>
                <p>
                  Audit View helps answer things like which document was locked, which one changed
                  state, which piece was updated, which version advanced, who appears as responsible,
                  which workspace it comes from, which time reference it carries, and how it links to
                  the rest of the system.
                </p>
                <p>
                  In simple terms: Repository View = what exists. Audit View = what happened.
                  Investigate View = how it evolved.
                </p>
              </div>
              <div className="grid gap-1">
                <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
                  Page structure
                </div>
                <p>
                  Audit View is usually organized from top to bottom as a compact indicator line, a
                  filter block, and then the main list of auditable records. The indicator line gives
                  a quick reading of the visible slice. The filters help isolate only what is locked,
                  approved, touched by a certain actor, or tied to a certain time reference. The main
                  list is the core of the page, and each row should represent a specific auditable
                  case.
                </p>
              </div>
              <div className="grid gap-1">
                <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
                  What a record contains
                </div>
                <p>
                  A well-read Audit View record should show the document name, project, team,
                  document class or type, document state, version, USER, Responsible, Reference
                  Time, Source Workspace, Audit Linkage, and Path, together with navigation actions
                  such as View Details and Open Document. That allows the user to move from
                  traceability back into real operation.
                </p>
              </div>
              <div className="grid gap-1">
                <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
                  What it is not
                </div>
                <p>
                  Audit View is not a folder explorer, not the main document browser, not a deep
                  thematic timeline, not a raw technical log for developers, and not a database table
                  exposed to the user. It should feel like a readable operational trail.
                </p>
              </div>
              <div className="grid gap-1">
                <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
                  Product value
                </div>
                <p>
                  Audit View matters because it lands one of AISync&apos;s central promises: not only
                  producing with AI, but being able to reconstruct the process with control and
                  operational memory. It does not stop at saying “here is the document.” It says:
                  “here is the document, this was its state, this was the relevant event, this was
                  the responsible actor, and from here you can return to the repository or the real
                  file.”
                </p>
              </div>
              <p className="font-medium text-neutral-900">
                Audit View is the layer that turns documents into traceable operational evidence.
              </p>
            </div>
          </div>
        </Modal>
      )}

      {toast && <Toast message={toast} onClose={() => setToast('')} />}
    </div>
  );
}

function DocumentationStatCard({
  label,
  value,
  meta,
}: {
  label: string;
  value: string;
  meta: string;
}) {
  return (
    <div className="ui-surface-subtle rounded-[18px] px-4 py-4">
      <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
        {label}
      </div>
      <div className="mt-2 text-[22px] font-semibold tracking-[-0.03em] text-neutral-900">{value}</div>
      <div className="mt-1 text-xs leading-[1.45] text-neutral-600">{meta}</div>
    </div>
  );
}

function DocumentListRowIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      className="h-4 w-4 flex-none text-neutral-500"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 2.75h5.25L15.5 7v10.25a1 1 0 0 1-1 1h-8a1 1 0 0 1-1-1v-13.5a1 1 0 0 1 1-1Z" />
      <path d="M11 2.75V7h4.5" />
      <path d="M7.5 10.25h5" />
      <path d="M7.5 13h5" />
    </svg>
  );
}

function InvestigationThreadCard({
  thread,
  actions,
}: {
  thread: InvestigationThread;
  actions: RepositoryAction[];
}) {
  const visibleChronology = [...thread.chronology].slice(-4).reverse();
  const chronologySummary = visibleChronology
    .map((entry) => `${entry.eventLabel} · ${entry.occurredAt ?? 'n/a'}`)
    .join('  ·  ');

  return (
    <div className="rounded-[14px] border border-neutral-200 bg-white/80 px-3 py-2.5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-start gap-2">
            <DocumentListRowIcon />
            <div className="truncate text-[13px] font-semibold text-neutral-900">{thread.title}</div>
          </div>
          <div className="mt-1 text-xs leading-[1.5] text-neutral-600">
            {thread.projectLabel ?? 'No project'} · {thread.teamLabel} · {thread.sourceWorkspace}
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
          {thread.documentState ? (
            <div
              className={`rounded-full border px-2 py-1 text-[10px] font-semibold tracking-[0.08em] ${getDocumentStateClasses(
                thread.documentState,
              )}`}
            >
              {thread.documentState}
            </div>
          ) : null}
          {thread.documentVersion ? (
            <div className="rounded-full border border-neutral-200 bg-white px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-neutral-600">
              {thread.documentVersion}
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-2 grid gap-2 text-xs text-neutral-700 sm:grid-cols-2 xl:grid-cols-4">
        <DetailField label="User" value={thread.userLabel ?? 'n/a'} />
        <DetailField label="Last Responsible" value={thread.lastResponsible ?? 'n/a'} />
        <DetailField label="Document Type" value={thread.documentKind ?? 'n/a'} />
        <DetailField label="Latest Reference" value={thread.lastSeen ?? 'n/a'} />
      </div>

      <div className="mt-2 grid gap-2 rounded-[14px] border border-neutral-200 bg-white px-3 py-3 text-xs text-neutral-700 sm:grid-cols-3">
        <DetailField label="Investigation Lens" value={thread.projectLabel ?? thread.teamLabel} />
        <DetailField
          label="Related Actors"
          value={thread.relatedActors.length > 0 ? thread.relatedActors.slice(0, 3).join(', ') : 'No named actors'}
        />
        <DetailField
          label="Timeline Range"
          value={`${thread.firstSeen ?? 'n/a'} to ${thread.lastSeen ?? 'n/a'}`}
        />
      </div>

      <div className="mt-2 grid gap-2">
        <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
          Investigative sequence
        </div>
        {visibleChronology.map((entry) => (
          <div key={entry.id} className="rounded-[14px] border border-neutral-200 bg-white px-3 py-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-xs font-semibold text-neutral-900">{entry.eventLabel}</div>
              <div className="text-[11px] text-neutral-500">{entry.occurredAt ?? 'n/a'}</div>
            </div>
            <div className="mt-1 text-[11px] leading-[1.5] text-neutral-600">
              {entry.documentState ?? 'n/a'} · {entry.documentVersion ?? 'n/a'} ·{' '}
              {entry.responsibleLabel ?? thread.lastResponsible ?? 'n/a'}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-2 flex flex-wrap gap-2">
        {actions.map((action) => (
          <button
            key={action.key}
            className={`ui-button min-h-8 px-3 text-[11px] ${
              action.primary ? 'ui-button-primary text-white' : 'text-neutral-700'
            }`}
            onClick={action.onClick}
          >
            {action.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function getKnowledgeNodeClasses(nodeType: KnowledgeGraphNode['nodeType']) {
  if (nodeType === 'document') return 'fill-slate-100 stroke-slate-100';
  if (nodeType === 'project') return 'fill-sky-300 stroke-sky-200';
  if (nodeType === 'team') return 'fill-amber-300 stroke-amber-200';
  if (nodeType === 'workspace') return 'fill-emerald-300 stroke-emerald-200';
  if (nodeType === 'user') return 'fill-rose-300 stroke-rose-200';
  if (nodeType === 'folder') return 'fill-stone-300 stroke-stone-200';
  if (nodeType === 'saved-file') return 'fill-cyan-300 stroke-cyan-200';
  return 'fill-violet-300 stroke-violet-200';
}

function getKnowledgeEdgeStroke(edgeType: DocumentationKnowledgeEdge['edgeType']) {
  if (edgeType === 'belongs-to') return '#94a3b8';
  if (edgeType === 'linked-to-team') return '#f59e0b';
  if (edgeType === 'created-in') return '#14b8a6';
  return '#c084fc';
}

function getKnowledgeNodeMeta(node: KnowledgeGraphNode) {
  if (node.nodeType === 'document' || node.nodeType === 'saved-file') {
    return `${node.documentState ?? 'n/a'} · ${node.documentVersion ?? 'n/a'}`;
  }
  if (node.nodeType === 'project') return 'Project context';
  if (node.nodeType === 'team') return 'Team context';
  if (node.nodeType === 'workspace') return 'Workspace context';
  if (node.nodeType === 'user') return 'Accountability lens';
  if (node.nodeType === 'folder') return 'Folder container';
  return 'Document type';
}

function getKnowledgeLabelOpacity(scale: number) {
  const faded = 1 + (scale - KNOWLEDGE_GRAPH_TARGET.scale) * KNOWLEDGE_GRAPH_TARGET.textFadeMultiplier;
  return Math.max(0.62, Math.min(1, faded));
}

function getKnowledgeNodeJitter(seed: string) {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) >>> 0;
  }

  return {
    x: (hash % 27) - 13,
    y: ((Math.floor(hash / 27) % 23) - 11),
  };
}

function relaxKnowledgeGraphLayout({
  nodes,
  edges,
  positions,
  width,
  height,
}: {
  nodes: KnowledgeGraphNode[];
  edges: DocumentationKnowledgeEdge[];
  positions: Map<string, { x: number; y: number }>;
  width: number;
  height: number;
}) {
  const working = new Map<string, { x: number; y: number }>();
  positions.forEach((position, id) => {
    working.set(id, { ...position });
  });

  const centerX = width / 2;
  const centerY = height / 2;

  for (let iteration = 0; iteration < 40; iteration += 1) {
    const nextForces = new Map<string, { x: number; y: number }>();
    nodes.forEach((node) => nextForces.set(node.id, { x: 0, y: 0 }));

    for (let index = 0; index < nodes.length; index += 1) {
      const left = nodes[index];
      const leftPosition = working.get(left.id);
      if (!leftPosition) continue;

      for (let inner = index + 1; inner < nodes.length; inner += 1) {
        const right = nodes[inner];
        const rightPosition = working.get(right.id);
        if (!rightPosition) continue;

        const dx = leftPosition.x - rightPosition.x;
        const dy = leftPosition.y - rightPosition.y;
        const distance = Math.max(18, Math.hypot(dx, dy));
        const repelForce = KNOWLEDGE_GRAPH_TARGET.repelStrength / distance;
        const normalizedX = dx / distance;
        const normalizedY = dy / distance;
        const leftForce = nextForces.get(left.id);
        const rightForce = nextForces.get(right.id);
        if (!leftForce || !rightForce) continue;
        leftForce.x += normalizedX * repelForce;
        leftForce.y += normalizedY * repelForce;
        rightForce.x -= normalizedX * repelForce;
        rightForce.y -= normalizedY * repelForce;
      }
    }

    edges.forEach((edge) => {
      const source = working.get(edge.sourceId);
      const target = working.get(edge.targetId);
      if (!source || !target) return;

      const dx = target.x - source.x;
      const dy = target.y - source.y;
      const distance = Math.max(1, Math.hypot(dx, dy));
      const delta = distance - KNOWLEDGE_GRAPH_TARGET.linkDistance;
      const pull = delta * KNOWLEDGE_GRAPH_TARGET.linkStrength * 0.01;
      const normalizedX = dx / distance;
      const normalizedY = dy / distance;
      const sourceForce = nextForces.get(edge.sourceId);
      const targetForce = nextForces.get(edge.targetId);
      if (!sourceForce || !targetForce) return;
      sourceForce.x += normalizedX * pull;
      sourceForce.y += normalizedY * pull;
      targetForce.x -= normalizedX * pull;
      targetForce.y -= normalizedY * pull;
    });

    nodes.forEach((node) => {
      const position = working.get(node.id);
      const force = nextForces.get(node.id);
      if (!position || !force) return;

      force.x += (centerX - position.x) * KNOWLEDGE_GRAPH_TARGET.centerStrength * 0.01;
      force.y += (centerY - position.y) * KNOWLEDGE_GRAPH_TARGET.centerStrength * 0.01;

      position.x = Math.min(width - 52, Math.max(52, position.x + force.x));
      position.y = Math.min(height - 52, Math.max(52, position.y + force.y));
    });
  }

  return working;
}

function getKnowledgeNodeRadius(node: KnowledgeGraphNode) {
  const baseRadius = node.nodeType === 'document' || node.nodeType === 'saved-file' ? 3 : 2;
  return baseRadius * KNOWLEDGE_GRAPH_TARGET.nodeSizeMultiplier;
}

function getKnowledgeGraphBounds(nodes: KnowledgeGraphNode[], positions: Map<string, { x: number; y: number }>) {
  if (nodes.length === 0) {
    return null;
  }

  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;

  nodes.forEach((node) => {
    const position = positions.get(node.id);
    if (!position) {
      return;
    }

    const radius = getKnowledgeNodeRadius(node);
    const label = node.label.length > 22 ? `${node.label.slice(0, 22)}...` : node.label;
    const meta = getKnowledgeNodeMeta(node);
    const labelHalfWidth = Math.max(radius, label.length * 2.8);
    const metaHalfWidth = Math.max(radius, meta.length * 1.7);

    minX = Math.min(minX, position.x - Math.max(labelHalfWidth, metaHalfWidth) - radius);
    maxX = Math.max(maxX, position.x + Math.max(labelHalfWidth, metaHalfWidth) + radius);
    minY = Math.min(minY, position.y - radius - 12);
    maxY = Math.max(maxY, position.y + radius + 28);
  });

  if (!Number.isFinite(minX) || !Number.isFinite(minY) || !Number.isFinite(maxX) || !Number.isFinite(maxY)) {
    return null;
  }

  return { minX, minY, maxX, maxY };
}

function getKnowledgeViewportFit({
  bounds,
  viewportWidth,
  viewportHeight,
}: {
  bounds: { minX: number; minY: number; maxX: number; maxY: number };
  viewportWidth: number;
  viewportHeight: number;
}) {
  const paddingX = 48;
  const paddingTop = 56;
  const paddingBottom = 68;
  const paddedWidth = Math.max(1, viewportWidth - paddingX * 2);
  const paddedHeight = Math.max(1, viewportHeight - paddingTop - paddingBottom);
  const graphWidth = Math.max(1, bounds.maxX - bounds.minX);
  const graphHeight = Math.max(1, bounds.maxY - bounds.minY);
  const scale = Math.min(1.8, Math.max(0.35, Math.min(paddedWidth / graphWidth, paddedHeight / graphHeight)));
  const offsetX = paddingX + (paddedWidth - graphWidth * scale) / 2 - bounds.minX * scale;
  const offsetY = paddingTop + (paddedHeight - graphHeight * scale) / 2 - bounds.minY * scale;

  return { scale, offsetX, offsetY };
}

function fitKnowledgeGraphPositions({
  nodes,
  positions,
  viewportWidth,
  viewportHeight,
}: {
  nodes: KnowledgeGraphNode[];
  positions: Map<string, { x: number; y: number }>;
  viewportWidth: number;
  viewportHeight: number;
}) {
  const bounds = getKnowledgeGraphBounds(nodes, positions);
  if (!bounds || viewportWidth <= 0 || viewportHeight <= 0) {
    return positions;
  }

  const margin = Math.max(26, Math.min(52, Math.floor(Math.min(viewportWidth, viewportHeight) * 0.08)));
  const availableWidth = Math.max(1, viewportWidth - margin * 2);
  const availableHeight = Math.max(1, viewportHeight - margin * 2);
  const graphWidth = Math.max(1, bounds.maxX - bounds.minX);
  const graphHeight = Math.max(1, bounds.maxY - bounds.minY);
  const scaleX = availableWidth / graphWidth;
  const scaleY = availableHeight / graphHeight;

  const next = new Map<string, { x: number; y: number }>();
  positions.forEach((position, id) => {
    next.set(id, {
      x: margin + (position.x - bounds.minX) * scaleX,
      y: margin + (position.y - bounds.minY) * scaleY,
    });
  });

  return next;
}

function KnowledgeMapCanvas({
  nodes,
  edges,
  selectedNode,
  connectionCount,
  onSelectNode,
  onOpenDocument,
  onOpenFile,
}: {
  nodes: KnowledgeGraphNode[];
  edges: DocumentationKnowledgeEdge[];
  selectedNode: KnowledgeGraphNode | null;
  connectionCount: number;
  onSelectNode: (nodeId: string) => void;
  onOpenDocument?: () => void;
  onOpenFile?: () => void;
}) {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });
  const pointerStateRef = useRef<
    | { mode: 'pan'; pointerId: number; startX: number; startY: number; originX: number; originY: number }
    | {
        mode: 'drag-node';
        pointerId: number;
        nodeId: string;
        startClientX: number;
        startClientY: number;
        startNodeX: number;
        startNodeY: number;
      }
    | null
  >(null);
  const baseLayout = useMemo(() => {
    const orderedTypes: KnowledgeGraphNode['nodeType'][] = [
      'workspace',
      'project',
      'team',
      'user',
      'folder',
      'document-type',
      'saved-file',
      'document',
    ];
    const positions = new Map<string, { x: number; y: number }>();
    let maxRows = 1;

    orderedTypes.forEach((nodeType, columnIndex) => {
      const columnNodes = nodes
        .filter((node) => node.nodeType === nodeType)
        .sort((left, right) => {
          if (nodeType === 'document') {
            return (right.updatedAt ?? '').localeCompare(left.updatedAt ?? '') || left.label.localeCompare(right.label);
          }
          return left.label.localeCompare(right.label);
        });

      maxRows = Math.max(maxRows, columnNodes.length);
      columnNodes.forEach((node, rowIndex) => {
        const jitter = getKnowledgeNodeJitter(node.id);
        const verticalWave = ((rowIndex + columnIndex) % 2 === 0 ? -1 : 1) * 5;
        positions.set(node.id, {
          x: 96 + columnIndex * 132 + jitter.x * 0.38,
          y: 92 + rowIndex * 70 + verticalWave + jitter.y * 0.42,
        });
      });
    });

    return {
      positions,
      width: 1000,
      height: Math.max(500, maxRows * 70 + 150),
    };
  }, [nodes]);
  const forceLayout = useMemo(() => {
    const relaxed = relaxKnowledgeGraphLayout({
      nodes,
      edges,
      positions: baseLayout.positions,
      width: baseLayout.width,
      height: baseLayout.height,
    });
    const blended = new Map<string, { x: number; y: number }>();
    baseLayout.positions.forEach((seed, id) => {
      const resolved = relaxed.get(id) ?? seed;
      blended.set(id, {
        x: seed.x * 0.74 + resolved.x * 0.26,
        y: seed.y * 0.78 + resolved.y * 0.22,
      });
    });
    return blended;
  }, [baseLayout.height, baseLayout.positions, baseLayout.width, edges, nodes]);
  const canvasFrameWidth = viewportSize.width > 0 ? viewportSize.width : baseLayout.width;
  const canvasFrameHeight = viewportSize.height > 0 ? viewportSize.height : baseLayout.height;
  const autoFitLayout = useMemo(
    () =>
      fitKnowledgeGraphPositions({
        nodes,
        positions: forceLayout,
        viewportWidth: canvasFrameWidth,
        viewportHeight: canvasFrameHeight,
      }),
    [canvasFrameHeight, canvasFrameWidth, forceLayout, nodes],
  );
  const [nodePositions, setNodePositions] = useState<Map<string, { x: number; y: number }>>(
    () => new Map(forceLayout),
  );
  const [viewport, setViewport] = useState<{ scale: number; offsetX: number; offsetY: number }>({
    scale: 1,
    offsetX: 0,
    offsetY: 0,
  });
  const selectedNodeId = selectedNode?.id ?? null;
  const connectedNodeIds = useMemo(() => {
    const connected = new Set<string>();
    if (!selectedNodeId) {
      return connected;
    }

    connected.add(selectedNodeId);
    edges.forEach((edge) => {
      if (edge.sourceId === selectedNodeId) {
        connected.add(edge.targetId);
      }
      if (edge.targetId === selectedNodeId) {
        connected.add(edge.sourceId);
      }
    });
    return connected;
  }, [edges, selectedNodeId]);

  useEffect(() => {
    const container = viewportRef.current;
    if (!container) {
      return;
    }

    const updateViewportSize = () => {
      setViewportSize({
        width: container.clientWidth,
        height: container.clientHeight,
      });
    };

    updateViewportSize();
    const observer = new ResizeObserver(() => {
      updateViewportSize();
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    setNodePositions(() => {
      const next = new Map<string, { x: number; y: number }>();
      autoFitLayout.forEach((position, id) => {
        next.set(id, position);
      });
      return next;
    });
      setViewport({ scale: 1, offsetX: 0, offsetY: 0 });
  }, [autoFitLayout]);

  const handleWheel = (event: ReactWheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    const container = viewportRef.current;
    if (!container) {
      return;
    }

    const bounds = container.getBoundingClientRect();
    const cursorX = event.clientX - bounds.left;
    const cursorY = event.clientY - bounds.top;
    const zoomDelta = event.deltaY > 0 ? -0.08 : 0.08;

    setViewport((current) => {
      const nextScale = Math.min(2.2, Math.max(0.35, Number((current.scale + zoomDelta).toFixed(2))));
      if (nextScale === current.scale) {
        return current;
      }

      const worldX = (cursorX - current.offsetX) / current.scale;
      const worldY = (cursorY - current.offsetY) / current.scale;

      return {
        scale: nextScale,
        offsetX: cursorX - worldX * nextScale,
        offsetY: cursorY - worldY * nextScale,
      };
    });
  };

  const handleViewportPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 && event.button !== 1) {
      return;
    }

    event.preventDefault();
    const target = event.target as HTMLElement;
    if (target.closest('[data-knowledge-node="true"]') || target.closest('[data-knowledge-map-action="true"]')) {
      return;
    }

    pointerStateRef.current = {
      mode: 'pan',
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: viewport.offsetX,
      originY: viewport.offsetY,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleViewportPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const pointerState = pointerStateRef.current;
    if (!pointerState || pointerState.pointerId !== event.pointerId) {
      return;
    }

    if (pointerState.mode === 'pan') {
      setViewport((current) => ({
        ...current,
        offsetX: pointerState.originX + (event.clientX - pointerState.startX),
        offsetY: pointerState.originY + (event.clientY - pointerState.startY),
      }));
      return;
    }

    setNodePositions((current) => {
      const next = new Map(current);
      next.set(pointerState.nodeId, {
        x: pointerState.startNodeX + (event.clientX - pointerState.startClientX) / viewport.scale,
        y: pointerState.startNodeY + (event.clientY - pointerState.startClientY) / viewport.scale,
      });
      return next;
    });
  };

  const clearPointerState = (event: ReactPointerEvent<HTMLDivElement>) => {
    const pointerState = pointerStateRef.current;
    if (!pointerState || pointerState.pointerId !== event.pointerId) {
      return;
    }

    pointerStateRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const handleNodePointerDown = (event: ReactPointerEvent<SVGGElement>, node: KnowledgeGraphNode) => {
    if (event.button !== 0) {
      return;
    }

    event.stopPropagation();
    onSelectNode(node.id);
    const position = nodePositions.get(node.id) ?? forceLayout.get(node.id) ?? baseLayout.positions.get(node.id);
    if (!position) {
      return;
    }

    pointerStateRef.current = {
      mode: 'drag-node',
      pointerId: event.pointerId,
      nodeId: node.id,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startNodeX: position.x,
      startNodeY: position.y,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  return (
    <div
      ref={viewportRef}
      className="ui-surface-subtle relative h-full min-h-[clamp(520px,62vh,680px)] overflow-hidden rounded-[22px] bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.12),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(168,85,247,0.12),transparent_24%),linear-gradient(180deg,#0f172a_0%,#111827_100%)] px-1.5 py-1.5"
      onWheel={handleWheel}
      onPointerDown={handleViewportPointerDown}
      onPointerMove={handleViewportPointerMove}
      onPointerUp={clearPointerState}
      onPointerCancel={clearPointerState}
      onPointerLeave={clearPointerState}
    >
      <div className="pointer-events-none absolute inset-x-3 top-3 z-10 flex items-start justify-between gap-3">
        <div className="max-w-[340px] rounded-full border border-slate-700/70 bg-slate-950/58 px-2.5 py-1.5 text-[10px] leading-[1.35] text-slate-300 shadow-sm backdrop-blur">
          Wheel zoom · drag space to pan · drag node to reposition
        </div>
        <div className="rounded-full border border-slate-700/70 bg-slate-950/58 px-2.5 py-1.5 text-[10px] font-medium text-slate-300 shadow-sm backdrop-blur">
          Scale {viewport.scale.toFixed(2)}x
        </div>
      </div>

      <div className="hidden pointer-events-none absolute bottom-3 left-3 z-10 max-w-[320px] rounded-[16px] border border-slate-700/70 bg-slate-950/74 px-3 py-2 shadow-sm backdrop-blur">
        {selectedNode ? (
          <div className="grid gap-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-slate-700 bg-slate-900/80 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-300">
                {selectedNode.nodeType.replace('-', ' ')}
              </span>
              <span className="text-[11px] text-slate-400">{connectionCount} visible connection(s)</span>
            </div>
            <div className="text-[13px] font-semibold text-slate-100">{selectedNode.label}</div>
            <div className="text-[11px] leading-[1.45] text-slate-300">
              {[selectedNode.projectLabel, selectedNode.teamLabel, selectedNode.workspaceLabel]
                .filter((value): value is string => Boolean(value))
                .join(' · ') || selectedNode.description || 'No contextual metadata'}
            </div>
            <div className="flex flex-wrap gap-x-2 gap-y-1 text-[10px] text-slate-300">
              {selectedNode.documentState ? <span>State: {selectedNode.documentState}</span> : null}
              {selectedNode.documentVersion ? <span>Version: {selectedNode.documentVersion}</span> : null}
              {selectedNode.userLabel ? <span>USER: {selectedNode.userLabel}</span> : null}
              {selectedNode.lastResponsible ? <span>Responsible: {selectedNode.lastResponsible}</span> : null}
            </div>
            <div className="pointer-events-auto flex flex-wrap gap-2 pt-0.5">
              {onOpenDocument ? (
                <button
                  data-knowledge-map-action="true"
                  className="ui-button min-h-7 px-2.5 text-[10px] text-neutral-700"
                  onClick={onOpenDocument}
                >
                  View Details
                </button>
              ) : null}
              {onOpenFile ? (
                <button
                  data-knowledge-map-action="true"
                  className="ui-button ui-button-primary min-h-7 px-2.5 text-[10px] text-white"
                  onClick={onOpenFile}
                >
                  Open Document
                </button>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="text-xs text-slate-300">Select a node to inspect its documentary context.</div>
        )}
      </div>

      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${canvasFrameWidth} ${canvasFrameHeight}`}
        className="h-full min-h-[clamp(518px,62vh,678px)] w-full"
      >
        <g transform={`translate(${viewport.offsetX} ${viewport.offsetY}) scale(${viewport.scale})`}>
          {edges.map((edge) => {
            const source = nodePositions.get(edge.sourceId);
            const target = nodePositions.get(edge.targetId);
            if (!source || !target) {
              return null;
            }
            const isConnectedToSelection =
              selectedNodeId !== null &&
              (edge.sourceId === selectedNodeId || edge.targetId === selectedNodeId);
            return (
              <g key={edge.id}>
                <line
                  x1={source.x}
                  y1={source.y}
                  x2={target.x}
                  y2={target.y}
                  stroke={getKnowledgeEdgeStroke(edge.edgeType)}
                  strokeWidth={
                    KNOWLEDGE_GRAPH_TARGET.lineSizeMultiplier * (isConnectedToSelection ? 1.55 : 1)
                  }
                  opacity={
                    selectedNodeId ? (isConnectedToSelection ? 0.82 : 0.14) : 0.42
                  }
                />
                <text
                  x={(source.x + target.x) / 2}
                  y={(source.y + target.y) / 2 - 6}
                  textAnchor="middle"
                  className="fill-slate-400 text-[8px] uppercase tracking-[0.12em]"
                  opacity={
                    selectedNodeId
                      ? isConnectedToSelection
                        ? Math.max(0.56, getKnowledgeLabelOpacity(viewport.scale) - 0.08)
                        : 0.16
                      : Math.max(0.44, getKnowledgeLabelOpacity(viewport.scale) - 0.18)
                  }
                >
                  {edge.label}
                </text>
              </g>
            );
          })}

          {nodes.map((node) => {
            const position = nodePositions.get(node.id);
            if (!position) {
              return null;
            }
            const isSelected = node.id === selectedNodeId;
            const baseRadius = node.nodeType === 'document' || node.nodeType === 'saved-file' ? 3 : 2;
            const radius = baseRadius * KNOWLEDGE_GRAPH_TARGET.nodeSizeMultiplier;
            const isConnected = selectedNodeId ? connectedNodeIds.has(node.id) : true;
            return (
              <g
                key={node.id}
                data-knowledge-node="true"
                transform={`translate(${position.x}, ${position.y})`}
                className="cursor-grab active:cursor-grabbing"
                opacity={selectedNodeId ? (isConnected ? 1 : 0.22) : 1}
                onPointerDown={(event) => handleNodePointerDown(event, node)}
              >
                <circle
                  cx="0"
                  cy="0"
                  r={radius}
                  className={`${getKnowledgeNodeClasses(node.nodeType)} ${isSelected ? 'stroke-[var(--color-accent)]' : ''}`}
                  strokeWidth={isSelected ? 1.8 : 1.05}
                />
                {node.auditLinked ? <circle cx={radius - 2} cy={-radius + 3} r="2" className="fill-slate-950" /> : null}
                <text x="0" y={radius + 13} textAnchor="middle" className="fill-slate-100 text-[9px] font-semibold" opacity={getKnowledgeLabelOpacity(viewport.scale)}>
                  {node.label.length > 22 ? `${node.label.slice(0, 22)}…` : node.label}
                </text>
                <text x="0" y={radius + 21} textAnchor="middle" className="fill-slate-400 text-[6px] uppercase tracking-[0.12em]" opacity={Math.max(0.5, getKnowledgeLabelOpacity(viewport.scale) - 0.18)}>
                  {getKnowledgeNodeMeta(node)}
                </text>
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}

function AuditEntryCard({
  entry,
  onOpenDocument,
  onOpenFile,
}: {
  entry: DocumentationAuditEntry;
  onOpenDocument: () => void;
  onOpenFile?: () => void;
}) {
  return (
    <div className="rounded-[14px] border border-neutral-200 bg-white/80 px-3 py-2.5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-start gap-2">
            <DocumentListRowIcon />
            <div className="truncate text-[13px] font-semibold text-neutral-900">{entry.documentTitle}</div>
          </div>
          <div className="mt-1 text-xs leading-[1.5] text-neutral-600">
            {entry.teamLabel} · {entry.projectLabel ?? 'No project'} · {entry.recordClass}
          </div>
        </div>
        <div
          className={`rounded-full border px-2 py-1 text-[10px] font-semibold tracking-[0.08em] ${getAuditEventClasses(
            entry.eventKind,
          )}`}
        >
          {entry.eventLabel}
        </div>
      </div>

      <div className="mt-2 flex flex-wrap gap-2">
        {entry.documentState ? (
          <div
            className={`rounded-full border px-2 py-1 text-[10px] font-semibold tracking-[0.08em] ${getDocumentStateClasses(
              entry.documentState,
            )}`}
          >
            {entry.documentState}
          </div>
        ) : null}
        {entry.documentVersion ? (
          <div className="rounded-full border border-neutral-200 bg-white px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-neutral-600">
            {entry.documentVersion}
          </div>
        ) : null}
      </div>

      <div className="mt-2 grid gap-2 text-xs text-neutral-700 sm:grid-cols-2">
        <DetailField label="User" value={entry.userLabel ?? 'n/a'} />
        <DetailField label="Responsible" value={entry.responsibleLabel ?? 'n/a'} />
        <DetailField label="Reference Time" value={entry.occurredAt ?? 'n/a'} />
        <DetailField label="Source Workspace" value={entry.sourceWorkspace} />
        <DetailField
          label="Audit Linkage"
          value={entry.auditEventIds.length ? `${entry.auditEventIds.length} linked event(s)` : 'n/a'}
        />
      </div>

      <DetailField label="Path" value={entry.path} long />

      <div className="mt-2 flex flex-wrap gap-2">
        <button
          className="ui-button min-h-8 px-3 text-[11px] text-neutral-700"
          onClick={onOpenDocument}
        >
          View Details
        </button>
        {onOpenFile ? (
          <button
            className="ui-button ui-button-primary min-h-8 px-3 text-[11px] text-white"
            onClick={onOpenFile}
          >
            Open Document
          </button>
        ) : null}
      </div>
    </div>
  );
}

function CompactAuditEntryRow({
  entry,
  openHref,
}: {
  entry: DocumentationAuditEntry;
  openHref: string;
}) {
  return (
    <div className="rounded-[14px] border border-neutral-200 bg-white/80 px-3 py-2.5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-start gap-2">
            <DocumentListRowIcon />
            <div className="min-w-0 flex-1">
              <div className="truncate text-[13px] font-semibold text-neutral-900">
                {entry.documentTitle}
              </div>
              <div className="mt-0.5 truncate text-[11px] leading-5 text-neutral-600">
                {entry.teamLabel} · {entry.projectLabel ?? 'No project'} · {getAuditEntryTypeLabel(entry)}
              </div>
              <div className="mt-1 text-[11px] leading-[1.45] text-neutral-500">
                {entry.eventLabel} · {entry.recordClass}
              </div>
            </div>
          </div>
        </div>
        <div className="flex shrink-0 items-start gap-2">
          {entry.documentVersion ? (
            <div className="rounded-full border border-neutral-200 bg-white px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-neutral-600">
              {entry.documentVersion}
            </div>
          ) : null}
          <div
            className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold tracking-[0.08em] ${getAuditEventClasses(
              entry.eventKind,
            )}`}
          >
            {entry.eventLabel}
          </div>
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between gap-2">
        <div className="flex flex-wrap gap-2">
          {entry.documentState ? (
            <div
              className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold tracking-[0.08em] ${getDocumentStateClasses(
                entry.documentState,
              )}`}
            >
              {entry.documentState}
            </div>
          ) : null}
        </div>
        <a
          className="ui-button min-h-7 px-3 text-[11px] text-neutral-700"
          href={openHref}
          target="_blank"
          rel="noreferrer"
        >
          View Details
        </a>
      </div>

      <div className="mt-2 grid gap-x-4 gap-y-1.5 text-xs text-neutral-700 sm:grid-cols-3">
        <DetailField label="User" value={entry.userLabel ?? 'n/a'} />
        <DetailField label="Responsible" value={entry.responsibleLabel ?? 'n/a'} />
        <DetailField label="Reference Time" value={entry.occurredAt ?? 'n/a'} />
        <DetailField label="Source Workspace" value={entry.sourceWorkspace} />
        <DetailField
          label="Audit Linkage"
          value={entry.auditEventIds.length ? `${entry.auditEventIds.length} linked event(s)` : 'n/a'}
        />
        <DetailField label="Path" value={entry.path} long />
      </div>
    </div>
  );
}

function AuditEntryReferenceRow({
  entry,
  actions,
}: {
  entry: DocumentationAuditEntry;
  actions: RepositoryAction[];
}) {
  return (
    <div className="rounded-[14px] border border-neutral-200 bg-white/80 px-3 py-2">
      <div className="grid gap-3 md:grid-cols-[minmax(0,1.45fr)_minmax(0,0.9fr)_minmax(0,0.9fr)_minmax(0,1.2fr)_auto]">
        <div className="min-w-0 border-neutral-200 md:border-r md:pr-3">
          <div className="flex items-start gap-2">
            <DocumentListRowIcon />
            <div className="min-w-0 flex-1">
              <div className="truncate text-[13px] font-semibold text-neutral-900">
                {entry.documentTitle}
              </div>
              <div className="mt-0.5 truncate text-[11px] leading-5 text-neutral-600">
                {entry.teamLabel} · {entry.projectLabel ?? 'No project'} · {entry.recordClass}
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-2">
          <DetailField label="Actor" value={getAuditEntryActorLabel(entry)} />
          <DetailField label="User" value={entry.userLabel ?? 'n/a'} />
        </div>

        <div className="grid gap-2">
          <DetailField label="Event Type" value={entry.eventLabel} />
          <DetailField label="Source Workspace" value={entry.sourceWorkspace} />
        </div>

        <div className="grid gap-2">
          <DetailField label="Reference Time" value={entry.occurredAt ?? 'n/a'} />
          <DetailField
            label="Audit Linkage"
            value={entry.auditEventIds.length ? `${entry.auditEventIds.length} linked event(s)` : 'n/a'}
          />
        </div>

        <div className="flex min-w-[170px] flex-col items-end justify-between gap-3">
          <div className="flex flex-wrap justify-end gap-2">
            {entry.documentVersion ? (
              <div className="rounded-full border border-neutral-200 bg-white px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-neutral-600">
                {entry.documentVersion}
              </div>
            ) : null}
            <div
              className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold tracking-[0.08em] ${getAuditEventClasses(
                entry.eventKind,
              )}`}
            >
              {entry.eventLabel}
            </div>
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            {actions.map((action) => (
              <button
                key={action.key}
                className={`ui-button min-h-7 px-3 text-[11px] ${
                  action.primary ? 'ui-button-primary text-white' : 'text-neutral-700'
                }`}
                onClick={action.onClick}
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-2 grid gap-x-4 gap-y-1.5 border-t border-neutral-200 pt-2 text-xs text-neutral-700 sm:grid-cols-3">
        <DetailField label="Document State" value={entry.documentState ?? 'n/a'} />
        <DetailField label="Document Version" value={entry.documentVersion ?? 'n/a'} />
        <DetailField label="PATH" value={entry.path} long />
      </div>
    </div>
  );
}

function RepositoryItemCard({
  itemType,
  typeLabel,
  teamLabel,
  ownerLabel,
  sourcePanelLabel,
  updatedAt,
  title,
  meta,
  secondary,
  status,
  documentState,
  documentVersion,
  lastResponsible,
  readiness,
  selected,
  onSelect,
  actions,
}: {
  itemType: DocumentationRepositoryItem['itemType'];
  typeLabel: string;
  teamLabel: string;
  ownerLabel: string | null;
  sourcePanelLabel: string | null;
  updatedAt: string | null;
  title: string;
  meta: string;
  secondary: string;
  status: string;
  documentState: DocumentationDocumentState | null;
  documentVersion: string | null;
  lastResponsible: string | null;
  readiness: ReturnType<typeof getDocumentReadinessFields>;
  selected: boolean;
  onSelect: () => void;
  actions: RepositoryAction[];
}) {
  const isDocument = itemType === 'file' || itemType === 'saved-object';
  const stateLabel = documentState ?? status;
  const visibleDocumentState =
    isDocument && stateLabel === 'Active'
      ? ('Active' as DocumentationDocumentState)
      : isDocument && stateLabel === 'Archived'
        ? ('Archived' as DocumentationDocumentState)
        : documentState;

  return (
    <div
      className={`rounded-[14px] border border-neutral-200 bg-white/80 px-3 py-2 transition-colors ${
        selected ? 'ring-2 ring-[var(--color-accent)] ring-offset-1' : ''
      }`}
      onClick={onSelect}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <DocumentListRowIcon />
              <button
                className="truncate text-left text-[13px] font-semibold text-neutral-900 underline-offset-2 hover:underline"
                onClick={(event) => {
                  event.stopPropagation();
                  onSelect();
                }}
              >
                {title}
              </button>
            </div>
            <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5">
              {isDocument && visibleDocumentState ? (
                <div
                  className={`rounded-full border px-2 py-0.5 text-[9px] font-semibold tracking-[0.08em] ${getDocumentStateClasses(
                    visibleDocumentState,
                  )}`}
                >
                  {visibleDocumentState}
                </div>
              ) : null}
              {isDocument && documentVersion ? (
                <div className="rounded-full border border-neutral-200 bg-white px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-neutral-600">
                  {documentVersion}
                </div>
              ) : null}
              {!isDocument ? (
                <div className="rounded-full border border-neutral-200 bg-neutral-50 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-neutral-500">
                  {stateLabel}
                </div>
              ) : null}
            </div>
          </div>

          <div className="mt-1 flex flex-wrap gap-1.5">
            <div className="rounded-full border border-neutral-200 bg-white px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-neutral-600">
              {typeLabel}
            </div>
            <div className="rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-[9px] font-semibold tracking-[0.08em] text-sky-700">
              {teamLabel}
            </div>
            {sourcePanelLabel ? (
              <div className="rounded-full border border-neutral-200 bg-neutral-50 px-2 py-0.5 text-[9px] font-medium tracking-[0.08em] text-neutral-600">
                {sourcePanelLabel}
              </div>
            ) : null}
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[10px] leading-[1.35] text-neutral-600">
            <span>{meta}</span>
            <span>{secondary}</span>
          </div>

          <div className="mt-1.5 flex flex-wrap items-end justify-between gap-2 border-t border-neutral-200/80 pt-1.5">
            <div className="grid gap-1 text-[10px] text-neutral-600">
              {isDocument ? (
                <>
                  <div className="flex flex-wrap gap-x-3 gap-y-1">
                    <span><span className="font-semibold text-neutral-800">State:</span> {visibleDocumentState ?? stateLabel}</span>
                    <span><span className="font-semibold text-neutral-800">Version:</span> {documentVersion ?? 'n/a'}</span>
                    <span><span className="font-semibold text-neutral-800">Updated:</span> {updatedAt?.slice(0, 10) ?? 'n/a'}</span>
                  </div>
                  <div className="flex flex-wrap gap-x-3 gap-y-1">
                    <span><span className="font-semibold text-neutral-800">Owner:</span> {ownerLabel ?? 'system'}</span>
                    <span><span className="font-semibold text-neutral-800">Responsible:</span> {lastResponsible ?? ownerLabel ?? 'n/a'}</span>
                    <span><span className="font-semibold text-neutral-700">Sensitivity:</span> {readiness.sensitivity}</span>
                    <span><span className="font-semibold text-neutral-700">Access:</span> {readiness.accessScope}</span>
                    <span><span className="font-semibold text-neutral-700">Official copy:</span> {readiness.officialCopy}</span>
                  </div>
                </>
              ) : (
                <div className="flex flex-wrap gap-x-3 gap-y-1 text-neutral-500">
                  <span>Owner: {ownerLabel ?? 'system'}</span>
                  <span>Updated: {updatedAt?.slice(0, 10) ?? 'n/a'}</span>
                </div>
              )}
            </div>

            <div className="flex shrink-0 flex-wrap justify-end gap-2">
              {actions.map((action) => (
                <button
                  key={action.key}
                  className={`ui-button min-h-7 px-3 text-[10px] ${
                    action.primary ? 'ui-button-primary text-white' : 'text-neutral-700'
                  }`}
                  onClick={(event) => {
                    event.stopPropagation();
                    action.onClick?.();
                  }}
                >
                  {action.label}
                </button>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

function RepositoryDetailPanel({
  item,
  actions,
}: {
  item: DocumentationRepositoryItem;
  actions: RepositoryAction[];
}) {
  const isDocument = item.itemType === 'file' || item.itemType === 'saved-object';
  const readiness = getDocumentReadinessFields(item);
  const visibleDocumentState =
    item.documentState ??
    (item.status === 'active'
      ? ('Active' as DocumentationDocumentState)
      : item.status === 'archived'
        ? ('Archived' as DocumentationDocumentState)
        : null);

  return (
    <div className="mt-3 grid gap-4">
      <div>
        <div className="text-base font-semibold tracking-[-0.02em] text-neutral-900">{item.title}</div>
        <div className="mt-1 text-xs leading-[1.5] text-neutral-600">
          {getRepositoryItemTypeLabel(item)} · {item.sourceWorkspace}
        </div>
      </div>

      <div className="grid gap-2 rounded-[14px] border border-neutral-200 bg-white px-3 py-3 text-[11px] text-neutral-700">
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          <span><span className="font-semibold text-neutral-900">State:</span> {visibleDocumentState ?? item.status}</span>
          <span><span className="font-semibold text-neutral-900">Version:</span> {item.documentVersion ?? 'n/a'}</span>
          <span><span className="font-semibold text-neutral-900">Updated:</span> {item.updatedAt?.slice(0, 10) ?? 'n/a'}</span>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          <span><span className="font-semibold text-neutral-900">Owner:</span> {item.ownerLabel ?? 'System'}</span>
          <span><span className="font-semibold text-neutral-900">User:</span> {item.userLabel ?? 'n/a'}</span>
          <span><span className="font-semibold text-neutral-900">Responsible:</span> {item.lastResponsible ?? item.ownerLabel ?? 'n/a'}</span>
        </div>
      </div>

      <div className="grid gap-2 rounded-[14px] border border-neutral-200 bg-white px-3 py-3 text-[11px] text-neutral-700">
        <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
          Compliance / data safety readiness
        </div>
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          <DetailField label="Record Class" value={readiness.recordClass} />
          <DetailField label="Sensitivity" value={readiness.sensitivity} />
          <DetailField label="Official Copy" value={readiness.officialCopy} />
          <DetailField label="Access Scope" value={readiness.accessScope} />
          <DetailField label="Retention Readiness" value={readiness.retentionReadiness} />
          <DetailField label="Integrity Readiness" value={readiness.integrityReadiness} />
        </div>
        <DetailField label="Source Of Truth Marker" value={readiness.sourceOfTruth} />
      </div>

      <div className="grid gap-2">
        <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
          Secondary metadata
        </div>
        <div className="grid gap-3 text-xs text-neutral-700 sm:grid-cols-2">
        <DetailField label="Team" value={item.teamLabel} />
        <DetailField label="Object Type" value={item.objectType ?? item.itemType} />
        <DetailField label="User" value={item.userLabel ?? 'n/a'} />
        <DetailField label="Owner" value={item.ownerLabel ?? 'System'} />
        <DetailField label="Origin Agent" value={item.ownerRole ?? 'n/a'} />
        <DetailField label="Source Panel" value={item.sourcePanelLabel ?? 'n/a'} />
        {!isDocument ? (
          <DetailField label="Versions" value={item.versionCount !== null ? String(item.versionCount) : 'n/a'} />
        ) : null}
        <DetailField label="Project" value={item.projectLabel ?? 'n/a'} />
        <DetailField label="Conversation Source" value={item.sourceConversationLabel ?? 'n/a'} />
        <DetailField label="Provenance" value={item.provenanceSummary ?? 'n/a'} />
        <DetailField
          label="Audit Linkage"
          value={item.auditEventIds.length ? `${item.auditEventIds.length} linked event(s)` : 'n/a'}
        />
        <DetailField label="Checkpoint" value={item.checkpointLabel ?? 'n/a'} />
        <DetailField
          label="Lock"
          value={item.lockState === null ? 'n/a' : item.lockState ? 'Locked' : 'Unlocked'}
        />
        </div>
      </div>

      {item.automaticTags && item.automaticTags.length > 0 ? (
        <div className="grid gap-1">
          <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
            Automatic Tags
          </div>
          <div className="flex flex-wrap gap-2">
            {item.automaticTags.map((tag) => (
              <div
                key={tag}
                className="rounded-full border border-neutral-200 bg-white px-2 py-1 text-[10px] font-medium text-neutral-600"
              >
                {tag}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <DetailField label="Path" value={item.path} long />

      <div className="flex flex-wrap gap-2">
        {actions.map((action) => (
          <button
            key={action.key}
            className={`ui-button min-h-8 px-3 text-[11px] ${
              action.primary ? 'ui-button-primary text-white' : 'text-neutral-700'
            }`}
            onClick={() => action.onClick?.()}
          >
            {action.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function DocumentationHelpContent({ topic }: { topic: DocumentationHelpTopic }) {
  if (topic === 'repository') {
    return (
      <div className="grid gap-4 text-sm leading-6 text-neutral-800">
        <div>
          <h3 className="text-base font-semibold text-neutral-900">Repository View</h3>
          <p className="mt-2">It is the view for finding things quickly.</p>
          <p className="mt-2">
            If you enter here, the idea is simple: see a clear list of documents, search by name,
            filter by project, team, type, or state, and open what you need without going in circles.
          </p>
          <p className="mt-2">
            In everyday language: it is like the main working table of the archive.
          </p>
          <p className="mt-2">
            You do not come here to understand the whole story. You come here to locate a document
            and use it. That is why this should be the main daily-use view.
          </p>
        </div>
      </div>
    );
  }

  if (topic === 'structure') {
    return (
      <div className="grid gap-4 text-sm leading-6 text-neutral-800">
        <div>
          <h3 className="text-base font-semibold text-neutral-900">Structure View</h3>
          <p className="mt-2">It is the view for understanding where each thing comes from and how it is organized.</p>
          <p className="mt-2">
            Here it is not so much about finding something fast, but about seeing the structure:
            project, team, folder, provenance, and the relationship between parts.
          </p>
          <p className="mt-2">
            Said simply: it is like looking at the shelf or the archive tree.
          </p>
          <p className="mt-2">
            It helps you orient yourself and understand the general order of the system.
          </p>
        </div>
      </div>
    );
  }

  if (topic === 'audit') {
    return (
      <div className="grid gap-4 text-sm leading-6 text-neutral-800">
        <div>
          <h3 className="text-base font-semibold text-neutral-900">Audit View</h3>
          <p className="mt-2">It is the view for reconstructing what happened.</p>
          <p className="mt-2">
            It is useful for seeing who touched something, what was reviewed, what was moved, what
            was approved, what was forwarded, and when it happened.
          </p>
          <p className="mt-2">
            In common language: it is like reviewing the movement history of a case file.
          </p>
          <p className="mt-2">
            It is not designed so much to store things, but to follow the trace of a situation.
            Also, this view should stay very connected to Audit Log.
          </p>
        </div>
      </div>
    );
  }

  if (topic === 'investigate') {
    return (
      <div className="grid gap-4 text-sm leading-6 text-neutral-800">
        <div>
          <h3 className="text-base font-semibold text-neutral-900">Investigate View</h3>
          <p className="mt-2">It is the view for studying a topic.</p>
          <p className="mt-2">
            Here you are not looking only for one specific file. You are trying to understand a
            complete matter: which documents are related, how something evolved over time, and what
            context existed before and after.
          </p>
          <p className="mt-2">
            Put simply: it is like opening an investigation table around a topic.
          </p>
          <p className="mt-2">
            For example, it helps you see everything related to one decision, one client, or one
            line of work, even if it is distributed across several documents.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-4 text-sm leading-6 text-neutral-800">
      <div>
        <h3 className="text-base font-semibold text-neutral-900">Knowledge Map</h3>
        <p className="mt-2">It is the view for seeing relationships between things.</p>
        <p className="mt-2">
          It is not designed for basic daily work, but for seeing connections: which document comes
          from which one, which team participated, which conversation produced which result, and
          what is linked to what.
        </p>
        <p className="mt-2">
          In plain everyday language: it is like a visual map of connections.
        </p>
        <p className="mt-2">
          It helps you see the wider picture and understand relationships that are harder to detect
          in a normal list. It is a secondary analytical layer; it does not replace Repository View.
        </p>
      </div>
    </div>
  );
}

function DetailField({
  label,
  value,
  long = false,
}: {
  label: string;
  value: string;
  long?: boolean;
}) {
  return (
    <div className={long ? 'grid gap-1' : 'grid gap-1'}>
      <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-500">{label}</div>
      <div className={`text-xs leading-[1.5] text-neutral-800 ${long ? 'break-all' : ''}`}>{value}</div>
    </div>
  );
}
