import React, { useMemo, useState, useEffect } from "react";
import { css } from "@emotion/css";
import ReactECharts from "echarts-for-react";

// Load your data file
import rawData from "../data/federated_matrix.json";

// Polyfill for libs expecting `process`
(window as any).process = { env: {} };

// ---------- TYPES ----------
type MatrixJson = {
  summary: {
    total_cohorts: number;
    total_unique_variables: number;
    common_variables_count: number;
    readiness_percentage: number;
  };
  matrix: {
    [variableName: string]: string[];
  };
  cohort_sizes: {
    [cohortName: string]: number;
  };
};

type VariableRecord = {
  name: string;
  cohorts: string[];
  cohortCount: number;
  domain: string;
};

// ---- Cohort Catalog Types ----
type CohortCatalogRow = {
  cohort_name: string;
  biosample_sample_types: string;
  biospecimens: string;
  cohort_ancestry_asian: string;
  website?: string;
};

// ---------- STATIC DATA ----------
const FEDERATED = rawData as MatrixJson;
const MATRIX = FEDERATED.matrix;
const COHORT_SIZES = FEDERATED.cohort_sizes;
const SUMMARY = FEDERATED.summary;
const COHORTS = Object.keys(COHORT_SIZES).sort();

// ---------- DOMAIN RULES ----------
const DOMAIN_RULES: { [domain: string]: string[] } = {
  Demographics: [
    "age",
    "sex",
    "gender",
    "race",
    "ethnic",
    "country",
    "marital",
    "residence",
    "education",
  ],
  Anthropometrics: [
    "bmi",
    "body mass index",
    "weight",
    "height",
    "waist",
    "hip",
    "anthropo",
  ],
  Lifestyle: [
    "smok",
    "tobacco",
    "alcohol",
    "diet",
    "exercise",
    "activity",
    "lifestyle",
  ],
  "Clinical / Labs": [
    "bp",
    "blood",
    "glucose",
    "hba1c",
    "cholesterol",
    "hdl",
    "ldl",
    "trigly",
    "lab",
    "biochem",
    "diagnosis",
  ],
  "Questionnaires / Scores": [
    "questionnaire",
    "survey",
    "scale",
    "score",
    "instrument",
  ],
  Genomics: ["genotype", "snp", "gene", "allele", "variant"],
  Proteomics: ["protein", "peptide", "mass_spec"],
};

function inferDomain(name: string): string {
  const lower = name.toLowerCase();
  for (const [domain, keys] of Object.entries(DOMAIN_RULES)) {
    if (keys.some((k) => lower.includes(k))) return domain;
  }
  return "Other / Unclassified";
}

function simpleSemanticScore(a: string, b: string): number {
  const norm = (s: string) =>
    s
      .toLowerCase()
      .replace(/[^a-z0-9 \[\]{}]/g, "")
      .split(" ")
      .filter(Boolean);

  const wa = norm(a);
  const wb = norm(b);
  if (wa.length === 0 || wb.length === 0) return 0;

  const setA = new Set(wa);
  const setB = new Set(wb);
  let overlap = 0;
  setA.forEach((w) => {
    if (setB.has(w)) overlap += 1;
  });

  const denom = Math.min(setA.size, setB.size) || 1;
  return overlap / denom;
}

// ---------- YAML EXPORT ----------
function toYAML(value: any, indent = 0): string {
  const pad = "  ".repeat(indent);

  if (
    value === null ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return String(value);
  }
  if (typeof value === "string") {
    if (/[:\-?\[\]\{\},&*!#|>'"%@`]/.test(value)) return JSON.stringify(value);
    return value;
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return "[]";
    return value
      .map((item) => `${pad}- ${toYAML(item, indent + 1).trimStart()}`)
      .join("\n");
  }
  if (typeof value === "object") {
    const entries = Object.entries(value);
    if (entries.length === 0) return "{}";
    return entries
      .map(
        ([k, v]) =>
          `${pad}${k}: ${
            typeof v === "object" && v !== null
              ? "\n" + toYAML(v, indent + 1)
              : toYAML(v, 0)
          }`
      )
      .join("\n");
  }
  return String(value);
}

function downloadFile(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ---------- STYLES ----------
const root = css`
  min-height: 100vh;
  background: #f4f5fb;
  color: #111827;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, "SF Pro Text",
    "Segoe UI", sans-serif;
  padding: 16px 24px 24px;
`;

const shell = css`
  max-width: 1400px;
  margin: 0 auto;
`;

const header = css`
  background: #ffffff;
  border-radius: 18px;
  padding: 18px 22px 16px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 18px 45px rgba(15, 23, 42, 0.05);
  display: flex;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
`;

const brand = css`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const brandTitle = css`
  font-size: 20px;
  font-weight: 700;
  letter-spacing: 0.02em;
`;

const brandSub = css`
  font-size: 13px;
  color: #6b7280;
`;

const kpiRow = css`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 6px;
`;

const kpi = css`
  border-radius: 999px;
  padding: 5px 11px;
  border: 1px solid #e5e7eb;
  background: #f9fafb;
  font-size: 12px;
`;

const exportRow = css`
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: flex-end;
`;

const exportButtons = css`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: flex-end;
`;

const exportButton = css`
  border-radius: 999px;
  border: 1px solid #d1d5db;
  background: #ffffff;
  font-size: 11px;
  padding: 6px 10px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #111827;
  &:hover {
    border-color: #2563eb;
    color: #1d4ed8;
  }
`;

const main = css`
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const section = css`
  background: #ffffff;
  border-radius: 18px;
  border: 1px solid #e5e7eb;
  padding: 14px 18px 16px;
  box-shadow: 0 16px 40px rgba(15, 23, 42, 0.03);
`;

const sectionHeader = css`
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 10px;
  margin-bottom: 10px;
`;

const sectionTitle = css`
  font-size: 15px;
  font-weight: 600;
`;

const sectionSub = css`
  font-size: 12px;
  color: #6b7280;
`;

const twoCol = css`
  display: grid;
  grid-template-columns: minmax(0, 1.05fr) minmax(0, 1.1fr);
  gap: 16px;
  @media (max-width: 960px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

const smallText = css`
  font-size: 11px;
  color: #6b7280;
`;

const chipsRow = css`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 4px;
`;

const chip = css`
  font-size: 11px;
  padding: 3px 9px;
  border-radius: 999px;
  border: 1px solid #e5e7eb;
  background: #f9fafb;
`;

const label = css`
  font-size: 12px;
  color: #6b7280;
  margin-right: 6px;
`;

const select = css`
  border-radius: 999px;
  border: 1px solid #d1d5db;
  background: #ffffff;
  padding: 6px 10px;
  font-size: 12px;
  color: #111827;
  min-width: 220px;
  &:focus {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 1px rgba(37, 99, 235, 0.25);
  }
`;

const matchingGrid = css`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
  margin-top: 12px;
  @media (max-width: 1100px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

const donutCard = css`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const donutTitle = css`
  font-size: 13px;
  font-weight: 500;
  margin-left: 4px;
`;

const donutCaption = css`
  font-size: 11px;
  color: #6b7280;
  margin-left: 4px;
`;

const sankeyContainer = css`
  height: 340px;
`;

const coverageContainer = css`
  height: 260px;
`;

const harmonizationContainer = css`
  height: 260px;
`;

const heatmapWrapper = css`
  margin-top: 8px;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  overflow: hidden;
  font-size: 11px;
`;

const heatmapHeaderRow = css`
  display: grid;
  grid-template-columns: 190px repeat(auto-fit, minmax(48px, 1fr));
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
`;

const heatmapVarCell = css`
  padding: 6px 10px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const heatmapHeadCell = css`
  padding: 6px 4px;
  text-align: center;
  border-left: 1px solid #e5e7eb;
  font-weight: 500;
`;

const heatmapBody = css`
  max-height: 360px;
  overflow-y: auto;
  background: #ffffff;
`;

const heatmapRow = css`
  display: grid;
  grid-template-columns: 190px repeat(auto-fit, minmax(48px, 1fr));
  border-bottom: 1px solid #f3f4f6;
`;

const heatmapCell = css`
  height: 22px;
  border-left: 1px solid #f3f4f6;
`;

const footerNote = css`
  font-size: 11px;
  color: #6b7280;
  margin-top: 8px;
`;

// ---------- DASHBOARD ----------
const Dashboard: React.FC = () => {
  const [selectedVar, setSelectedVar] = useState<string>("");

  // NEW — CSV state moved inside component (correct placement)
  const [catalog, setCatalog] = useState<CohortCatalogRow[]>([]);

  useEffect(() => {
    const loadCsv = async () => {
      try {
        const res = await fetch("/cohort_catalog.csv");
        const text = await res.text();

        const [headerLine, ...lines] = text.trim().split("\n");
        const headers = headerLine.split(",");

        const rows: CohortCatalogRow[] = lines.map((line) => {
          const cols = line.split(",");
          const obj: any = {};
          headers.forEach((h, i) => (obj[h.trim()] = (cols[i] ?? "").trim()));
          return obj as CohortCatalogRow;
        });

        setCatalog(rows);
      } catch (err) {
        console.error("Failed to load cohort_catalog.csv", err);
      }
    };

    loadCsv();
  }, []);

  // Build variable records once
  const variables: VariableRecord[] = useMemo(() => {
    return Object.entries(MATRIX).map(([name, cohortsRaw]) => {
      const uniqueCohorts = Array.from(new Set(cohortsRaw));
      return {
        name,
        cohorts: uniqueCohorts,
        cohortCount: uniqueCohorts.length,
        domain: inferDomain(name),
      };
    });
  }, []);

  // Default reference variable
  const defaultRefVar = useMemo(() => {
    if (variables.length === 0) return "";
    const sorted = [...variables].sort(
      (a, b) => b.cohortCount - a.cohortCount
    );
    return sorted[0].name;
  }, [variables]);

  useEffect(() => {
    if (!selectedVar && defaultRefVar) {
      setSelectedVar(defaultRefVar);
    }
  }, [selectedVar, defaultRefVar]);

  {catalog.length > 0 && (
  <section className={section}>
    <div className={sectionHeader}>
      <div className={sectionTitle}>Cohort Catalog (metadata)</div>
      <div className={sectionSub}>
        Loaded {catalog.length} entries from cohort_catalog.csv
      </div>
    </div>

    <div style={{ overflowX: "auto" }}>
      <table style={{ fontSize: 12, borderCollapse: "collapse", width: "100%" }}>
        <thead>
          <tr>
            {Object.keys(catalog[0]).map((k) => (
              <th
                key={k}
                style={{
                  border: "1px solid #e5e7eb",
                  padding: "6px 8px",
                  background: "#f3f4f6",
                  fontWeight: 500,
                  textTransform: "capitalize"
                }}
              >
                {k.replace(/_/g, " ")}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {catalog.map((row, i) => (
            <tr key={i}>
              {Object.keys(row).map((k) => (
                <td
                  key={k}
                  style={{
                    border: "1px solid #e5e7eb",
                    padding: "6px 8px"
                  }}
                >
                  {(row as any)[k] || "—"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </section>
)}


  // Harmonization buckets (IHCC)
  const harmonizationBuckets = useMemo(() => {
    let fully = 0;
    let moderate = 0;
    let weak = 0;
    let unique = 0;

    variables.forEach((v) => {
      const c = v.cohortCount;
      if (c >= 10) fully += 1;
      else if (c >= 5) moderate += 1;
      else if (c >= 2) weak += 1;
      else unique += 1;
    });

    return { fully, moderate, weak, unique };
  }, [variables]);

  // Coverage per cohort
  const coverageData = useMemo(
    () =>
      COHORTS.map((cohortName) => {
        const count = variables.filter((v) =>
          v.cohorts.includes(cohortName)
        ).length;
        return { cohort: cohortName, count };
      }),
    [variables]
  );

  // Sankey dataset
  const sankeyData = useMemo(() => {
    const topShared = [...variables]
      .filter((v) => v.cohortCount >= 2)
      .sort((a, b) => b.cohortCount - a.cohortCount)
      .slice(0, 20);

    type SankeyNode = { name: string };
    type SankeyLink = { source: string; target: string; value: number };

    const nodesSet = new Set<string>();
    const links: SankeyLink[] = [];

    COHORTS.forEach((c) => nodesSet.add(c));

    topShared.forEach((v) => {
      const varNode = v.name;
      const domainNode = v.domain;

      nodesSet.add(varNode);
      nodesSet.add(domainNode);

      v.cohorts.forEach((c) => {
        nodesSet.add(c);
        links.push({ source: c, target: varNode, value: 1 });
      });

      links.push({
        source: varNode,
        target: domainNode,
        value: v.cohortCount,
      });
    });

    const nodes: SankeyNode[] = Array.from(nodesSet).map((n) => ({ name: n }));
    return { nodes, links };
  }, [variables]);

  // Co-occurrence stats
  const cooccurrence = useMemo(() => {
    const ref = variables.find((v) => v.name === selectedVar);
    if (!ref) return null;

    const refCohorts = new Set(ref.cohorts);
    const refDomain = ref.domain;

    let exact = 0;
    let expanded = 0;
    let hybrid = 0;
    const examples: { name: string; score: number }[] = [];

    variables.forEach((v) => {
      if (v.name === ref.name) return;
      const shared = v.cohorts.filter((c) => refCohorts.has(c)).length;
      if (shared >= 1) {
        exact += 1;
      }
      if (shared >= 1 && v.domain === refDomain) {
        const sim = simpleSemanticScore(ref.name, v.name);
        if (sim >= 0.3) {
          expanded += 1;
          if (shared >= 2) hybrid += 1;
          examples.push({ name: v.name, score: sim });
        }
      }
    });

    examples.sort((a, b) => b.score - a.score);

    return {
      ref,
      exact,
      expanded,
      hybrid,
      examples: examples.slice(0, 20),
    };
  }, [variables, selectedVar]);

  // Top 50 variables for heatmap
  const heatmapVariables = useMemo(
    () =>
      [...variables]
        .sort((a, b) => b.cohortCount - a.cohortCount)
        .slice(0, 50),
    [variables]
  );

  // ---------- ECHARTS OPTIONS ----------
  const harmonizationOption = useMemo(() => {
    const { fully, moderate, weak, unique } = harmonizationBuckets;
    const data = [
      {
        name: "Fully (≥ 10 cohorts)",
        value: fully,
      },
      {
        name: "Moderate (5–9 cohorts)",
        value: moderate,
      },
      {
        name: "Weak (2–4 cohorts)",
        value: weak,
      },
      {
        name: "Unique (1)",
        value: unique,
      },
    ];

    return {
      tooltip: {
        trigger: "item",
        formatter: (p: any) =>
          `${p.name}<br/>${p.value.toLocaleString()} variables (${(
            p.percent ?? 0
          ).toFixed(1)}%)`,
      },
      legend: {
        bottom: 0,
        left: "center",
        textStyle: { fontSize: 11 },
      },
      series: [
        {
          type: "pie",
          radius: ["55%", "75%"],
          center: ["50%", "48%"],
          minShowLabelAngle: 4,
          label: {
            show: true,
            formatter: (p: any) =>
              `${p.value.toLocaleString()} (${(p.percent ?? 0).toFixed(1)}%)`,
            color: "#374151",
            fontSize: 12,
          },
          labelLine: {
            show: true,
            length: 16,
            length2: 8,
            smooth: 0.3,
          },
          data,
          itemStyle: {
            borderColor: "#ffffff",
            borderWidth: 2,
          },
          color: ["#2563eb", "#0ea5e9", "#fbbf24", "#ef4444"],
        },
      ],
    };
  }, [harmonizationBuckets]);

  const coverageOption = useMemo(
    () => ({
      tooltip: {
        trigger: "axis",
        formatter: (params: any) => {
          const p = params[0];
          return `${p.name}<br/>Variables: ${p.value.toLocaleString()}`;
        },
      },
      grid: { left: 40, right: 10, top: 20, bottom: 55 },
      xAxis: {
        type: "category",
        data: coverageData.map((d) => d.cohort),
        axisLabel: {
          rotate: 40,
          fontSize: 10,
        },
        axisTick: { alignWithLabel: true },
      },
      yAxis: {
        type: "value",
        axisLabel: { fontSize: 10 },
        splitLine: { lineStyle: { color: "#e5e7eb" } },
      },
      series: [
        {
          type: "bar",
          data: coverageData.map((d) => d.count),
          itemStyle: {
            color: "#38bdf8",
            borderRadius: [4, 4, 0, 0],
          },
        },
      ],
    }),
    [coverageData]
  );

  const sankeyOption = useMemo(
    () => ({
      tooltip: {
        trigger: "item",
        formatter: (p: any) => {
          if (p.dataType === "node") return p.name;
          const v = p.data.value ?? p.value;
          return `${p.data.source} → ${p.data.target}<br/>${v.toLocaleString()} shared variable(s)`;
        },
      },
      series: [
        {
          type: "sankey",
          data: sankeyData.nodes,
          links: sankeyData.links,
          emphasis: { focus: "adjacency" },
          nodeWidth: 12,
          nodeGap: 10,
          layoutIterations: 64,
          nodeAlign: "justify" as const,
          lineStyle: {
            color: "source",
            curveness: 0.5,
            opacity: 0.35,
          },
          itemStyle: {
            borderWidth: 1,
            borderColor: "#e5e7eb",
          },
          label: {
            fontSize: 11,
            color: "#111827",
          },
        },
      ],
    }),
    [sankeyData]
  );

  const makeModeOption = (
    title: string,
    matches: number,
    totalOthers: number,
    color: string
  ) => {
    const others = Math.max(totalOthers - matches, 0);
    return {
      tooltip: {
        trigger: "item",
        formatter: (p: any) =>
          `${p.name}<br/>${p.value.toLocaleString()} variables (${(
            p.percent ?? 0
          ).toFixed(1)}%)`,
      },
      series: [
        {
          name: title,
          type: "pie",
          radius: ["55%", "75%"],
          center: ["50%", "52%"],
          label: {
            show: true,
            formatter: (p: any) =>
              p.name === "Matches" ? `${p.value.toLocaleString()}` : "",
            fontSize: 12,
            color: "#1d4ed8",
          },
          labelLine: {
            show: true,
            length: 12,
            length2: 6,
          },
          data: [
            { name: "Matches", value: matches },
            { name: "Other variables", value: others },
          ],
          color: [color, "#e5e7eb"],
          itemStyle: {
            borderColor: "#ffffff",
            borderWidth: 2,
          },
        },
      ],
    };
  };

  const totalOthers = variables.length - 1;

  const cooccurrenceData = cooccurrence;
  const exactOption =
    cooccurrenceData &&
    makeModeOption("Exact", cooccurrenceData.exact, totalOthers, "#2563eb");
  const expandedOption =
    cooccurrenceData &&
    makeModeOption(
      "Expanded",
      cooccurrenceData.expanded,
      totalOthers,
      "#0ea5e9"
    );
  const hybridOption =
    cooccurrenceData &&
    makeModeOption("Hybrid", cooccurrenceData.hybrid, totalOthers, "#4b5563");

  const readinessPct = SUMMARY.readiness_percentage.toFixed(2);

  const handleExportJSON = () => {
    const snapshot = {
      snapshot_id: "coh14_vars11511_r1.04",
      generated_utc: new Date().toISOString(),
      summary: SUMMARY,
      cohorts: COHORTS,
      cohort_sizes: COHORT_SIZES,
      matrix: MATRIX,
    };
    downloadFile(
      JSON.stringify(snapshot, null, 2),
      "fedviz_snapshot.json",
      "application/json"
    );
  };

  const handleExportYAML = () => {
    const snapshot = {
      snapshot_id: "coh14_vars11511_r1.04",
      generated_utc: new Date().toISOString(),
      summary: SUMMARY,
      cohorts: COHORTS,
      cohort_sizes: COHORT_SIZES,
      matrix: MATRIX,
    };
    const yaml = toYAML(snapshot);
    downloadFile(yaml, "fedviz_snapshot.yaml", "text/yaml");
  };

  const handleExportPDF = () => {
    window.print();
  };

  return (
    <div className={root}>
      <div className={shell}>
        <header className={header}>
          <div className={brand}>
            <div className={brandTitle}>FedViz — Federated Cohort Atlas</div>
            <div className={brandSub}>
              IHCC-style harmonization snapshot for cross-biobank modeling.
            </div>
            <div className={kpiRow}>
              <div className={kpi}>
                Snapshot ID: <strong>coh14_vars11511_r1.04</strong>
              </div>
              <div className={kpi}>
                Cohorts: <strong>{SUMMARY.total_cohorts}</strong>
              </div>
              <div className={kpi}>
                Variables:{" "}
                <strong>
                  {SUMMARY.total_unique_variables.toLocaleString()}
                </strong>
              </div>
              <div className={kpi}>
                Harmonization: <strong>{readinessPct}%</strong>
              </div>
            </div>
          </div>
          <div className={exportRow}>
            <div className={smallText}>
              Generated{" "}
              {new Date().toISOString().slice(0, 19).replace("T", " ")} UTC
            </div>
            <div className={exportButtons}>
              <button className={exportButton} onClick={handleExportJSON}>
                ⬇ JSON
              </button>
              <button className={exportButton} onClick={handleExportYAML}>
                ⬇ YAML
              </button>
              <button className={exportButton} onClick={handleExportPDF}>
                ⬇ Print / PDF
              </button>
            </div>
          </div>
        </header>

        <main className={main}>
          <section className={section}>
            <div className={sectionHeader}>
              <div className={sectionTitle}>Harmonization buckets</div>
              <div className={sectionSub}>
                Distribution of variables by cohorts sharing them.
              </div>
            </div>
            <div className={twoCol}>
              <div>
                <div className={harmonizationContainer}>
                  <ReactECharts
                    option={harmonizationOption as any}
                    style={{ height: "100%", width: "100%" }}
                    notMerge
                  />
                </div>
                <div className={smallText} style={{ marginTop: 4 }}>
                  Buckets follow IHCC-style reporting: fully shared variables
                  are candidates for immediate federated modeling; unique
                  variables remain cohort-specific.
                </div>
              </div>
              <div>
                <div className={coverageContainer}>
                  <ReactECharts
                    option={coverageOption as any}
                    style={{ height: "100%", width: "100%" }}
                    notMerge
                  />
                </div>
                <div className={smallText} style={{ marginTop: 4 }}>
                  Variable coverage by cohort. Bars represent the count of
                  harmonized variables present in each biobank.
                </div>
              </div>
            </div>
          </section>

          <section className={section}>
            <div className={sectionHeader}>
              <div className={sectionTitle}>
                Cohort → variable → clinical domain connectivity
              </div>
              <div className={sectionSub}>
                Flow of shared variables across cohorts and high-level clinical
                domains (top 20 shared variables).
              </div>
            </div>
            <div className={sankeyContainer}>
              <ReactECharts
                option={sankeyOption as any}
                style={{ height: "100%", width: "100%" }}
                notMerge
              />
            </div>
            <div className={smallText} style={{ marginTop: 4 }}>
              Thicker links indicate more shared variables. This view highlights
              which domains (e.g., demographics vs labs) are best positioned for
              federated analyses.
            </div>
          </section>

          <section className={section}>
            <div className={sectionHeader}>
              <div className={sectionTitle}>Co-occurrence &amp; matching modes</div>
              <div className={sectionSub}>
                Exact, domain-expanded, and hybrid views for a reference
                variable across cohorts.
              </div>
            </div>

            {cooccurrenceData ? (
              <>
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 10,
                    alignItems: "center",
                    marginBottom: 8,
                  }}
                >
                  <div>
                    <span className={label}>Reference variable:</span>
                    <select
                      className={select}
                      value={selectedVar}
                      onChange={(e) => setSelectedVar(e.target.value)}
                    >
                      {variables.slice(0, 250).map((v) => (
                        <option key={v.name} value={v.name}>
                          {v.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className={chipsRow}>
                    <div className={chip}>
                      Domain: <strong>{cooccurrenceData.ref.domain}</strong>
                    </div>
                    <div className={chip}>
                      Appears in{" "}
                      <strong>
                        {cooccurrenceData.ref.cohortCount} of {COHORTS.length}
                      </strong>{" "}
                      cohorts
                    </div>
                  </div>
                </div>
                <div className={smallText} style={{ marginBottom: 6 }}>
                  Exact = any shared cohort. Expanded = same clinical domain +
                  metadata similarity. Hybrid = expanded + ≥ 2 shared cohorts.
                </div>

                <div className={matchingGrid}>
                  <div className={donutCard}>
                    <div className={donutTitle}>Exact co-occurrence</div>
                    <div className={donutCaption}>
                      Variables sharing ≥ 1 cohort with the reference.
                    </div>
                    <div style={{ height: 200 }}>
                      <ReactECharts
                        option={exactOption as any}
                        style={{ height: "100%", width: "100%" }}
                        notMerge
                      />
                    </div>
                  </div>
                  <div className={donutCard}>
                    <div className={donutTitle}>Domain-expanded</div>
                    <div className={donutCaption}>
                      Same clinical domain + semantic similarity threshold.
                    </div>
                    <div style={{ height: 200 }}>
                      <ReactECharts
                        option={expandedOption as any}
                        style={{ height: "100%", width: "100%" }}
                        notMerge
                      />
                    </div>
                  </div>
                  <div className={donutCard}>
                    <div className={donutTitle}>Hybrid (strong candidates)</div>
                    <div className={donutCaption}>
                      Candidates for harmonized variable definitions across
                      sites.
                    </div>
                    <div style={{ height: 200 }}>
                      <ReactECharts
                        option={hybridOption as any}
                        style={{ height: "100%", width: "100%" }}
                        notMerge
                      />
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "minmax(0,1.1fr) minmax(0,1fr)",
                    gap: 18,
                    marginTop: 10,
                  }}
                >
                  <div>
                    <div className={smallText} style={{ marginBottom: 4 }}>
                      Summary metrics
                    </div>
                    <ul className={smallText} style={{ paddingLeft: 18 }}>
                      <li>
                        Exact matches (≥ 1 cohort in common):{" "}
                        <strong>
                          {cooccurrenceData.exact.toLocaleString()}
                        </strong>
                      </li>
                      <li>
                        Domain-expanded matches (same domain + semantic score ≥
                        0.3):{" "}
                        <strong>
                          {cooccurrenceData.expanded.toLocaleString()}
                        </strong>
                      </li>
                      <li>
                        Hybrid matches (expanded + ≥ 2 shared cohorts):{" "}
                        <strong>
                          {cooccurrenceData.hybrid.toLocaleString()}
                        </strong>
                      </li>
                    </ul>
                    <div className={smallText} style={{ marginTop: 6 }}>
                      Domain-expanded matching approximates semantic similarity
                      using simple token overlap. In production, this can be
                      upgraded to embedding-based similarity for robust
                      ontology-aware matching.
                    </div>
                  </div>
                  <div>
                    <div className={smallText} style={{ marginBottom: 4 }}>
                      Example domain-expanded matches
                    </div>
                    {cooccurrenceData.examples.length === 0 ? (
                      <div className={smallText}>
                        No suitable matches found under current criteria.
                      </div>
                    ) : (
                      <ul className={smallText} style={{ paddingLeft: 18 }}>
                        {cooccurrenceData.examples.map((e) => (
                          <li key={e.name}>
                            {e.name}{" "}
                            <span style={{ color: "#9ca3af" }}>
                              (semantic score ~ {(e.score * 100).toFixed(0)}%)
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className={smallText}>
                Reference variable not found. Check the underlying matrix.
              </div>
            )}
          </section>

          <section className={section}>
            <div className={sectionHeader}>
              <div className={sectionTitle}>
                Presence matrix across cohorts (top variables)
              </div>
              <div className={sectionSub}>
                Binary heatmap of variable presence vs absence for the most
                widely shared variables.
              </div>
            </div>
            <div className={heatmapWrapper}>
              <div className={heatmapHeaderRow}>
                <div className={heatmapVarCell}>Variable</div>
                {COHORTS.map((c) => (
                  <div key={c} className={heatmapHeadCell}>
                    {c}
                  </div>
                ))}
              </div>
              <div className={heatmapBody}>
                {heatmapVariables.map((v) => (
                  <div key={v.name} className={heatmapRow}>
                    <div className={heatmapVarCell}>{v.name}</div>
                    {COHORTS.map((c) => {
                      const present = v.cohorts.includes(c);
                      const bg = present ? "#dbeafe" : "#ffffff";
                      return (
                        <div
                          key={c}
                          className={heatmapCell}
                          style={{ background: bg }}
                          title={`${v.name} @ ${c}: ${
                            present ? "present" : "absent"
                          }`}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
            <div className={smallText}>
              Showing {heatmapVariables.length} of{" "}
              {variables.length.toLocaleString()} variables (ranked by number of
              cohorts). Full matrix is available from the JSON/YAML export for
              reproducible reporting or regulatory dossiers.
            </div>
          </section>

          <div className={footerNote}>
            This dashboard is designed as a thin visualization layer on top of
            harmonized cohort metadata. Any biobank can export IHCC-style JSON,
            which is ingested here to compute readiness metrics, visualize
            cross-cohort structure, and produce citable, versioned snapshots.
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
