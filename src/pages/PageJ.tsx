import { useState } from 'react';

const structureItems = [
  { label: 'Project', value: 'AISync Demo Project' },
  { label: 'Team', value: 'Main Workspace' },
  { label: 'General Manager', value: 'AI General Manager' },
  { label: 'Worker 1', value: 'Workspace Worker' },
  { label: 'Worker 2', value: 'Documentation Worker' },
];

const quickActions = [
  'Plan a working session',
  'Review current context',
  'Assign next steps',
];

export function PageJ() {
  const [message, setMessage] = useState('');
  const [guideOpen, setGuideOpen] = useState(true);

  return (
    <div className="app-page-shell h-full min-h-0 min-w-0 overflow-hidden bg-[#eef2f5] px-2 py-2 sm:px-3 sm:py-3">
      <div className="mx-auto grid h-full min-h-0 w-full max-w-[1600px] gap-3 lg:grid-cols-[220px_minmax(0,1fr)_300px]">
        <aside className="ui-surface hidden min-h-0 overflow-hidden rounded-[24px] px-4 py-4 lg:flex lg:flex-col">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
              Structure
            </div>
            <div className="mt-1 text-sm font-semibold tracking-[-0.02em] text-neutral-950">
              Entry context
            </div>
          </div>

          <div className="mt-5 grid gap-3">
            {structureItems.map((item) => (
              <div key={item.label} className="rounded-[16px] border border-neutral-200 bg-white/78 px-3 py-3">
                <div className="text-[9px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
                  {item.label}
                </div>
                <div className="mt-1 text-xs font-semibold leading-[1.35] text-neutral-900">
                  {item.value}
                </div>
              </div>
            ))}
          </div>
        </aside>

        <main className="ui-surface min-h-0 overflow-hidden rounded-[28px]">
          <div className="flex h-full min-h-0 flex-col bg-[radial-gradient(circle_at_18%_8%,rgba(15,23,42,0.08),transparent_24%),linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] px-5 py-5 sm:px-8 sm:py-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
                  General Manager
                </div>
                <h1 className="mt-2 text-3xl font-semibold tracking-[-0.055em] text-neutral-950 sm:text-4xl">
                  Start with the General Manager.
                </h1>
                <p className="mt-3 max-w-xl text-sm leading-6 text-neutral-600">
                  Tell AISync what you want to organize, review, or move forward. The manager will
                  turn your context into coordinated work.
                </p>
              </div>
              <div className="hidden rounded-full border border-neutral-200 bg-white/76 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-500 shadow-sm sm:block">
                Chat-first preview
              </div>
            </div>

            <div className="mt-8 flex min-h-0 flex-1 flex-col justify-end">
              <div className="grid gap-4">
                <div className="max-w-2xl rounded-[24px] border border-neutral-200 bg-white px-5 py-5 shadow-sm">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
                    AI General Manager
                  </div>
                  <p className="mt-3 text-base leading-7 text-neutral-800">
                    Welcome. Share the work objective, the current context, or the next decision you
                    need to make. I will help structure it into a clean operating path.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {quickActions.map((action) => (
                    <button
                      key={action}
                      className="rounded-full border border-neutral-200 bg-white px-3 py-2 text-xs font-medium text-neutral-700 shadow-sm transition-colors hover:border-neutral-300 hover:bg-neutral-50"
                      onClick={() => setMessage(action)}
                    >
                      {action}
                    </button>
                  ))}
                </div>

                <div className="rounded-[26px] border border-neutral-200 bg-white p-2 shadow-xl shadow-slate-900/8">
                  <textarea
                    className="min-h-28 w-full resize-none rounded-[20px] border-0 bg-transparent px-4 py-3 text-sm leading-6 text-neutral-900 outline-none placeholder:text-neutral-400"
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    placeholder="Write your objective or context here..."
                  />
                  <div className="flex items-center justify-between gap-3 border-t border-neutral-100 px-2 pt-2">
                    <div className="text-[11px] text-neutral-500">
                      One clear prompt is enough to begin.
                    </div>
                    <button className="ui-button ui-button-primary min-h-9 px-4 text-xs text-white">
                      Start with Manager
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>

        <aside className="ui-surface min-h-0 overflow-hidden rounded-[24px] px-4 py-4">
          <button
            className="flex w-full items-center justify-between text-left"
            onClick={() => setGuideOpen((value) => !value)}
          >
            <span>
              <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
                Quick guide
              </span>
              <span className="mt-1 block text-sm font-semibold tracking-[-0.02em] text-neutral-950">
                Keep the first step simple
              </span>
            </span>
            <span className="rounded-full border border-neutral-200 bg-white px-2 py-1 text-[10px] text-neutral-500">
              {guideOpen ? 'Hide' : 'Show'}
            </span>
          </button>

          {guideOpen ? (
            <div className="mt-5 grid gap-3 text-sm leading-6 text-neutral-650">
              <div className="rounded-[18px] border border-neutral-200 bg-white/78 px-4 py-3">
                Start by describing the outcome you need, not every detail of the system.
              </div>
              <div className="rounded-[18px] border border-neutral-200 bg-white/78 px-4 py-3">
                The General Manager can route work to workers after the objective is clear.
              </div>
              <div className="rounded-[18px] border border-neutral-200 bg-white/78 px-4 py-3">
                Use the structure rail only as orientation. The central chat is the entry point.
              </div>
            </div>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
