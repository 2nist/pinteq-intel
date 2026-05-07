import { useCallback, useState } from 'react'
import { TopStatusBar } from './TopStatusBar'
import { FixedLeftNav } from './FixedLeftNav'
import { DashboardWorkspace }           from './DashboardWorkspace'
import { B4BriefWorkspace }             from './B4BriefWorkspace'
import { TimelineWorkspace }            from './TimelineWorkspace'
import { PhoneAnalysisWorkspace }       from './PhoneAnalysisWorkspace'
import { ContactGraphWorkspace }        from './ContactGraphWorkspace'
import { EvidenceGapWorkspace }         from './EvidenceGapWorkspace'
import { ProsecutionTimelineWorkspace } from './ProsecutionTimelineWorkspace'
import { OSINTSearchWorkspace }         from './OSINTSearchWorkspace'
import { CaseLawWorkspace }             from './CaseLawWorkspace'
import { RightToolBar }                 from './RightToolBar'
import { ToastContainer, mkToast, type ToastMessage } from './Toast'
import { type ViewState, type RightToolState } from '../config/tools'

export type { ViewState, RightToolState } from '../config/tools'

export function AppShell() {
  const [view, setView] = useState<ViewState>('dashboard')
  const [rightView, setRightView] = useState<RightToolState>('case-law')
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const addToast = useCallback((message: string, type: ToastMessage['type'] = 'info') => {
    setToasts(prev => [...prev, mkToast(message, type)])
  }, [])

  const dismissToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const handleSearch = useCallback((query: string) => {
    addToast(`Search coming soon: "${query}"`, 'info')
  }, [addToast])

  const handleAction = useCallback((action: string) => {
    if (action === 'compile_report') {
      addToast('Compiling expert PDF report for People v. West...', 'success')
      setTimeout(() => {
        addToast('Report generated successfully. Downloading...', 'info')
      }, 2500)
    } else if (action === 'toggle_tools') {
      setRightView(prev => prev ? null : 'evidence-search')
    }
  }, [addToast])

  function renderWorkspace() {
    switch (view) {
      case 'dashboard':              return <DashboardWorkspace />
      case 'b4-briefs':              return <B4BriefWorkspace />
      case 'timeline':               return <TimelineWorkspace />
      case 'phone-analysis':         return <PhoneAnalysisWorkspace />
      case 'contact-graph':          return <ContactGraphWorkspace />
      case 'evidence-gap':           return <EvidenceGapWorkspace />
      case 'prosecution-timeline':   return <ProsecutionTimelineWorkspace />
      case 'osint-search':           return <OSINTSearchWorkspace />
      case 'case-law':               return <CaseLawWorkspace />
      case 'settings':
        return (
          <div className="flex-1 overflow-y-auto p-8">
            <h1 className="text-xl font-semibold text-main mb-1">Settings</h1>
            <p className="text-muted text-sm">Configuration options — planned.</p>
          </div>
        )
      default: return null
    }
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-base">
      <TopStatusBar onSearch={handleSearch} onAction={handleAction} />
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <FixedLeftNav currentView={view} onViewChange={setView} />
        <main className="flex-1 min-w-0 flex flex-col overflow-hidden bg-base">
          {renderWorkspace()}
        </main>
        <RightToolBar currentTool={rightView} onToolChange={setRightView} />
      </div>
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  )
}
