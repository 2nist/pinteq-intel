Timeline Visualization — React Components
Best library: Recharts (already available in your React artifact environment)
For timeline reconstruction, use a horizontal bar chart with time on the X-axis and events as labeled bars. This beats a vertical list because it shows temporal relationships visually — gaps appear as empty space, overlapping events stack, and critical windows are immediately obvious.
jsximport { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, Cell } from 'recharts';

const timelineData = [
  { event: "911 Call", start: 1471298160, end: 1471298220, category: "incident", flag: "critical" },
  { event: "Officers Arrive", start: 1471298520, end: 1471298580, category: "response", flag: null },
  { event: "Victim Pronounced", start: 1471299300, end: 1471299360, category: "incident", flag: null },
  { event: "Gap — No Activity", start: 1471299360, end: 1471338480, category: "gap", flag: "gap" },
  { event: "Autopsy Performed", start: 1471338480, end: 1471345680, category: "forensic", flag: null }
];

// Color by category or flag
const getColor = (flag, category) => {
  if (flag === "critical") return "#991B1B"; // red
  if (flag === "gap") return "#FEF3C7"; // amber fill
  if (category === "forensic") return "#1E6B3C"; // green
  return "#4A5A63"; // slate default
};

<BarChart width={800} height={400} data={timelineData} layout="horizontal">
  <XAxis type="number" domain={['dataMin', 'dataMax']} tickFormatter={(unixTime) => new Date(unixTime * 1000).toLocaleTimeString()} />
  <YAxis type="category" dataKey="event" width={150} />
  <Tooltip />
  <Bar dataKey="end" stackId="a">
    {timelineData.map((entry, index) => (
      <Cell key={`cell-${index}`} fill={getColor(entry.flag, entry.category)} />
    ))}
  </Bar>
</BarChart>
Why this works: Chuck can see at a glance where the 11-hour gap is between scene departure and autopsy. The visual empty space is more powerful than a table row saying "gap detected."
Alternative for simpler cases: Use a vertical timeline component (custom or from react-vertical-timeline-component if you add it) for fewer events. Good for witness interview sequences or single-day incident reconstructions.

Phone Analysis — Network Graph
Best library: D3.js force-directed graph (already available)
For contact network visualization, a force-directed graph beats any table. Nodes are people, edges are phone calls/messages, edge thickness represents frequency, node size represents total connections.
jsximport * as d3 from 'd3';
import { useEffect, useRef } from 'react';

function ContactNetworkGraph({ nodes, links }) {
  const svgRef = useRef();

  useEffect(() => {
    const svg = d3.select(svgRef.current);
    const width = 800, height = 600;

    // Force simulation
    const simulation = d3.forceSimulation(nodes)
      .force("link", d3.forceLink(links).id(d => d.id).distance(100))
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2));

    // Draw links
    const link = svg.append("g")
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke", "#999")
      .attr("stroke-width", d => Math.sqrt(d.callCount / 5)); // thickness by frequency

    // Draw nodes
    const node = svg.append("g")
      .selectAll("circle")
      .data(nodes)
      .join("circle")
      .attr("r", d => 5 + d.connectionCount * 2) // size by connections
      .attr("fill", d => d.role === "informant" ? "#D67F5C" : "#4A5A63")
      .call(d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended));

    // Labels
    const label = svg.append("g")
      .selectAll("text")
      .data(nodes)
      .join("text")
      .text(d => d.name)
      .attr("font-size", 12)
      .attr("dx", 12)
      .attr("dy", 4);

    simulation.on("tick", () => {
      link
        .attr("x1", d => d.source.x)
        .attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x)
        .attr("y2", d => d.target.y);

      node
        .attr("cx", d => d.x)
        .attr("cy", d => d.y);

      label
        .attr("x", d => d.x)
        .attr("y", d => d.y);
    });

    function dragstarted(event, d) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event, d) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event, d) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

  }, [nodes, links]);

  return <svg ref={svgRef} width={800} height={600}></svg>;
}
Why this works: Van Raalte appears as a large node in the center with thick edges to all four informants. The informants cluster around him. If any informants are connected to each other, those edges appear too. Chuck can drag nodes around to explore the structure.
Simpler alternative: Use Recharts Sankey diagram for showing call flow between parties. Less interactive but easier to implement.

Evidence Gap Analysis — Stacked Bar Chart
Best visualization: Horizontal stacked bars showing claim strength distribution
jsximport { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, Cell } from 'recharts';

const gapData = [
  { category: "Defendant Presence", strong: 2, weak: 5, suspect: 8 },
  { category: "Intent", strong: 1, weak: 3, suspect: 4 },
  { category: "Timeline", strong: 6, weak: 2, suspect: 1 },
  { category: "Physical Evidence", strong: 3, weak: 4, suspect: 2 }
];

<BarChart width={600} height={300} data={gapData} layout="horizontal">
  <XAxis type="number" />
  <YAxis type="category" dataKey="category" />
  <Tooltip />
  <Legend />
  <Bar dataKey="strong" stackId="a" fill="#1E6B3C" name="Strong" />
  <Bar dataKey="weak" stackId="a" fill="#FEF3C7" name="Weak" />
  <Bar dataKey="suspect" stackId="a" fill="#FEE2E2" name="Suspect" />
</BarChart>
Why this works: Chuck sees immediately that "Defendant Presence" has 8 suspect claims and only 2 strong ones. That's his weakest category. Timeline has 6 strong claims — that's where prosecution is solid.
Alternative: Use a heatmap table with color-coded cells. Each row is a claim, columns are strength metrics (corroboration, source independence, physical evidence). Red/amber/green cells make weak spots obvious.

Prosecution Timeline Deconstruction — Interactive Assertion Table
Best component: Filterable/sortable data table with expandable rows
Use a library like react-table or build custom with state:
jsximport { useState } from 'react';

function AssertionTable({ assertions }) {
  const [filter, setFilter] = useState("all"); // all, weak, suspect, strong
  const [expanded, setExpanded] = useState(new Set());

  const filtered = assertions.filter(a => 
    filter === "all" || a.strength === filter
  );

  const toggleExpand = (id) => {
    const newExpanded = new Set(expanded);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpanded(newExpanded);
  };

  return (
    <div>
      <div className="filters">
        <button onClick={() => setFilter("all")}>All ({assertions.length})</button>
        <button onClick={() => setFilter("weak")}>Weak ({assertions.filter(a => a.strength === "weak").length})</button>
        <button onClick={() => setFilter("suspect")}>Suspect ({assertions.filter(a => a.strength === "suspect").length})</button>
      </div>
      
      <table>
        <thead>
          <tr>
            <th>Claim</th>
            <th>Source</th>
            <th>Strength</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map(assertion => (
            <>
              <tr key={assertion.id} onClick={() => toggleExpand(assertion.id)}>
                <td>{assertion.claim}</td>
                <td>{assertion.source}</td>
                <td>
                  <span className={`badge badge-${assertion.strength}`}>
                    {assertion.strength.toUpperCase()}
                  </span>
                </td>
                <td>
                  <button>{expanded.has(assertion.id) ? "▼" : "▶"}</button>
                </td>
              </tr>
              {expanded.has(assertion.id) && (
                <tr>
                  <td colSpan={4}>
                    <div className="expansion-panel">
                      <p><strong>Impeachment Strategy:</strong> {assertion.impeachment}</p>
                      <p><strong>Supporting Evidence:</strong> {assertion.evidence}</p>
                      <p><strong>Cross-Exam Questions:</strong></p>
                      <ul>
                        {assertion.questions.map((q, i) => <li key={i}>{q}</li>)}
                      </ul>
                    </div>
                  </td>
                </tr>
              )}
            </>
          ))}
        </tbody>
      </table>
    </div>
  );
}
Why this works: Chuck filters to "suspect" claims and gets just the 8 assertions he needs to attack. Clicks one to expand and sees the impeachment strategy and cross-examination questions ready to use.
Enhancement: Add a search box that filters by keyword. Chuck types "Van Raalte" and gets only assertions sourced from him.

Additional Visual Indicators
1. Status badges throughout the UI
jsxfunction StatusBadge({ status }) {
  const colors = {
    strong: "bg-green-100 text-green-800",
    weak: "bg-amber-100 text-amber-800",
    suspect: "bg-red-100 text-red-800",
    gap: "bg-gray-100 text-gray-800",
    critical: "bg-red-600 text-white"
  };
  
  return (
    <span className={`px-2 py-1 rounded text-xs font-medium ${colors[status]}`}>
      {status.toUpperCase()}
    </span>
  );
}
Use these in tables, timelines, and cards to give instant visual feedback.

2. Progress indicators for processing status
jsxfunction ProcessingStatus({ file }) {
  const stages = [
    { name: "Ingested", completed: true },
    { name: "Classified", completed: true },
    { name: "Extracted", completed: true },
    { name: "Indexed", completed: file.status === "indexed" },
    { name: "Uploaded", completed: file.status === "complete" }
  ];

  return (
    <div className="flex items-center gap-2">
      {stages.map((stage, i) => (
        <div key={i} className="flex items-center">
          <div className={`w-3 h-3 rounded-full ${stage.completed ? 'bg-green-500' : 'bg-gray-300'}`} />
          {i < stages.length - 1 && <div className="w-8 h-0.5 bg-gray-300" />}
        </div>
      ))}
    </div>
  );
}
Shows Chuck exactly where each file is in the pipeline without requiring technical knowledge.

3. Sparklines for call frequency trends
jsximport { LineChart, Line } from 'recharts';

function CallFrequencySparkline({ dailyCounts }) {
  return (
    <LineChart width={100} height={30} data={dailyCounts}>
      <Line type="monotone" dataKey="count" stroke="#4A5A63" strokeWidth={2} dot={false} />
    </LineChart>
  );
}
Inline in tables next to contact names. Chuck sees at a glance that Van Raalte's call pattern spiked right before the incident.

4. Color-coded heat calendar
For showing communication patterns over time:
jsxfunction HeatCalendar({ dates }) {
  const intensity = (count) => {
    if (count === 0) return "bg-gray-100";
    if (count < 5) return "bg-terra-200";
    if (count < 10) return "bg-terra-400";
    return "bg-terra-600";
  };

  return (
    <div className="grid grid-cols-7 gap-1">
      {dates.map(date => (
        <div
          key={date.date}
          className={`w-8 h-8 ${intensity(date.callCount)} rounded`}
          title={`${date.date}: ${date.callCount} calls`}
        />
      ))}
    </div>
  );
}
Shows Chuck which days had heavy communication. Looks like GitHub's contribution graph.

5. Relationship strength indicators
Visual weight for network connections:
jsxfunction RelationshipIndicator({ strength }) {
  const bars = Math.ceil(strength / 20); // 0-100 → 0-5 bars
  
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(i => (
        <div
          key={i}
          className={`w-1 h-4 rounded ${i <= bars ? 'bg-slate-600' : 'bg-gray-200'}`}
        />
      ))}
    </div>
  );
}
5 bars = frequent contact, 1 bar = minimal contact. Appears next to names in relationship tables.