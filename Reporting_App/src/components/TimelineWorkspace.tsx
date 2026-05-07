import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, Cell, ResponsiveContainer } from 'recharts'
import { Loader2 } from 'lucide-react'
import { fetchTimelineData } from '../lib/interfaceApi'

const getColor = (flag: string | null, category: string) => {
  if (flag === "critical") return "#991B1B"; // red
  if (flag === "gap") return "#FEF3C7"; // amber
  if (category === "forensic") return "#1E6B3C"; // green
  return "var(--color-timeline)"; // default
};

// Custom tooltip to show readable dates
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const startDate = new Date(data.start * 1000).toLocaleString();
    const endDate = new Date(data.end * 1000).toLocaleString();
    
    return (
      <div className="bg-elevated border border-slate p-3 rounded-lg shadow-lg">
        <p className="font-semibold text-main mb-1">{data.event}</p>
        <p className="text-xs text-muted">Start: {startDate}</p>
        <p className="text-xs text-muted">End: {endDate}</p>
        <p className="text-xs mt-2 uppercase font-semibold" style={{ color: getColor(data.flag, data.category) }}>
          {data.category} {data.flag ? `(${data.flag})` : ''}
        </p>
      </div>
    );
  }
  return null;
};

export function TimelineWorkspace() {
  const [timelineData, setTimelineData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchTimelineData()
      .then(data => {
        setTimelineData(data.timeline || [])
        setLoading(false)
      })
      .catch(err => {
        console.error(err)
        setError('Failed to load timeline data from API.')
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-base">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--color-timeline)]" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex-1 p-8 bg-base">
        <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-lg">
          {error}
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto p-8 bg-base">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-semibold text-main mb-2">Timeline Reconstruction</h1>
        <p className="text-muted text-sm mb-8">
          Build and visualize the chronology of events from intake documents. Shows temporal relationships, gaps, and critical windows.
        </p>
        
        <div className="bg-panel border border-slate rounded-lg p-6 mb-8">
          <h2 className="text-sm font-semibold text-main mb-6">Incident Chronology</h2>
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={timelineData} layout="vertical" margin={{ top: 20, right: 30, left: 40, bottom: 5 }}>
                <XAxis 
                  type="number" 
                  domain={['dataMin', 'dataMax']} 
                  tickFormatter={(unixTime) => new Date(unixTime * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} 
                  stroke="var(--text-muted)"
                  fontSize={12}
                />
                <YAxis 
                  type="category" 
                  dataKey="event" 
                  width={150} 
                  stroke="var(--text-muted)"
                  fontSize={12}
                />
                <Tooltip content={<CustomTooltip />} />
                {/* 
                  To simulate a Gantt chart in Recharts, we can use a stacked bar chart 
                  where the first bar is transparent (start time offset) and the second is the duration.
                  Since our data is start/end, we calculate duration.
                */}
                <Bar dataKey={(d) => d.start} stackId="a" fill="transparent" />
                <Bar dataKey={(d) => d.end - d.start} stackId="a" radius={[0, 4, 4, 0]}>
                  {timelineData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getColor(entry.flag, entry.category)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-panel border border-slate rounded-lg overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-elevated border-b border-slate text-muted">
              <tr>
                <th className="px-6 py-3 font-medium">Event</th>
                <th className="px-6 py-3 font-medium">Start Time</th>
                <th className="px-6 py-3 font-medium">Category</th>
                <th className="px-6 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate text-main">
              {timelineData.map((row, i) => (
                <tr key={i} className="hover:bg-elevated transition-colors">
                  <td className="px-6 py-4 font-medium">{row.event}</td>
                  <td className="px-6 py-4 text-muted">{new Date(row.start * 1000).toLocaleString()}</td>
                  <td className="px-6 py-4 capitalize">{row.category}</td>
                  <td className="px-6 py-4">
                    {row.flag ? (
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-slate">
                        {row.flag.toUpperCase()}
                      </span>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  )
}
