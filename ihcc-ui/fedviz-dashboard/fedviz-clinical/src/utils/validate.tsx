/** Dashboard.tsx — FedViz Production Edition */
import React, { useMemo, useState, useEffect } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip as ReTooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  Sankey,
} from "recharts";
import { CSSProperties } from "react";

// ---------- Types ----------
type MatrixJSON = {
  summary?: {
    total_cohorts: number;
    total_unique_variables: number;
    common_variables_count: number;
    readiness_percentage: number;
  };
  matrix?: { [varName: string]: string[] };
  cohort_sizes?: { [cohort: string]: number };
};

// ---------- Domain Rules ----------
const DOMAIN_RULES: Record<string, string[]> = {
  "Demographics": ["age", "sex", "gender", "race", "ethnic", "country"],
  "Lifestyle": ["smok", "tobacco", "alcohol", "diet", "exercise"],
  "Anthropometrics": ["bmi", "weight", "height", "waist"],
  "Clinical / Labs": ["blood", "glucose", "hba1c", "hdl", "ldl", "bp"],
  "Genomics": ["gene", "snp", "allele", "variant"],
  "Questionnaires / Scores": ["questionnaire", "survey", "scale", "score"],
};

// ---------- Utils ----------
function inferDomain(name: string): string {
  const lower = name.toLowerCase();
  for (const [domain, keys] of Object.entries(DOMAIN_RULES)) {
    if (keys.some((k) => lower.includes(k))) return domain;
  }
  return "Other / Unclassified";
}

function simpleSemanticScore(a: string, b: string): number {
  const norm = (s: string) =>
    s.toLowerCase().replace(/[^a-z0-9 ]/g, " ").split(" ").filter(Boolean);
  const wa = norm(a), wb = norm(b);
  const setA = new Set(wa), setB = new Set(wb);
  let overlap = 0;
  setA.forEach((w)=> setB.has(w) && overlap++);
  return overlap / Math.max(1, Math.min(setA.size, setB.size));
}

function toYAML(val: any, indent = 0): string {
  const pad = "  ".repeat(indent);
  if (val === null || typeof val === "number" || typeof val === "boolean") return String(val);
  if (typeof val === "string") return JSON.stringify(val);
  if (Array.isArray(val)) return val.map(v => `${pad}- ${toYAML(v, indent+1).trimStart()}`).join("\n");
  if (typeof val === "object") return Object.entries(val)
      .map(([k, v]) =>
        `${pad}${k}: ${
          typeof v === "object" && v !== null ? "\n" + toYAML(v, indent+1) : toYAML(v,0)
        }`
      ).join("\n");
  return String(val);
}

async function sha256(str: string) {
  const buf = new TextEncoder().encode(str);
  const hash = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, "0")).join("");
}

function validate(raw: any) {
  const errors: string[] = [];
  if (!raw.matrix || typeof raw.matrix !== "object") errors.push("Missing matrix");
  if (!raw.cohort_sizes || typeof raw.cohort_sizes !== "object") errors.push("Missing cohort_sizes");
  return { ok: errors.length === 0, errors };
}

function computeSummary(matrix: Record<string,string[]>, cohorts: string[]) {
  const vars = Object.keys(matrix);
  const total = vars.length;
  const common = vars.filter(v => matrix[v].length === cohorts.length).length;
  const pct = total > 0 ? (common / total) * 100 : 0;
  return {
    total_cohorts: cohorts.length,
    total_unique_variables: total,
    common_variables_count: common,
    readiness_percentage: parseFloat(pct.toFixed(2))
  };
}

// ---------- Component ----------
export const Dashboard: React.FC<{ initialData: MatrixJSON }> = ({ initialData }) => {
  const [data, setData] = useState(initialData);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [selectedVar, setSelectedVar] = useState("");
  const [matchingMode, setMatchingMode] = useState<"exact"|"expanded"|"hybrid">("exact");

  // Validate
  useEffect(() => {
    const v = validate(data);
    setWarnings(v.errors);
  }, [data]);

  // Extract
  const MATRIX = data.matrix ?? {};
  const COHORT_SIZES = data.cohort_sizes ?? {};
  const COHORTS = Object.keys(COHORT_SIZES).sort();

  // Summary fallback
  const SUMMARY = data.summary ?? computeSummary(MATRIX, COHORTS);

  // Build variable records
  const variables = useMemo(() => {
    return Object.entries(MATRIX).map(([name, cohortsRaw]) => {
      const unique = Array.from(new Set(cohortsRaw));
      return {
        name,
        cohorts: unique,
        cohortCount: unique.length,
        domain: inferDomain(name),
      };
    });
  }, [MATRIX]);

  // Default ref var
  useEffect(() => {
    if (!selectedVar && variables.length > 0) {
      const top = [...variables].sort((a,b) => b.cohortCount - a.cohortCount)[0];
      setSelectedVar(top.name);
    }
  }, [variables, selectedVar]);

  // Search filter
  const filtered = search
    ? variables.filter(v => v.name.toLowerCase().includes(search.toLowerCase()))
    : variables;

  const totalVars = variables.length || 1;

  // Harmonization buckets
  const buckets = useMemo(() => {
    const res = { fully:0, mod:0, weak:0, uniq:0 };
    variables.forEach(v => {
      const c = v.cohortCount;
      if (c >= 10) res.fully++;
      else if (c >= 5) res.mod++;
      else if (c >= 2) res.weak++;
      else res.uniq++;
    });
    return res;
  }, [variables]);

  const harmonizationPie = [
    { name:"Fully (≥10)", value:buckets.fully, color:"#22c55e" },
    { name:"Moderate (5–9)", value:buckets.mod, color:"#eab308" },
    { name:"Weak (2–4)", value:buckets.weak, color:"#f97316" },
    { name:"Unique (1)", value:buckets.uniq, color:"#ef4444" },
  ];

  // Cohort coverage
  const coverage = COHORTS.map(c => ({
    cohort:c,
    count:variables.filter(v => v.cohorts.includes(c)).length
  }));

  // Sankey (top-20)
  const sankeyData = useMemo(() => {
    const top = variables.filter(v => v.cohortCount>=2)
      .sort((a,b)=>b.cohortCount-a.cohortCount)
      .slice(0,20);

    type Node = { name:string };
    type Link = { source:number; target:number; value:number };

    const nodes:Node[]=[];
    const links:Link[]=[];
    const idxMap = new Map<string,number>();
    const add = (key:string) => {
      if (idxMap.has(key)) return idxMap.get(key)!;
      idxMap.set(key, nodes.length);
      nodes.push({name:key});
      return nodes.length-1;
    };

    COHORTS.forEach(c=>add(c));
    top.forEach(v=>{
      const vIdx = add(`VAR:${v.name}`);
      const dIdx = add(`DOM:${v.domain}`);
      v.cohorts.forEach(c=>{
        links.push({source:add(c), target:vIdx, value:1});
      });
      links.push({source:vIdx, target:dIdx, value:v.cohortCount});
    });

    return {
      nodes: nodes.map(n=>{
        if(n.name.startsWith("VAR:")) return {name:n.name.slice(4)};
        if(n.name.startsWith("DOM:")) return {name:n.name.slice(4)};
        return n;
      }),
      links
    };
  }, [variables, COHORTS]);

  // Co-occurrence
  const refObj = variables.find(v=>v.name===selectedVar);
  const coSummary = useMemo(()=>{
    if(!refObj) return null;
    const out = { exact:0, expanded:0, examples: [] as {name:string;score:number}[] };
    const rc = new Set(refObj.cohorts);
    variables.forEach(v=>{
      if(v.name===refObj.name) return;
      const overlap = v.cohorts.some(c=>rc.has(c));
      if(!overlap) return;
      if(v.name===refObj.name) out.exact++;
      if(v.domain===refObj.domain) {
        const score = simpleSemanticScore(v.name, refObj.name);
        if(score>=0.3) {
          out.expanded++;
          out.examples.push({name:v.name, score});
        }
      }
    });
    out.examples.sort((a,b)=>b.score-a.score);
    return out;
  }, [variables, refObj]);

  // Upload
  const handleUpload = (file:File)=>{
    const r = new FileReader();
    r.onload = () => {
      try {
        const parsed = JSON.parse(r.result as string);
        setData(parsed);
      } catch {
        alert("Invalid JSON");
      }
    };
    r.readAsText(file);
  };

  // Export
  const handleExport = async ()=>{
    const snapshot = {
      generated_utc: new Date().toISOString(),
      summary:SUMMARY,
      cohorts:COHORTS,
      cohort_sizes:COHORT_SIZES,
      matrix:MATRIX
    };
    const json = JSON.stringify(snapshot,null,2);
    const hash = await sha256(json);
    const final = JSON.stringify(snapshot,null,2);
    const blob = new Blob([final], {type:"application/json"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href=url; a.download="fedviz_snapshot.json"; a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportYAML = async ()=>{
    const snapshot = {
      generated_utc:new Date().toISOString(),
      summary:SUMMARY,
      cohorts:COHORTS,
      cohort_sizes:COHORT_SIZES,
      matrix:MATRIX
    };
    const json = JSON.stringify(snapshot);
    const hash = await sha256(json);
    const out = {...snapshot, sha256:hash};
    const yaml = toYAML(out);
    const blob = new Blob([yaml],{type:"text/yaml"});
    const url = URL.createObjectURL(blob);
    const a=document.createElement("a");
    a.href=url;a.download="fedviz_snapshot.yaml";a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportPDF=()=>window.print();

  const text = (s:CSSProperties)=>({...s,fontSize:12,color:"#9ca3af"});

  return (
    <div style={{background:"#020617",color:"#e5e7eb",minHeight:"100vh",fontFamily:"Inter,system-ui"}}>
      <header style={{padding:"18px 28px",borderBottom:"1px solid #111827"}}>
        <div style={{display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:12}}>
          <div>
            <div style={{fontSize:18,fontWeight:700}}>FedViz — Federated Metadata Dashboard</div>
            <div style={text({marginTop:4})}>Schema-level visualization for federated biomedical cohorts</div>
          </div>
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            <label style={{cursor:"pointer",fontSize:11,padding:"6px 10px",borderRadius:999,border:"1px solid #1f2937"}}>
              ⬆ Upload JSON
              <input type="file" accept=".json" style={{display:"none"}}
                onChange={e=>e.target.files && handleUpload(e.target.files[0])}/>
            </label>
            <button onClick={handleExport} style={{fontSize:11,padding:"6px 10px",borderRadius:999,border:"1px solid #1f2937",background:"#0f172a",color:"white"}}>⬇ JSON+SHA256</button>
            <button onClick={handleExportYAML} style={{fontSize:11,padding:"6px 10px",borderRadius:999,border:"1px solid #1f2937",background:"#0f172a",color:"white"}}>⬇ YAML+SHA256</button>
            <button onClick={handleExportPDF} style={{fontSize:11,padding:"6px 10px",borderRadius:999,border:"1px solid #1f2937",background:"#0f172a",color:"white"}}>🖨 PDF</button>
          </div>
        </div>

        <div style={{display:"flex",flexWrap:"wrap",gap:8,marginTop:12,fontSize:11}}>
          <div style={{padding:"5px 10px",border:"1px solid #1f2937",borderRadius:999}}>Cohorts: <b>{SUMMARY.total_cohorts}</b></div>
          <div style={{padding:"5px 10px",border:"1px solid #1f2937",borderRadius:999}}>Variables: <b>{SUMMARY.total_unique_variables}</b></div>
          <div style={{padding:"5px 10px",border:"1px solid #1f2937",borderRadius:999}}>Common: <b>{SUMMARY.common_variables_count}</b></div>
          <div style={{padding:"5px 10px",border:"1px solid #1f2937",borderRadius:999}}>Readiness: <b>{SUMMARY.readiness_percentage}%</b></div>
        </div>

        {warnings.length>0 && (
          <div style={{marginTop:10,padding:8,borderRadius:6,fontSize:11,background:"#7f1d1d"}}>
            <b>⚠ Incomplete metadata:</b>
            <ul style={{margin:0,marginTop:4,paddingLeft:18}}>
              {warnings.map((w,i)=>(<li key={i}>{w}</li>))}
            </ul>
          </div>
        )}

      </header>

      <main style={{padding:"18px 28px"}}>
        {/* Filters */}
        <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:16}}>
          <input placeholder="Search variable…"
            value={search} onChange={e=>setSearch(e.target.value)}
            style={{padding:"6px 10px",borderRadius:999,border:"1px solid #1f2937",background:"#020617",color:"white",fontSize:12}}/>
          <select value={selectedVar} onChange={e=>setSelectedVar(e.target.value)}
            style={{padding:"6px 10px",borderRadius:999,border:"1px solid #1f2937",background:"#020617",color:"white",fontSize:12}}>
            {variables.slice(0,200).map(v=><option key={v.name} value={v.name}>{v.name}</option>)}
          </select>
          <select value={matchingMode} onChange={e=>setMatchingMode(e.target.value as any)}
            style={{padding:"6px 10px",borderRadius:999,border:"1px solid #1f2937",background:"#020617",color:"white",fontSize:12}}>
            <option value="exact">Exact</option>
            <option value="expanded">Domain-expanded</option>
            <option value="hybrid">Hybrid</option>
          </select>
        </div>

        {/* Harmonization + Coverage */}
        <div style={{marginBottom:18}}>
          <div style={{fontSize:13,fontWeight:600,marginBottom:6}}>Harmonization Readiness (Schema-Level)</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <div style={{border:"1px solid #111827",borderRadius:10,padding:12}}>
              <div style={text({marginBottom:6})}>Variables by harmonization bucket</div>
              {variables.length===0 ? (
                <div style={text({padding:20})}>No metadata loaded.</div>
              ) : (
                <div style={{width:"100%",height:260}}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie data={harmonizationPie} dataKey="value" innerRadius={55} outerRadius={90}>
                        {harmonizationPie.map((d,i)=><Cell key={i} fill={d.color}/>)}
                      </Pie>
                      <Legend wrapperStyle={{fontSize:10}}/>
                      <ReTooltip contentStyle={{background:"#020617",border:"1px solid #1f2937",fontSize:11}}/>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            <div style={{border:"1px solid #111827",borderRadius:10,padding:12}}>
              <div style={text({marginBottom:6})}>Variable coverage across cohorts</div>
              {coverage.length===0 ? (
                <div style={text({padding:20})}>No metadata loaded.</div>
              ) : (
                <div style={{width:"100%",height:260}}>
                  <ResponsiveContainer>
                    <BarChart data={coverage}>
                      <CartesianGrid stroke="#111827" strokeDasharray="3 3"/>
                      <XAxis dataKey="cohort" tick={{fontSize:10,fill:"#9ca3af"}} angle={-30} textAnchor="end" height={50}/>
                      <YAxis tick={{fontSize:10,fill:"#9ca3af"}}/>
                      <Bar dataKey="count" fill="#38bdf8" radius={[3,3,0,0]}/>
                      <ReTooltip contentStyle={{background:"#020617",border:"1px solid #1f2937",fontSize:11}}/>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sankey */}
        <div style={{marginBottom:18}}>
          <div style={{fontSize:13,fontWeight:600,marginBottom:6}}>Cohort → Variable → Domain Connectivity Graph</div>
          <div style={{border:"1px solid #111827",borderRadius:10,padding:12}}>
            <div style={{width:"100%",height:260}}>
              {sankeyData.nodes.length===0 ? (
                <div style={text({padding:20})}>Insufficient shared variables for Sankey graph.</div>
              ) : (
                <ResponsiveContainer>
                  <Sankey data={sankeyData} nodePadding={16} nodeWidth={10}>
                    <ReTooltip contentStyle={{background:"#020617",border:"1px solid #1f2937",fontSize:11}}/>
                  </Sankey>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        {/* Co-occurrence */}
        <div style={{marginBottom:18}}>
          <div style={{fontSize:13,fontWeight:600,marginBottom:6}}>Co-occurrence & Semantic Matching</div>
          <div style={{border:"1px solid #111827",borderRadius:10,padding:12}}>
            {!refObj || !coSummary ? (
              <div style={text({padding:20})}>Select a variable to inspect co-occurrence.</div>
            ) : (
              <>
                <div style={text({marginBottom:6})}>
                  Variable <b>{refObj.name}</b> in <b>{refObj.cohortCount}</b> / {COHORTS.length} cohorts · Domain: <b>{refObj.domain}</b>
                </div>
                <ul style={{fontSize:11,color:"#9ca3af",marginLeft:18}}>
                  <li>Domain-expanded matches: <b>{coSummary.expanded}</b></li>
                </ul>
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={text({marginTop:12,maxWidth:800})}>
          🔒 No participant-level data is processed. All metrics are computed from federated schema metadata only.
        </div>

      </main>
    </div>
  );
};
