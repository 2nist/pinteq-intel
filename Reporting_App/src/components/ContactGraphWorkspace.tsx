import { useState, useEffect, useRef, useMemo } from 'react'
import * as d3 from 'd3'
import { Loader2, SlidersHorizontal, Users, Clock, Activity } from 'lucide-react'
import { fetchNetworkData } from '../lib/interfaceApi'

export function ContactGraphWorkspace() {
  const svgRef = useRef<SVGSVGElement>(null)
  const [graphData, setGraphData] = useState<{ nodes: any[], links: any[] } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedNode, setSelectedNode] = useState<any | null>(null)

  // Filters
  const [minInteractions, setMinInteractions] = useState(1)
  const [activeRoles, setActiveRoles] = useState<Set<string>>(new Set(['target', 'informant', 'suspect', 'witness']))
  const [timeFrame, setTimeFrame] = useState('All Time')

  useEffect(() => {
    fetchNetworkData()
      .then(data => {
        setGraphData({ nodes: data.nodes || [], links: data.links || [] })
        setLoading(false)
      })
      .catch(err => {
        console.error(err)
        setError('Failed to load network data from API.')
        setLoading(false)
      })
  }, [])

  const toggleRole = (role: string) => {
    setActiveRoles(prev => {
      const next = new Set(prev)
      if (next.has(role)) next.delete(role)
      else next.add(role)
      return next
    })
  }

  const filteredData = useMemo(() => {
    if (!graphData) return null

    // ── Time frame window (if not "All Time") ──────────────────────────
    const now = Date.now() / 1000 // current epoch seconds
    let timeCutoff: number | null = null
    if (timeFrame === 'Last 30 Days') {
      timeCutoff = now - 30 * 24 * 3600
    } else if (timeFrame === 'Last 90 Days') {
      timeCutoff = now - 90 * 24 * 3600
    } else if (timeFrame === 'Pre-Incident') {
      // Pre-incident: before the earliest link timestamp
      const timestamps = graphData.links
        .map(l => l.timestamp ? new Date(l.timestamp).getTime() / 1000 : null)
        .filter((t): t is number => t !== null)
      if (timestamps.length > 0) {
        timeCutoff = Math.min(...timestamps) // everything before first communication
      }
    } else if (timeFrame === 'Post-Incident') {
      // Post-incident: after the latest link timestamp
      const timestamps = graphData.links
        .map(l => l.timestamp ? new Date(l.timestamp).getTime() / 1000 : null)
        .filter((t): t is number => t !== null)
      if (timestamps.length > 0) {
        timeCutoff = Math.max(...timestamps) // everything after last communication
      }
    }

    const nodes = graphData.nodes.filter(n => activeRoles.has(n.role || 'witness'))
    const nodeIds = new Set(nodes.map(n => n.id))

    const links = graphData.links.filter(l => {
      const srcId = typeof l.source === 'object' ? l.source.id : l.source
      const tgtId = typeof l.target === 'object' ? l.target.id : l.target

      // ── Apply time frame filter on link timestamp ────────────────────
      if (timeCutoff !== null && l.timestamp) {
        const linkTime = new Date(l.timestamp).getTime() / 1000
        if (timeFrame === 'Pre-Incident') {
          if (linkTime >= timeCutoff) return false
        } else if (timeFrame === 'Post-Incident') {
          if (linkTime <= timeCutoff) return false
        } else {
          // Last 30/90 Days
          if (linkTime < timeCutoff) return false
        }
      }

      return (l.value || 1) >= minInteractions && nodeIds.has(srcId) && nodeIds.has(tgtId)
    })

    return { nodes, links }
  }, [graphData, activeRoles, minInteractions, timeFrame])


  useEffect(() => {
    if (!svgRef.current || !filteredData) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = 800;
    const height = 500;

    const nodes = filteredData.nodes.map(d => Object.create(d));
    const links = filteredData.links.map(d => Object.create(d));

    const simulation = d3.forceSimulation(nodes)
      .force("link", d3.forceLink(links).id((d: any) => d.id).distance(120))
      .force("charge", d3.forceManyBody().strength(-400))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collide", d3.forceCollide().radius((d: any) => 10 + d.connections * 2 + 10));

    svg.append("defs").append("marker")
      .attr("id", "arrow")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 25)
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", "var(--border-slate)");

    const link = svg.append("g")
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke", "var(--border-slate)")
      .attr("stroke-opacity", 0.6)
      .attr("stroke-width", (d: any) => Math.sqrt(d.value))
      .attr("marker-end", "url(#arrow)");

    const nodeGroup = svg.append("g")
      .selectAll("g")
      .data(nodes)
      .join("g")
      .attr("cursor", "pointer")
      .on("click", (event: any, d: any) => {
        setSelectedNode(d)
        event.stopPropagation()
      })
      .call(d3.drag<any, any>()
        .on("start", (event: any, d: any) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on("drag", (event: any, d: any) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on("end", (event: any, d: any) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        }));

    svg.on("click", () => setSelectedNode(null));

    nodeGroup.append("circle")
      .attr("r", (d: any) => 10 + d.connections * 1.5)
      .attr("fill", (d: any) => {
        if (d.role === "target") return "#991B1B";
        if (d.role === "informant") return "#D67F5C";
        if (d.role === "suspect") return "#EAB308";
        return "var(--color-graph)";
      })
      .attr("stroke", (d: any) => selectedNode?.id === d.id ? "var(--accent-terra)" : "var(--bg-base)")
      .attr("stroke-width", (d: any) => selectedNode?.id === d.id ? 4 : 2);

    nodeGroup.append("text")
      .text((d: any) => d.id)
      .attr("x", (d: any) => 15 + d.connections * 1.5)
      .attr("y", 4)
      .attr("font-size", "12px")
      .attr("fill", "var(--text-main)")
      .attr("font-family", "sans-serif")
      .style("pointer-events", "none");

    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      nodeGroup.attr("transform", (d: any) => `translate(${d.x},${d.y})`);
    });

    return () => {
      simulation.stop();
    };
  }, [filteredData, selectedNode]);

  const stats = useMemo(() => {
    if (!filteredData || filteredData.nodes.length === 0) return null;

    let primaryHub = filteredData.nodes[0];
    for (const node of filteredData.nodes) {
      if ((node.connections || 0) > (primaryHub.connections || 0)) {
        primaryHub = node;
      }
    }

    let highestLink = filteredData.links[0];
    for (const link of filteredData.links) {
      if ((link.value || 0) > (highestLink?.value || 0)) {
        highestLink = link;
      }
    }

    const parent: Record<string, string> = {};
    const find = (i: string): string => {
      if (parent[i] === i) return i;
      return parent[i] = find(parent[i]);
    };
    filteredData.nodes.forEach(n => parent[n.id] = n.id);
    filteredData.links.forEach(l => {
      const srcId = typeof l.source === 'object' ? l.source.id : l.source;
      const tgtId = typeof l.target === 'object' ? l.target.id : l.target;
      if (parent[srcId] && parent[tgtId]) {
        parent[find(srcId)] = find(tgtId);
      }
    });
    const components = new Set(filteredData.nodes.map(n => find(n.id))).size;
    const isolatedCount = components > 1 ? components : 0;

    return { primaryHub, highestLink, isolatedCount };
  }, [filteredData]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-base">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--color-graph)]" />
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
    <div className="flex-1 overflow-y-auto p-8 bg-base flex flex-col">
      <div className="flex-1 max-w-6xl mx-auto w-full">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-main mb-2">Contact Network Graph</h1>
            <p className="text-muted text-sm max-w-2xl">
              Force-directed visualization of phone analysis and communication clusters. Node size represents total connections; edge thickness represents communication frequency.
            </p>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="bg-panel border border-slate rounded-lg p-4 mb-6 flex flex-wrap gap-6 items-center">
          <div className="flex items-center gap-2 text-sm font-semibold text-main border-r border-slate pr-6">
            <SlidersHorizontal className="w-4 h-4 text-[var(--accent-terra)]" />
            Filters
          </div>

          {/* Time Frame — filters links by backend timestamp metadata */}

          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted" />
            <select
              className="bg-elevated border border-slate rounded px-2 py-1 text-xs text-main outline-none focus:border-blue-500"
              value={timeFrame}
              onChange={(e) => setTimeFrame(e.target.value)}
            >
              <option>All Time</option>
              <option>Last 30 Days</option>
              <option>Pre-Incident</option>
              <option>Post-Incident</option>
            </select>
          </div>

          {/* Frequency/Interactions */}
          <div className="flex items-center gap-3">
            <Activity className="w-4 h-4 text-muted" />
            <span className="text-xs text-muted">Min Interactions:</span>
            <input
              type="range"
              min="1" max="10"
              value={minInteractions}
              onChange={(e) => setMinInteractions(parseInt(e.target.value))}
              className="w-24 accent-[var(--accent-terra)]"
            />
            <span className="text-xs font-mono text-main w-4">{minInteractions}</span>
          </div>

          {/* Roles */}
          <div className="flex items-center gap-2 ml-auto">
            <Users className="w-4 h-4 text-muted mr-1" />
            {[
              { id: 'target', label: 'Target', color: '#991B1B' },
              { id: 'informant', label: 'Informant', color: '#D67F5C' },
              { id: 'suspect', label: 'Suspect', color: '#EAB308' },
              { id: 'witness', label: 'Witness', color: 'var(--color-graph)' }
            ].map(role => (
              <label key={role.id} className="flex items-center gap-1.5 cursor-pointer mr-3 group">
                <input
                  type="checkbox"
                  checked={activeRoles.has(role.id)}
                  onChange={() => toggleRole(role.id)}
                  className="w-3 h-3 rounded border-slate accent-[var(--accent-terra)]"
                />
                <span className="text-xs text-muted group-hover:text-main transition-colors">{role.label}</span>
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: role.color }}></div>
              </label>
            ))}
          </div>
        </div>

        <div className="flex gap-6">
          <div className="flex-1 bg-panel border border-slate rounded-lg p-6 relative">
            <div className="flex justify-center overflow-hidden bg-elevated/30 rounded-lg border border-slate/50">
              <svg ref={svgRef} width="800" height="500" className="cursor-move" />
            </div>
            {filteredData?.nodes.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-panel/90 border border-slate px-4 py-2 rounded text-sm text-muted">No contacts match the current filters.</div>
              </div>
            )}
          </div>

          {selectedNode && (
            <div className="w-64 shrink-0 bg-panel border border-slate rounded-lg p-4 h-fit">
              <h2 className="text-lg font-semibold text-main border-b border-slate pb-2 mb-4">Node Details</h2>
              <div className="space-y-4 text-sm">
                <div>
                  <span className="text-muted block text-xs">Identifier</span>
                  <span className="text-main font-medium">{selectedNode.id}</span>
                </div>
                <div>
                  <span className="text-muted block text-xs">Role</span>
                  <span className="text-main capitalize">{selectedNode.role || 'Unknown'}</span>
                </div>
                <div>
                  <span className="text-muted block text-xs">Connections</span>
                  <span className="text-main">{selectedNode.connections || 0}</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedNode(null)}
                className="mt-6 w-full py-1.5 bg-elevated hover:bg-slate border border-slate rounded text-xs font-medium text-main transition-colors"
              >
                Clear Selection
              </button>
            </div>
          )}
        </div>

        {stats && (
          <div className="grid grid-cols-3 gap-6 mt-6">
            <div className="bg-panel border border-slate p-5 rounded-lg">
              <h3 className="text-sm font-medium text-muted">Primary Hub</h3>
              <p className="text-lg font-semibold text-main mt-1">{stats.primaryHub?.id || 'N/A'}</p>
              <p className="text-xs text-muted mt-1">{stats.primaryHub?.connections || 0} distinct connections</p>
            </div>
            <div className="bg-panel border border-slate p-5 rounded-lg">
              <h3 className="text-sm font-medium text-muted">Highest Frequency</h3>
              <p className="text-lg font-semibold text-main mt-1">
                {stats.highestLink ? `${typeof stats.highestLink.source === 'object' ? stats.highestLink.source.id : stats.highestLink.source} ↔ ${typeof stats.highestLink.target === 'object' ? stats.highestLink.target.id : stats.highestLink.target}` : 'N/A'}
              </p>
              <p className="text-xs text-muted mt-1">{stats.highestLink?.value || 0} interactions</p>
            </div>
            <div className="bg-panel border border-slate p-5 rounded-lg">
              <h3 className="text-sm font-medium text-muted">Isolated Clusters</h3>
              <p className="text-lg font-semibold text-main mt-1">{stats.isolatedCount} detected</p>
              <p className="text-xs text-muted mt-1">{stats.isolatedCount === 0 ? "All nodes are connected" : "Some nodes are disconnected"}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
