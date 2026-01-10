import React from "react";
import { css } from "@emotion/css";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ErrorBar,
  Cell,
} from "recharts";

export type CohortCounts = {
  id: string;
  label: string; // e.g., "Cohort A"
  TN: number;
  FP: number;
  FN: number;
  TP: number;
};

function safeNonNeg(x: number) {
  return Number.isFinite(x) ? Math.max(0, x) : 0;
}

function accuracyFromCounts(c: Pick<CohortCounts, "TP" | "TN" | "FP" | "FN">) {
  const TP = safeNonNeg(c.TP);
  const TN = safeNonNeg(c.TN);
  const FP = safeNonNeg(c.FP);
  const FN = safeNonNeg(c.FN);
  const n = TP + TN + FP + FN;
  return n > 0 ? (TP + TN) / n : 0;
}

/** Wilson score interval for binomial proportion */
function wilsonCI(p: number, n: number, z = 1.96) {
  if (!(n > 0)) return { lower: p, upper: p };
  const z2 = z * z;
  const denom = 1 + z2 / n;
  const center = (p + z2 / (2 * n)) / denom;
  const half =
    (z * Math.sqrt((p * (1 - p)) / n + z2 / (4 * n * n))) / denom;
  return {
    lower: Math.max(0, center - half),
    upper: Math.min(1, center + half),
  };
}

/** Same palette as your pie charts */
function colorForIndex(i: number) {
  const hue = (i * 47) % 360;
  return `hsl(${hue} 60% 50%)`;
}

/** Extract trailing letter for ordering: "Cohort A" -> "A" */
function cohortLetter(label: string) {
  const m = label.match(/([A-Z])\s*$/i);
  return m ? m[1].toUpperCase() : "";
}

function letterRank(label: string) {
  const L = cohortLetter(label);
  if (!L) return Number.POSITIVE_INFINITY;
  const code = L.charCodeAt(0);
  // A=65 ... Z=90
  return code >= 65 && code <= 90 ? code - 65 : Number.POSITIVE_INFINITY;
}

export function CohortAccuracyBarChart({
  cohorts,
  height = 340,
  federatedAccuracy, // 0..1
  ciZ = 1.96,        // 95% ~ 1.96
}: {
  cohorts: CohortCounts[];
  height?: number;
  federatedAccuracy: number;
  ciZ?: number;
}) {
  // Enforce Cohort A -> ... order (based on label trailing letter)
  const ordered = [...cohorts].sort((a, b) => letterRank(a.label) - letterRank(b.label));

  const data = ordered.map((c, i) => {
    const TP = safeNonNeg(c.TP);
    const TN = safeNonNeg(c.TN);
    const FP = safeNonNeg(c.FP);
    const FN = safeNonNeg(c.FN);
    const n = TP + TN + FP + FN;

    const acc = accuracyFromCounts(c);
    const { lower, upper } = wilsonCI(acc, n, ciZ);

    // Recharts ErrorBar expects offset from value: [lowerErr, upperErr]
    const accErr: [number, number] = [acc - lower, upper - acc];

    return {
      id: c.id,
      cohort: c.label,
      accuracy: acc, // 0..1
      accuracyPct: acc * 100,
      n,
      accLower: lower,
      accUpper: upper,
      accErr,
      barColor: colorForIndex(i), // match pie chart color by position
    };
  });

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
    display: flex;
    justify-content: space-between;
    gap: 12px;
    align-items: baseline;
  `;

  const subtitle = css`
    font-size: 12px;
    color: #6b7280;
    font-weight: 500;
  `;

  const tooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    const p = payload[0]?.payload;
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
        <div className={css`font-weight: 700; margin-bottom: 4px;`}>{label}</div>
        <div>Accuracy: {p.accuracyPct.toFixed(2)}%</div>
        <div>
          95% CI: {(p.accLower * 100).toFixed(2)}% – {(p.accUpper * 100).toFixed(2)}%
        </div>
        <div>Total N: {p.n}</div>
      </div>
    );
  };

  return (
    <div className={card}>
      <div className={title}>
        <span>Cohort Accuracies</span>
        <span className={subtitle}>
          Reference (Federated): {(federatedAccuracy * 100).toFixed(2)}%
        </span>
      </div>

      <div style={{ width: "100%", height }}>
        <ResponsiveContainer>
          <BarChart data={data} margin={{ top: 10, right: 16, left: 0, bottom: 58 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="cohort"
              interval={0}
              angle={-25}
              textAnchor="end"
              height={70}
              tick={{ fontSize: 12 }}
            />
            <YAxis
              domain={[0, 1]}
              tickFormatter={(v) => `${Math.round(v * 100)}%`}
              tick={{ fontSize: 12 }}
            />
            <Tooltip content={tooltip} />

            <ReferenceLine
              y={federatedAccuracy}
              stroke="#111827"
              strokeDasharray="6 4"
              label={{
                value: `Federated ${(federatedAccuracy * 100).toFixed(1)}%`,
                position: "right",
                fill: "#111827",
                fontSize: 12,
              }}
            />

            <Bar dataKey="accuracy">
              {/* error bars */}
              <ErrorBar dataKey="accErr" direction="y" width={6} />
              {/* per-bar colors matching the pie chart palette */}
              {data.map((d) => (
                <Cell key={d.id} fill={d.barColor} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
