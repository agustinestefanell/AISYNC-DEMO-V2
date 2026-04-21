import { Modal } from './Modal';

export type HowToTopic =
  | 'chat-first'
  | 'main-workspace'
  | 'audit-log'
  | 'teams-map'
  | 'create-teams'
  | 'team-types'
  | 'cross-verification'
  | 'prompts-library'
  | 'documentation-mode';

type HowToSection = {
  title: string;
  body: string;
};

const HOW_TO_CONTENT: Record<HowToTopic, { title: string; sections: HowToSection[] }> = {
  'chat-first': {
    title: 'How to use this page',
    sections: [
      {
        title: 'What this page is.',
        body: 'This is the easiest place to begin working in AISync. You do not need to understand the whole system before you start. This page is designed to help you begin with a goal, a task, or a short explanation of what you need.',
      },
      {
        title: 'What to do here.',
        body: 'Write what you want to achieve, what kind of work you need help with, or the context of your project. You do not need to prepare the team first. A simple explanation is enough to begin.',
      },
      {
        title: 'Main action.',
        body: 'When you press `Start with the General Manager`, AISync opens the `Main Workspace` and transfers your initial goal to the `General Manager`. This allows the work to begin with continuity instead of starting from an empty chat.',
      },
      {
        title: 'Why this page matters.',
        body: 'AISync is designed to support structured work with AI. The basic logic is simple: you start with an objective, the General Manager helps organize the work, the workers help develop or document specific parts, and the rest of the system helps you save, track, recover, and structure the process. You do not need to use every feature immediately. Start with the goal, then let the structure support the work as it grows.',
      },
      {
        title: 'Related page.',
        body: 'Main Workspace - `How to use Main Workspace`',
      },
    ],
  },
  'main-workspace': {
    title: 'How to use Main Workspace',
    sections: [
      {
        title: 'What this page is.',
        body: 'The `Main Workspace` is the central working area of AISync. This is where you work directly with the `General Manager` and the `Workers`.',
      },
      {
        title: 'What the General Manager does.',
        body: 'The `General Manager` helps you define the work, organize the next steps, clarify priorities, and prepare material that can later be sent to the rest of the team.',
      },
      {
        title: 'What the Workers do.',
        body: 'The `Workers` help develop specific parts of the work. They can be used in different ways depending on what you need. A suggested initial structure is: `Worker 1` is better for execution-oriented help, operational breakdowns, validation, concrete next steps, or turning an instruction into a more actionable structure. `Worker 2` is better for documentation, summaries, reusable notes, support material, or turning a result into something easier to preserve and reuse later. You can use workers as you prefer. This structure is only a suggested starting point.',
      },
      {
        title: 'General use of workspace agents.',
        body: 'Inside any panel, you can continue the conversation by writing a message and pressing `Send`. This is how you ask for structure, a short brief, a clearer next step, a summary, an analysis, or a better definition of the task you want to complete.',
      },
      {
        title: 'Main actions in this page.',
        body: 'The Main Workspace is where work is created, reviewed, saved, and passed forward in a controlled way.',
      },
      {
        title: 'Send.',
        body: 'Use `Send` to continue working inside the current panel.',
      },
      {
        title: 'Review & Forward.',
        body: 'Use `Review & Forward` when you want to send selected content from one panel to another in a controlled way. Instead of copying and pasting manually, AISync lets you review the content first and then send it to the right destination.',
      },
      {
        title: 'Save Version.',
        body: 'Use `Save Version` when you want to preserve an important point in the work. This creates a checkpoint that can later be found through the system history.',
      },
      {
        title: 'Save Selection.',
        body: 'Use `Save Selection` when only part of the conversation matters. This is useful for saving a short answer, a decision, a brief, or a reusable passage without saving the entire panel state.',
      },
      {
        title: 'Refresh Session.',
        body: 'Use `Refresh Session` when you want to continue the same line of work in a cleaner session state. This helps preserve continuity without treating every step as a completely new start.',
      },
      {
        title: 'Lock Panel.',
        body: 'Use `Lock Panel` when you want to stop a panel from being changed freely. This is a control action that helps preserve a more stable state before new edits or new directions are introduced.',
      },
      {
        title: 'Create Handoff Package.',
        body: 'Use `Create Handoff Package` when you want to prepare a more formal transfer of work, context, and responsibility. This is useful when a result is ready to be handed over in a more organized and traceable way.',
      },
      {
        title: 'Saving important content.',
        body: 'When a message becomes useful, you can mark it with the selection tick. This allows you to choose exactly which part of the conversation should be reused, saved, or forwarded somewhere else inside the system.',
      },
      {
        title: 'Related pages.',
        body: 'Audit Log - `How to use Audit Log`. Cross Verification - `How to use Cross Verification`. Prompts Library - `How to use Prompt Library`.',
      },
    ],
  },
  'audit-log': {
    title: 'How to use Audit Log',
    sections: [
      {
        title: 'What this page is.',
        body: '`Audit Log` is the visible history of your work. It shows what was saved, what happened, and when it happened. In simple terms, it is the place you use when you want to review what has been saved, locate an earlier checkpoint, understand the sequence of work, or continue from a previous point.',
      },
      {
        title: 'When to use it.',
        body: 'Use `Audit Log` when you want to recover work that was already saved, check the sequence of events, or understand how the work evolved over time.',
      },
      {
        title: 'Main logic.',
        body: 'If you use `Save Version` in the Workspace, AISync creates a checkpoint. That checkpoint later appears in `Audit Log`. From there, you can open the saved detail, review the history, and continue working from that point.',
      },
      {
        title: 'How to use the filters.',
        body: 'The filters help you narrow down what you are looking for. Use them when the log becomes larger and you do not want to scroll through everything manually. The filters are useful for finding activity from a specific day, locating a checkpoint around a known moment, narrowing the visible history to the most relevant items, and understanding what happened in a particular time range.',
      },
      {
        title: 'What this page helps you do.',
        body: 'Audit Log helps you move from "I know I saved this at some point" to "I found the saved point and I can continue from here."',
      },
      {
        title: 'Related page.',
        body: 'Main Workspace - `How to use Main Workspace`',
      },
    ],
  },
  'teams-map': {
    title: 'How to use Teams Map',
    sections: [
      {
        title: 'What this page is.',
        body: '`Teams Map` helps you understand the internal structure of the system. It shows how the `General Manager`, the `Workers`, and additional teams are organized. You do not need this page for the first step, but it becomes useful when you want to understand the structure more clearly.',
      },
      {
        title: 'Map and Tree.',
        body: 'AISync includes two ways to read the team structure. `Map` is the richer structural view. It helps you see the team in a more detailed and visual way. `Tree` is the simplified structural view. It helps you read the same structure in a faster and lighter way.',
      },
      {
        title: 'When to use Teams Map.',
        body: 'Use this page when you want to understand how the system is structured, check how teams are organized, review the relation between managers and workers, or create and edit teams more deliberately.',
      },
      {
        title: 'Why this matters.',
        body: 'AISync is not only a chat interface. It is a structured work system. Teams Map helps make that structure visible.',
      },
    ],
  },
  'create-teams': {
    title: 'How to create Teams',
    sections: [
      {
        title: 'What this page does.',
        body: 'This part of Teams Map helps you create new teams inside the system.',
      },
      {
        title: 'When to create a team.',
        body: 'Create a new team when you want to separate a line of work, when a project needs its own structure, when a task is large enough to justify its own internal team, or when you want to expand the system more clearly instead of overloading one team.',
      },
      {
        title: 'Organizational elasticity.',
        body: 'AISync is designed to grow with the work. This is part of its organizational elasticity. The structure does not need to be fixed forever. New teams can appear when the project becomes more complex, and the system can adapt as the work evolves.',
      },
      {
        title: 'Why this matters.',
        body: 'Teams help prevent overload, improve clarity, and keep work organized as projects grow.',
      },
    ],
  },
  'team-types': {
    title: 'Two very different kinds of teams',
    sections: [
      {
        title: 'SAT and MAT.',
        body: 'AISync supports two different ways of structuring a team.',
      },
      {
        title: 'SAT - Single Agent Team.',
        body: 'A `SAT` is a team supported by a single underlying agent.',
      },
      {
        title: 'When SAT is better.',
        body: 'Use `SAT` when the priority is continuity, speed, strong local context, low friction, linear execution, or a simpler starting experience.',
      },
      {
        title: 'Typical SAT cases.',
        body: '`SAT` is usually better for administrative work, simple operational work, linear drafting, short follow-up tasks, quick documentation, or first contact with the system.',
      },
      {
        title: 'MAT - Multi Agent Team.',
        body: 'A `MAT` is a team where different members are supported by different agents.',
      },
      {
        title: 'When MAT is better.',
        body: 'Use `MAT` when the priority is cognitive depth, contrast, review quality, ambiguity handling, complex thinking, or longer and more demanding work.',
      },
      {
        title: 'Typical MAT cases.',
        body: '`MAT` is usually better for research, strategy, audit and review, contradiction handling, cross verification, or long and complex tasks.',
      },
      {
        title: 'Practical difference.',
        body: '`SAT` is usually better for speed, clarity, compact work, and stronger continuity inside one interface. `MAT` is usually better for depth, robustness, comparison, and distributed thinking.',
      },
      {
        title: 'Simple rule.',
        body: 'If the work is simple, direct, and context-heavy, `SAT` is often the better choice. If the work is complex, ambiguous, or needs stronger review and contrast, `MAT` is often the better choice.',
      },
    ],
  },
  'cross-verification': {
    title: 'How to use Cross Verification',
    sections: [
      {
        title: 'What this page is.',
        body: '`Cross Verification` is the area used when you want to compare or audit an answer instead of accepting it immediately.',
      },
      {
        title: 'When to use it.',
        body: 'Use Cross Verification when the output is important, when you want another layer of review, when you want to compare answers before moving forward, or when you need stronger confidence before accepting a result.',
      },
      {
        title: 'How it connects to the rest of AISync.',
        body: 'Inside every team, you can access this logic through the `AUDIT AI ANSWER` button. This allows you to send an answer into a review flow instead of trusting it immediately.',
      },
      {
        title: 'Why this matters.',
        body: 'Not every result needs verification. But when the answer is important, sensitive, or difficult, Cross Verification adds a stronger review layer before the work continues.',
      },
    ],
  },
  'prompts-library': {
    title: 'How to use Prompt Library',
    sections: [
      {
        title: 'What this page is.',
        body: '`Prompts Library` gives you reusable prompts for structured work.',
      },
      {
        title: 'When to use it.',
        body: 'Use Prompt Library when you want consistency, when you do not want to rewrite the same type of instruction repeatedly, when you want to build reusable instructions separately from the live conversation, or when you want to apply the same logic again across different tasks.',
      },
      {
        title: 'Why this matters.',
        body: 'Prompts Library helps turn repeated instructions into reusable working tools. This saves time and makes the system more consistent.',
      },
      {
        title: 'Simple use.',
        body: 'Build a prompt once, keep it organized, and reuse it when needed instead of rebuilding the same instruction every time.',
      },
    ],
  },
  'documentation-mode': {
    title: 'How to use Documentation Mode',
    sections: [
      {
        title: 'What this page is.',
        body: '`Documentation Mode` is the place where you can explore saved material, related outputs, and documentation views in a more organized way.',
      },
      {
        title: 'When to use it.',
        body: 'Use Documentation Mode when you want to review saved work in a more structured environment, when you want to find documents or outputs, when you want to understand related material more clearly, or when you want to move from live work into structured documentation.',
      },
      {
        title: 'What to expect.',
        body: 'You do not need to learn everything in this area at the beginning. Documentation Mode contains several internal views, and each one helps you look at the same information in a different way. Inside that area, you will find additional `How to use` links under each function with more specific explanations of what it does and when to use it.',
      },
      {
        title: 'Why this matters.',
        body: 'Documentation Mode helps turn working material into something easier to explore, preserve, and reuse later.',
      },
    ],
  },
};

export function getHowToTitle(topic: HowToTopic) {
  return HOW_TO_CONTENT[topic].title;
}

function renderInstructionText(text: string) {
  return text.split(/(`[^`]+`)/g).map((part, index) => {
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={`${part}-${index}`} className="rounded bg-slate-100 px-1.5 py-0.5 text-[0.92em] text-slate-800">
          {part.slice(1, -1)}
        </code>
      );
    }

    return part;
  });
}

export function HowToModal({
  topic,
  onClose,
}: {
  topic: HowToTopic;
  onClose: () => void;
}) {
  const content = HOW_TO_CONTENT[topic];

  return (
    <Modal title={content.title} width="max-w-3xl" onClose={onClose}>
      <div className="grid gap-4 text-[15px] leading-7 text-neutral-700">
        {content.sections.map((section) => (
          <p key={section.title}>
            <strong className="font-semibold text-neutral-950">{section.title}</strong>{' '}
            {renderInstructionText(section.body)}
          </p>
        ))}
      </div>
    </Modal>
  );
}

export function HowToLink({
  children,
  className = '',
  onClick,
  variant = 'default',
}: {
  children: string;
  className?: string;
  onClick: () => void;
  variant?: 'default' | 'ribbon';
}) {
  const baseClass =
    variant === 'ribbon'
      ? 'font-normal text-white/92 decoration-white/80 underline-offset-4 transition-colors hover:text-white hover:decoration-white'
      : 'font-normal text-blue-700 underline decoration-blue-700/45 underline-offset-4 transition-colors hover:text-blue-900';

  return (
    <button
      type="button"
      className={`${baseClass} ${className}`}
      style={variant === 'ribbon' ? { textDecorationLine: 'underline' } : undefined}
      onClick={onClick}
    >
      {children} <span className="font-normal">(click here)</span>
    </button>
  );
}
