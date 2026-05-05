import { TOOL_REGISTRY, type ViewState } from '../config/tools'

interface Props {
  currentView: ViewState
  onViewChange: (v: ViewState) => void
}

const mainItems   = TOOL_REGISTRY.filter(t => !t.bottom)
const bottomItems = TOOL_REGISTRY.filter(t => t.bottom)

export function FixedLeftNav({ currentView, onViewChange }: Props) {
  return (
    <aside className="w-[230px] h-full self-stretch border-r border-slate bg-panel overflow-y-auto shrink-0 p-3 flex flex-col">
      <div className="text-[10px] font-semibold uppercase tracking-widest text-muted px-3 pt-2 pb-3">
        Pinteq Suite
      </div>

      <NavList items={mainItems} current={currentView} onSelect={onViewChange} />

      {/* Bottom-pinned items (Settings, etc.) */}
      <div className="mt-auto border-t border-slate pt-2">
        <NavList items={bottomItems} current={currentView} onSelect={onViewChange} />
        <div className="px-3 pt-3 pb-1 text-[10px] text-muted">
          <div>v0.1-alpha</div>
          <div className="opacity-60">People v. West</div>
        </div>
      </div>
    </aside>
  )
}

function NavList({
  items,
  current,
  onSelect,
}: {
  items: typeof TOOL_REGISTRY
  current: ViewState
  onSelect: (v: ViewState) => void
}) {
  let lastGroup: string | undefined

  return (
    <>
      {items.map(item => {
        const isActive   = current === item.id
        const showGroup  = item.group && item.group !== lastGroup
        lastGroup        = item.group

        return (
          <div key={item.id}>
            {showGroup && (
              <div className="text-[9px] font-semibold uppercase tracking-widest text-muted px-3 pt-3 pb-1 opacity-60">
                {item.group}
              </div>
            )}
            <button
              type="button"
              onClick={() => onSelect(item.id)}
              className={[
                'w-full px-3 py-2 mb-0.5 rounded-md text-[13px] font-sans text-left cursor-pointer flex items-center gap-2.5 border-l-[3px] transition-colors',
                isActive
                  ? 'bg-elevated font-medium pl-[9px]'
                  : 'text-muted hover:bg-elevated hover:text-main border-transparent',
              ].join(' ')}
              style={isActive ? { borderLeftColor: item.accent, color: item.accent } : undefined}
            >
              <span
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ background: isActive ? item.accent : 'var(--border-slate)' }}
              />
              {item.label}
            </button>
          </div>
        )
      })}
    </>
  )
}
