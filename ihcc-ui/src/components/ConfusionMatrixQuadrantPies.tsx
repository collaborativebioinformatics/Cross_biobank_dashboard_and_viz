import React from "react";
import { css } from "@emotion/css";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

export type CohortCounts = {
  id: string;
  label: string;
  TN: number;
  FP: number;
  FN: number;
  TP: number;
};

type QuadrantKey = "TN" | "FP" | "FN" | "TP";

type Slice = {
  cohortId: string;
  cohortLabel: string;
  value: number;
};

function safeNonNeg(x: number) {
  return Number.isFinite(x) ? Math.max(0, x) : 0;
}

function colorForIndex(i: number) {
  // deterministic palette
  const hue = (i * 47) % 360;
  return `hsl(${hue} 60% 50%)`;
}

function buildSlices(cohorts: CohortCounts[], key: QuadrantKey): Slice[] {
  return cohorts.map((c) => ({
    cohortId: c.id,
    cohortLabel: c.label,
    value: safeNonNeg(c[key]),
  }));
}

function sumSlices(slices: Slice[]) {
  return slices.reduce((s, x) => s + safeNonNeg(x.value), 0);
}

function formatPct(value: number, total: number) {
  if (total <= 0) return "0.0%";
  return `${((value / total) * 100).toFixed(1)}%`;
}

function QuadrantPie({
  title,
  subtitle,
  slices,
  height = 220,
}: {
  title: string;
  subtitle: string;
  slices: Slice[];
  height?: number;
}) {
  const total = sumSlices(slices);

  const card = css`
    background: #ffffff;
    border: 1px solid #dcdde1;
    border-radius: 10px;
    padding: 12px;
    min-width: 0;
  `;

  const header = css`
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 8px;
    margin-bottom: 8px;
  `;

  const titleStyle = css`
    font-size: 13px;
    font-weight: 700;
    color: #111827;
  `;

  const subtitleStyle = css`
    font-size: 12px;
    color: #6b7280;
    font-weight: 500;
    text-align: right;
  `;

  const body = css`
    display: grid;
    grid-template-columns: 220px 1fr;
    gap: 12px;
    align-items: start;
  `;

  const legend = css`
    display: grid;
    gap: 6px;
    font-size: 12px;
    color: #111827;
  `;

  const legendRow = css`
    display: grid;
    grid-template-columns: 14px 1fr auto;
    gap: 8px;
    align-items: center;
  `;

  const swatch = (bg: string) => css`
    width: 12px;
    height: 12px;
    border-radius: 3px;
    background: ${bg};
    border: 1px solid rgba(0, 0, 0, 0.08);
  `;

  const footer = css`
    margin-top: 8px;
    font-size: 12px;
    color: #6b7280;
  `;

  // Tooltip component
  const tooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const p = payload[0]?.payload as Slice | undefined;
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
        <div className={css`font-weight: 700; margin-bottom: 2px;`}>{p.cohortLabel}</div>
        <div>Count: {p.value}</div>
        <div>Share: {formatPct(p.value, total)}</div>
      </div>
    );
  };

  return (
    <div className={card}>
      <div className={header}>
        <div className={titleStyle}>{title}</div>
        <div className={subtitleStyle}>{subtitle}</div>
      </div>

      <div className={body}>
        <div
          className={css`
            width: 220px;
            height: ${height}px; /* required for ResponsiveContainer */
          `}
        >
          {total <= 0 ? (
            <div
              className={css`
                height: 100%;
                border: 1px dashed #dcdde1;
                border-radius: 8px;
                display: flex;
                align-items: center;
                justify-content: center;
                color: #6b7280;
                font-size: 12px;
              `}
            >
              No data
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip content={tooltip} />
                <Pie
                  data={slices}
                  dataKey="value"
                  nameKey="cohortLabel"
                  cx="50%"
                  cy="50%"
                  innerRadius="55%"
                  outerRadius="85%"
                  paddingAngle={1}
                >
                  {slices.map((_, i) => (
                    <Cell key={`cell-${i}`} fill={colorForIndex(i)} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className={legend}>
          {slices.map((s, i) => (
            <div key={s.cohortId} className={legendRow}>
              <div className={swatch(colorForIndex(i))} />
              <div>{s.cohortLabel}</div>
              <div className={css`color:#6b7280;`}>
                {s.value} ({formatPct(s.value, total)})
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={footer}>Total: {total}</div>
    </div>
  );
}

export function ConfusionMatrixQuadrantPiesRecharts({
  cohorts,
}: {
  cohorts: CohortCounts[];
}) {
  const grid = css`
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    align-items: start;
  `;

  const tn = buildSlices(cohorts, "TN");
  const fp = buildSlices(cohorts, "FP");
  const fn = buildSlices(cohorts, "FN");
  const tp = buildSlices(cohorts, "TP");

  return (
    <div className={grid}>
      <QuadrantPie title="TN" subtitle="Actual: Negative • Predicted: Negative" slices={tn} />
      <QuadrantPie title="FP" subtitle="Actual: Negative • Predicted: Positive" slices={fp} />
      <QuadrantPie title="FN" subtitle="Actual: Positive • Predicted: Negative" slices={fn} />
      <QuadrantPie title="TP" subtitle="Actual: Positive • Predicted: Positive" slices={tp} />
    </div>
  );
}
