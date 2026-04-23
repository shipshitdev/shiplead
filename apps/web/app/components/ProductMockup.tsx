const columns = [
  {
    label: 'Researching',
    count: 3,
    cards: [
      { name: 'Maya Coleman', account: 'ArcForge', score: 88, project: 'ShipCode' },
      { name: 'Ren Park', account: 'Studio Velocity', score: 76, project: 'ShipCut' },
    ],
  },
  {
    label: 'Qualified',
    count: 2,
    cards: [{ name: 'Liam Stone', account: 'Northstar Labs', score: 82, project: 'ShipCode' }],
  },
  {
    label: 'Reached Out',
    count: 4,
    cards: [
      { name: 'Iris Chen', account: 'ClipFoundry', score: 91, project: 'ShipCut' },
      { name: 'Noah Vale', account: 'OpenOps', score: 74, project: 'ShipCode' },
    ],
  },
];

const tasks = [
  'Review LinkedIn draft for Liam',
  'Send AI workshop agenda to Maya',
  'Reply to Ren with pilot framing',
];

export function ProductMockup() {
  return (
    <div className="mx-auto w-full max-w-[1500px] overflow-hidden rounded-[24px] border border-white/8 bg-primary shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
      <div className="flex h-9 items-center gap-2 border-b border-white/6 bg-[#070a08] px-4">
        <span className="h-3 w-3 rounded-full bg-[#ff5f57]/80" />
        <span className="h-3 w-3 rounded-full bg-[#febc2e]/80" />
        <span className="h-3 w-3 rounded-full bg-[#28c840]/80" />
        <div className="ml-4 text-[11px] tracking-[0.18em] text-white/40 uppercase">
          Shiplead · Vincent Labs · Pipeline
        </div>
      </div>

      <div className="grid h-[640px] grid-cols-[240px_1fr] bg-primary text-left">
        <aside className="flex flex-col gap-1 border-r border-white/6 bg-[#090d0b] px-3 py-4 text-[13px]">
          <div className="px-2 pb-2 text-[10px] font-semibold tracking-[0.18em] text-white/40 uppercase">
            Projects
          </div>
          {['ShipCode', 'ShipCut', 'GenFeed', 'ShipLead'].map((label, index) => (
            <div
              key={label}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 ${
                index === 0 ? 'bg-white/[0.06] text-white' : 'text-white/60'
              }`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-[#34d399]" />
              <span className="truncate">{label}</span>
              {index < 2 ? (
                <span className="ml-auto rounded-full border border-[#34d399]/20 px-1.5 py-0.5 text-[9px] text-[#34d399]">
                  ACTIVE
                </span>
              ) : null}
            </div>
          ))}

          <div className="mt-6 px-2 pb-2 text-[10px] font-semibold tracking-[0.18em] text-white/40 uppercase">
            New work
          </div>
          {tasks.map((task) => (
            <div key={task} className="rounded-lg border border-white/6 bg-white/[0.02] px-3 py-2">
              <div className="line-clamp-2 text-[12px] text-white/70">{task}</div>
            </div>
          ))}
        </aside>

        <div className="flex flex-col">
          <div className="border-b border-white/6 bg-[#080b09] px-8 py-5">
            <div className="text-[10px] font-semibold tracking-[0.18em] text-white/40 uppercase">
              Agentic CRM
            </div>
            <div className="mt-4 grid grid-cols-4 gap-3">
              {[
                ['3', 'contacts'],
                ['2', 'companies'],
                ['3', 'open work'],
                ['$12k', 'pipeline'],
              ].map(([value, label], index) => (
                <div
                  key={label}
                  className={`rounded-xl border px-4 py-3 ${
                    index === 3
                      ? 'border-[#34d399]/30 bg-[#34d399]/[0.05]'
                      : 'border-white/8 bg-white/[0.02]'
                  }`}
                >
                  <div className="text-2xl font-semibold text-white">{value}</div>
                  <div className="mt-1 text-[10px] font-medium tracking-[0.18em] text-white/40 uppercase">
                    {label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div id="workflow" className="grid flex-1 grid-cols-3 gap-3 overflow-hidden p-6">
            {columns.map((column) => (
              <div
                key={column.label}
                className="flex min-h-0 flex-col rounded-xl border border-white/8 bg-white/[0.02]"
              >
                <div className="flex items-center justify-between border-b border-white/6 px-4 py-3">
                  <div className="text-[13px] font-semibold text-white">{column.label}</div>
                  <div className="rounded-full bg-white/5 px-2 py-0.5 font-mono text-[11px] text-white/50">
                    {column.count}
                  </div>
                </div>
                <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden p-3">
                  {column.cards.map((card) => (
                    <div
                      key={card.name}
                      className="rounded-xl border border-white/6 bg-[#0d1210] px-4 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#34d399]/10 text-[11px] font-semibold text-[#34d399]">
                          {card.name
                            .split(' ')
                            .map((part) => part[0])
                            .join('')}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-[13px] font-medium text-white">
                            {card.name}
                          </div>
                          <div className="truncate text-[11px] text-white/45">{card.account}</div>
                        </div>
                        <div className="rounded-full border border-[#34d399]/25 px-2 py-0.5 font-mono text-[11px] text-[#34d399]">
                          {card.score}
                        </div>
                      </div>
                      <div className="mt-3 flex items-center justify-between text-[11px]">
                        <span className="rounded-full bg-white/5 px-2 py-1 text-white/50">
                          {card.project}
                        </span>
                        <span className="text-white/35">email · x · linkedin</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
