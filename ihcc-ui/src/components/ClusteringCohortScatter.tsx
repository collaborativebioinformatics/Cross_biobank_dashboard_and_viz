import React from "react";
import { css } from "emotion";
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

/** ---- Types ---- */
export type CohortMeta = { id: string; label: string; n: number };

export type Cluster2DPoint = {
  x: number;
  y: number;
  clusterId: string;
  clusterLabel: string;
  cohortId: string;
  cohortLabel: string;
};

export type Cluster2DDef = {
  id: string;
  label: string;
  centroid: { x: number; y: number };
  range: { sx: number; sy: number };
  effectSize: number;
};

export type CohortClusterCentroid2D = {
  cohortId: string;
  cohortLabel: string;
  clusterId: string;
  clusterLabel: string;
  x: number;
  y: number;
  /** client centroid range (data-space std dev) */
  range: { sx: number; sy: number };
};

export type GlobalCluster2D = {
  id: string;
  label: string;
  centroid: { x: number; y: number };
  // range derived from cohort centroid variability (std dev in x/y)
  range: { sx: number; sy: number };
};

/** ---- Deterministic RNG ---- */
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function randn(rng: () => number) {
  let u = 0,
    v = 0;
  while (u === 0) u = rng();
  while (v === 0) v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function clamp(x: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, x));
}

export function buildMockCohortClusterCentroids2D({
  cohorts,
  seed = 20260109,
}: {
  cohorts: CohortMeta[];
  seed?: number;
}): {
  clusters: GlobalCluster2D[];
  cohortCentroids: CohortClusterCentroid2D[];
  globalCentroids: { clusterId: string; clusterLabel: string; x: number; y: number }[];
} {
  const rng = mulberry32(seed);

  // Base (latent) cluster centers (these are not displayed directly)
  const baseClusters = [
    { id: "k1", label: "Cluster 1", base: { x: -7.5, y: 5.2 }, effectSize: 0.8 },
    { id: "k2", label: "Cluster 2", base: { x: -1.0, y: 2.0 }, effectSize: 1.0 },
    { id: "k3", label: "Cluster 3", base: { x: 4.8, y: 6.5 }, effectSize: 1.3 },
    { id: "k4", label: "Cluster 4", base: { x: 7.2, y: -3.8 }, effectSize: 1.7 },
    { id: "k5", label: "Cluster 5", base: { x: 1.5, y: -6.0 }, effectSize: 1.1 },
  ];

  // Step 1: generate cohort-specific centroids per cluster + per-client range
  const cohortCentroids: CohortClusterCentroid2D[] = [];

  baseClusters.forEach((cl, kIdx) => {
    cohorts.forEach((co, cIdx) => {
      // Cohort systematic shift (makes cohorts distinguishable)
      const angle = (2 * Math.PI * (cIdx + 1)) / cohorts.length + 0.3 * kIdx;
      const cohortShiftMag =
        0.55 *
        cl.effectSize *
        ((cIdx - (cohorts.length - 1) / 2) / ((cohorts.length - 1) / 2));

      const sx = 0.35 * cl.effectSize;
      const sy = 0.35 * cl.effectSize;

      const jitterX = sx * randn(rng);
      const jitterY = sy * randn(rng);

      const x = cl.base.x + cohortShiftMag * Math.cos(angle) + jitterX;
      const y = cl.base.y + cohortShiftMag * Math.sin(angle) + jitterY;

      // client ellipse range (data-space std dev); randomized but stable per seed
      const clientSx = 0.40 * cl.effectSize * (0.75 + 0.60 * rng());
      const clientSy = 0.40 * cl.effectSize * (0.75 + 0.60 * rng());

      cohortCentroids.push({
        cohortId: co.id,
        cohortLabel: co.label,
        clusterId: cl.id,
        clusterLabel: cl.label,
        x: clamp(x, -12, 12),
        y: clamp(y, -12, 12),
        range: { sx: clientSx, sy: clientSy },
      });
    });
  });

  // Step 2: compute global centroids as mean of cohort centroids
  const globalCentroids = baseClusters.map((cl) => {
    const pts = cohortCentroids.filter((p) => p.clusterId === cl.id);
    const meanX = pts.reduce((a, p) => a + p.x, 0) / Math.max(1, pts.length);
    const meanY = pts.reduce((a, p) => a + p.y, 0) / Math.max(1, pts.length);
    return { clusterId: cl.id, clusterLabel: cl.label, x: meanX, y: meanY };
  });

  // Step 3: compute global range as STD across cohort centroids (for global ellipses)
  const clusters: GlobalCluster2D[] = baseClusters.map((cl) => {
    const pts = cohortCentroids.filter((p) => p.clusterId === cl.id);
    const muX = pts.reduce((a, p) => a + p.x, 0) / Math.max(1, pts.length);
    const muY = pts.reduce((a, p) => a + p.y, 0) / Math.max(1, pts.length);

    const varX =
      pts.reduce((a, p) => a + (p.x - muX) ** 2, 0) / Math.max(1, pts.length);
    const varY =
      pts.reduce((a, p) => a + (p.y - muY) ** 2, 0) / Math.max(1, pts.length);

    return {
      id: cl.id,
      label: cl.label,
      centroid: { x: muX, y: muY },
      range: { sx: Math.sqrt(varX), sy: Math.sqrt(varY) },
    };
  });

  return { clusters, cohortCentroids, globalCentroids };
}

/** ---- Rendering helpers ---- */
export function colorForCohortIndex(i: number) {
  const hue = (i * 47) % 360;
  return `hsl(${hue} 60% 50%)`;
}

export function colorForClusterIndex(i: number) {
  const hue = (i * 71 + 20) % 360;
  return `hsl(${hue} 55% 45%)`;
}

/** Larger client centroid marker */
const ClientDot = (props: any) => {
  const { cx, cy, fill } = props;
  if (cx == null || cy == null) return null;
  return (
    <circle
      cx={cx}
      cy={cy}
      r={5}
      fill={fill}
      stroke="#111827"
      strokeOpacity={0.25}
      strokeWidth={1}
    />
  );
};

/** Bigger global centroid marker (diamond) */
const GlobalDiamond = (props: any) => {
  const { cx, cy } = props;
  if (cx == null || cy == null) return null;
  const s = 10;
  return (
    <polygon
      points={`${cx},${cy - s} ${cx + s},${cy} ${cx},${cy + s} ${cx - s},${cy}`}
      fill="#111827"
      opacity={0.95}
    />
  );
};

type PlotBox = { x: number; y: number; w: number; h: number };

export function ClusteringCohortCentroidsScatter({
  clusters,
  cohortCentroids,
  globalCentroids,
  cohorts,
  height = 460,
}: {
  clusters: GlobalCluster2D[];
  cohortCentroids: CohortClusterCentroid2D[];
  globalCentroids: { clusterId: string; clusterLabel: string; x: number; y: number }[];
  cohorts: CohortMeta[];
  height?: number;
}) {
  // one series per cohort (color = cohort)
  const byCohort: Record<string, CohortClusterCentroid2D[]> = {};
  cohorts.forEach((c) => (byCohort[c.id] = []));
  cohortCentroids.forEach((p) => byCohort[p.cohortId]?.push(p));

  // Zoom in: compute domain from displayed centroid extents
  const { xDomain, yDomain } = React.useMemo(() => {
    const allX = [...cohortCentroids.map((p) => p.x), ...globalCentroids.map((g) => g.x)];
    const allY = [...cohortCentroids.map((p) => p.y), ...globalCentroids.map((g) => g.y)];

    const minX = Math.min(...allX);
    const maxX = Math.max(...allX);
    const minY = Math.min(...allY);
    const maxY = Math.max(...allY);

    const spanX = Math.max(1e-6, maxX - minX);
    const spanY = Math.max(1e-6, maxY - minY);

    const padX = Math.max(0.15, 0.02 * spanX);
    const padY = Math.max(0.15, 0.02 * spanY);



    const xd: [number, number] = [clamp(minX - padX, -12, 12), clamp(maxX + padX, -12, 12)];
    const yd: [number, number] = [clamp(minY - padY, -12, 12), clamp(maxY + padY, -12, 12)];
    return { xDomain: xd, yDomain: yd };
  }, [cohortCentroids, globalCentroids]);

  const tooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const p = payload[0]?.payload as any;
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
        <div className={css`font-weight: 700; margin-bottom: 4px;`}>{p.cohortLabel ?? "Global"}</div>
        <div>Cluster: {p.clusterLabel}</div>
        <div>x: {Number(p.x).toFixed(3)}</div>
        <div>y: {Number(p.y).toFixed(3)}</div>
        {p.range?.sx != null && (
          <div>range: (sx={Number(p.range.sx).toFixed(3)}, sy={Number(p.range.sy).toFixed(3)})</div>
        )}
      </div>
    );
  };

  /** ---- Read the REAL cartesian plot box from Recharts clipPath rect ---- */
  const wrapRef = React.useRef<HTMLDivElement | null>(null);
  const [dims, setDims] = React.useState({ w: 0, h: 0 });
  const [plotBox, setPlotBox] = React.useState<PlotBox | null>(null);

  // track container size
  React.useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;

    const update = () => setDims({ w: el.clientWidth || 0, h: el.clientHeight || 0 });
    update();

    const RO = (window as any).ResizeObserver;
    if (RO) {
      const ro = new RO(() => update());
      ro.observe(el);
      return () => ro.disconnect();
    }

    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const readPlotBoxFromRecharts = React.useCallback(() => {
    const root = wrapRef.current;
    if (!root) return;

    // Recharts surface SVG (most builds)
    let svg = root.querySelector("svg.recharts-surface") as SVGSVGElement | null;
    if (!svg) {
      // fallback: first svg in the container
      svg = root.querySelector("svg") as SVGSVGElement | null;
    }
    if (!svg) return;

    const rects = Array.from(svg.querySelectorAll("clipPath rect")) as SVGRectElement[];
    const best = rects
      .map((r) => ({
        x: Number(r.getAttribute("x") ?? 0),
        y: Number(r.getAttribute("y") ?? 0),
        w: Number(r.getAttribute("width") ?? 0),
        h: Number(r.getAttribute("height") ?? 0),
      }))
      .filter((b) => b.w > 0 && b.h > 0)
      .sort((a, b) => b.w * b.h - a.w * a.h)[0];

    if (best && (best.w !== plotBox?.w || best.h !== plotBox?.h || best.x !== plotBox?.x || best.y !== plotBox?.y)) {
      setPlotBox(best);
    }
  }, [plotBox?.h, plotBox?.w, plotBox?.x, plotBox?.y]);

  // re-read after Recharts renders (domain changes will change the internal SVG layout)
  React.useEffect(() => {
    const id = requestAnimationFrame(() => readPlotBoxFromRecharts());
    return () => cancelAnimationFrame(id);
  }, [dims.w, dims.h, xDomain[0], xDomain[1], yDomain[0], yDomain[1], readPlotBoxFromRecharts]);

  // observe DOM mutations (legend, ticks, fonts can shift plot box)
  React.useEffect(() => {
    const root = wrapRef.current;
    if (!root) return;

    const mo = new MutationObserver(() => readPlotBoxFromRecharts());
    mo.observe(root, { childList: true, subtree: true, attributes: true });
    return () => mo.disconnect();
  }, [readPlotBoxFromRecharts]);

  /** ---- Data → pixel mapping using REAL plot box ---- */
  const xMin = xDomain[0];
  const xMax = xDomain[1];
  const yMin = yDomain[0];
  const yMax = yDomain[1];

  const pb = plotBox ?? { x: 0, y: 0, w: dims.w, h: dims.h };

  const xToPx = (x: number) => {
    const t = (x - xMin) / Math.max(1e-9, xMax - xMin);
    return pb.x + t * pb.w;
  };

  const yToPx = (y: number) => {
    const t = (yMax - y) / Math.max(1e-9, yMax - yMin);
    return pb.y + t * pb.h;
  };

  const xRadToPx = (sx: number) => (Math.abs(sx) / Math.max(1e-9, xMax - xMin)) * pb.w;
  const yRadToPx = (sy: number) => (Math.abs(sy) / Math.max(1e-9, yMax - yMin)) * pb.h;

  const cohortIndexById = React.useMemo(() => {
    const m: Record<string, number> = {};
    cohorts.forEach((c, i) => (m[c.id] = i));
    return m;
  }, [cohorts]);

  const sigmaGlobal = 2; // global ellipse radius = 2σ
  const sigmaClient = 1; // client ellipse radius = 1σ

  return (
    <div
      className={css`
        background: #ffffff;
        border: 1px solid #dcdde1;
        border-radius: 10px;
        padding: 12px;
      `}
    >
      <div className={css`font-size: 13px; font-weight: 700; margin-bottom: 8px;`}>
        Cohort Centroids by Cluster (global centroid = mean across cohorts)
      </div>

      <div
        ref={wrapRef}
        className={css`
          position: relative;
          width: 100%;
          height: ${height}px;
        `}
      >
        {/* SVG overlay: ellipses drawn in the SAME coordinate system as Recharts SVG */}
        <svg
          width={dims.w}
          height={dims.h}
          className={css`
            position: absolute;
            inset: 0;
            z-index: 2;
            pointer-events: none;
          `}
        >
          {/* Global ellipses */}
          {clusters.map((cl) => {
            const cx = xToPx(cl.centroid.x);
            const cy = yToPx(cl.centroid.y);

            const rx = Math.max(3, xRadToPx(sigmaGlobal * cl.range.sx));
            const ry = Math.max(3, yRadToPx(sigmaGlobal * cl.range.sy));

            return (
              <g key={`g-${cl.id}`}>
                <ellipse
                  cx={cx}
                  cy={cy}
                  rx={rx}
                  ry={ry}
                  fill="rgba(17,24,39,0.06)"
                  stroke="#111827"
                  strokeOpacity={0.7}
                  strokeWidth={3}
                />
              </g>
            );
          })}

          {/* Client ellipses */}
          {cohortCentroids.map((p) => {
            const cx = xToPx(p.x);
            const cy = yToPx(p.y);

            const rx = Math.max(2, xRadToPx(sigmaClient * p.range.sx));
            const ry = Math.max(2, yRadToPx(sigmaClient * p.range.sy));

            const ci = cohortIndexById[p.cohortId] ?? 0;
            const stroke = colorForCohortIndex(ci);

            return (
              <ellipse
                key={`c-${p.cohortId}-${p.clusterId}`}
                cx={cx}
                cy={cy}
                rx={rx}
                ry={ry}
                fill="none"
                stroke={stroke}
                strokeOpacity={0.55}
                strokeWidth={2}
                strokeDasharray="4 3"
              />
            );
          })}
        </svg>

        {/* Recharts plot */}
        <div
          className={css`
            position: absolute;
            inset: 0;
            z-index: 1;
          `}
        >
          <ResponsiveContainer>
            <ScatterChart margin={{ top: 10, right: 20, bottom: 30, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                type="number"
                dataKey="x"
                domain={xDomain}
                label={{ value: "Dimension 1", position: "insideBottom", offset: -10 }}
              />
              <YAxis
                type="number"
                dataKey="y"
                domain={yDomain}
                label={{ value: "Dimension 2", angle: -90, position: "insideLeft" }}
              />
              <Tooltip content={tooltip} />
              <Legend />

              {cohorts.map((c, i) => (
                <Scatter
                  key={c.id}
                  name={c.label}
                  data={byCohort[c.id]}
                  fill={colorForCohortIndex(i)}
                  shape={ClientDot}
                  isAnimationActive={false}
                />
              ))}

              <Scatter
                name="Global centroids"
                data={globalCentroids.map((g) => ({
                  cohortLabel: "Global",
                  cohortId: "global",
                  clusterId: g.clusterId,
                  clusterLabel: g.clusterLabel,
                  x: g.x,
                  y: g.y,
                }))}
                fill="#111827"
                shape={GlobalDiamond}
                isAnimationActive={false}
              />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
