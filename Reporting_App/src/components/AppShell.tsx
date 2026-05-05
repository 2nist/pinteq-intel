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
import { ToastContainer, mkToast, type ToastMessage } from './Toast'
import { type ViewState } from '../config/tools'

export type { ViewState } from '../config/tools'

export function AppShell() {
  const [view, setView] = useState<ViewState>('dashboard')
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

  function renderWorkspace() {
    switch (view) {
      case 'dashboard':              return <DashboardWorkspace />
      case 'b4-briefs':              return <B4BriefWorkspace />
      case 'timeline':               return <TimelineWorkspace />
      case 'phone-analysis':         return <PhoneAnalysisWorkspace />
      case 'contact-graph':          return <ContactGraphWorkspace />
      case 'evidence-gap':           return <EvidenceGapWorkspace />
      case 'prosecution-timeline':   return <ProsecutionTimelineWorkspace />
      case 'settings':
        return (
          <div className="flex-1 overflow-y-auto p-8">
            <h1 className="text-xl font-semibold text-main mb-1">Settings</h1>
            <p className="text-muted text-sm">Configuration options — planned.</p>
          </div>
        )
    }
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-base">
      <TopStatusBar onSearch={handleSearch} />
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <FixedLeftNav currentView={view} onViewChange={setView} />
        <main className="flex-1 min-w-0 flex flex-col overflow-hidden">
          {renderWorkspace()}
        </main>
      </div>
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  )
}
