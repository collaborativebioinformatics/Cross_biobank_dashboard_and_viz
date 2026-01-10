import React from "react";
import { css } from "@emotion/css";
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

export type RocPoint = { fpr: number; tpr: number };

export type CohortRocSeries = {
  id: string;
  label: string; // e.g., "Nordic Biobank (Sweden)"
  roc: RocPoint[];
};

function clamp01(x: number) {
  if (!Number.isFinite(x)) return 0;
  return Math.max(0, Math.min(1, x));
}

function normalizeRoc(points: RocPoint[] | undefined) {
  // Ensure points are within [0,1] and sorted by FPR
  return (points ?? [])
    .map((p) => ({ fpr: clamp01(p.fpr), tpr: clamp01(p.tpr) }))
    .sort((a, b) => a.fpr - b.fpr);
}

/** Deterministic palette by index (match cohort color scheme) */
function colorForIndex(i: number) {
  const hue = (i * 47) % 360;
  return `hsl(${hue} 60% 50%)`;
}

/** Trapezoidal AUC (points must be sorted by fpr) */
function auc(points: RocPoint[]) {
  const pts = normalizeRoc(points);
  if (pts.length < 2) return 0;
  let area = 0;
  for (let i = 1; i < pts.length; i++) {
    const x0 = pts[i - 1].fpr;
    const x1 = pts[i].fpr;
    const y0 = pts[i - 1].tpr;
    const y1 = pts[i].tpr;
    area += ((x1 - x0) * (y0 + y1)) / 2;
  }
  return Math.max(0, Math.min(1, area));
}

export function RocCurvesChart({
  cohorts,
  height = 380,
  showAuc = true,
}: {
  cohorts: CohortRocSeries[];
  height?: number;
  showAuc?: boolean;
}) {
  const card = css`
    background: #ffffff;
    border: 1px solid #dcdde1;
    border-radius: 10px;
    padding: 12px;
  `;

  const title = css`
    font-size: 13px;
    font-weight: 700;
    color: #111827;
    margin-bottom: 8px;
  `;

  const diagonal: RocPoint[] = [
    { fpr: 0, tpr: 0 },
    { fpr: 1, tpr: 1 },
  ];

    const orderedCohorts = [...cohorts].sort((a, b) => a.label.localeCompare(b.label));

  const tooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const item = payload[0];
    const p = item?.payload as RocPoint | undefined;
    const name = item?.name as string | undefined;
    if (!p) return null;

    return (
      <div
        className={css`
          background: white;
          border: 1px solid #dcdde1;
          border-radius: 8px;
          padding: 8px 10px;
          font-size: 12px;
          color: #111827;
        `}
      >
        <div className={css`font-weight: 700; margin-bottom: 4px;`}>
          {name ?? "Series"}
        </div>
        <div>FPR: {p.fpr.toFixed(4)}</div>
        <div>TPR: {p.tpr.toFixed(4)}</div>
      </div>
    );
  };

  return (
    <div className={card}>
      <div className={title}>ROC Curves (Clients)</div>

      <div style={{ width: "100%", height }}>
        <ResponsiveContainer>
          <ScatterChart margin={{ top: 10, right: 20, bottom: 30, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              type="number"
              dataKey="fpr"
              domain={[0, 1]}
              tickFormatter={(v) => Number(v).toFixed(2)}
              label={{
                value: "False Positive Rate (FPR)",
                position: "insideBottom",
                offset: -10,
              }}
            />
            <YAxis
              type="number"
              dataKey="tpr"
              domain={[0, 1]}
              tickFormatter={(v) => Number(v).toFixed(2)}
              label={{
                value: "True Positive Rate (TPR)",
                angle: -90,
                position: "insideLeft",
              }}
            />

            <Tooltip content={tooltip} />
            <Legend />

            {/* Chance diagonal */}
            <Scatter
              name="Chance"
              data={diagonal}
              line={
                {
                  stroke: "#9ca3af",
                  strokeWidth: 2,
                  strokeDasharray: "6 6",
                } as any
              }
              fill="transparent"
              shape={() => null}
              isAnimationActive={false}
            />

            {/* Client ROC curves */}
            {orderedCohorts.map((c, i) => {
              const pts = normalizeRoc(c.roc);
              const a = auc(pts);
              const color = colorForIndex(i);
              const name = showAuc
                ? `${c.label} (AUC ${a.toFixed(3)})`
                : c.label;

              return (
                <Scatter
                  key={c.id}
                  name={name}
                  data={pts}
                  line={{ stroke: color, strokeWidth: 2 } as any}
                  fill={color}
                  isAnimationActive={false}
                />
              );
            })}
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
