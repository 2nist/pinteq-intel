import { type RightToolState, RIGHT_TOOLS_REGISTRY } from '../config/tools'
import { X } from 'lucide-react'

// We will import the workspaces here
import { OSINTSearchWorkspace } from './OSINTSearchWorkspace'
import { CaseLawWorkspace } from './CaseLawWorkspace'
import { EvidenceSearchTool } from './EvidenceSearchTool'

interface Props {
  currentTool: RightToolState
  onToolChange: (tool: RightToolState) => void
}

export function RightToolBar({ currentTool, onToolChange }: Props) {
  if (!currentTool) return null

  function renderTool() {
    switch (currentTool) {
      case 'osint-search':    return <OSINTSearchWorkspace />
      case 'case-law':        return <CaseLawWorkspace />
      case 'evidence-search': return <EvidenceSearchTool />
      default:                return null
    }
  }

  return (
    <aside className="w-[450px] h-full self-stretch border-l border-slate bg-panel flex flex-col shrink-0 shadow-2xl relative z-20">
      
      {/* Tool Header / Tabs */}
      <div className="flex items-center justify-between px-2 pt-2 border-b border-slate bg-base shrink-0">
        <div className="flex gap-1 overflow-x-auto">
          {RIGHT_TOOLS_REGISTRY.map(tool => {
            const isActive = currentTool === tool.id
            return (
              <button
                key={tool.id}
                onClick={() => onToolChange(tool.id)}
                className={`px-3 py-2 text-xs font-medium rounded-t-md border border-b-0 transition-colors ${
                  isActive 
                    ? 'bg-panel border-slate text-main border-t-[3px]' 
                    : 'bg-elevated border-transparent text-muted hover:text-main'
                }`}
                style={isActive ? { borderTopColor: tool.accent } : undefined}
              >
                {tool.label}
              </button>
            )
          })}
        </div>
        
        <button 
          onClick={() => onToolChange(null)}
          className="p-1.5 text-muted hover:text-main rounded-md hover:bg-elevated mb-1 transition-colors"
          title="Close Panel"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Active Tool Workspace */}
      <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
        {renderTool()}
      </div>

    </aside>
  )
}
