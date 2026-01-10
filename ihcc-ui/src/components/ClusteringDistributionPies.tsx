import React from "react";
import { css } from "emotion";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts";

import { colorForCohortIndex, colorForClusterIndex } from "./ClusteringCohortScatter";
import type { CohortMeta, CohortClusterCentroid2D } from "./ClusteringCohortScatter";

type PieDatum = { id: string; name: string; value: number };

function pctLabel({ percent }: any) {
  const p = Math.round((percent ?? 0) * 100);
  return p >= 6 ? `${p}%` : "";
}

function safeN(n: any) {
  return Number.isFinite(n) ? Number(n) : 0;
}

function buildClusterPieData(
  clusters: { id: string; label: string }[],
  cohortCentroids: CohortClusterCentroid2D[]
): PieDatum[] {
  const counts: Record<string, number> = {};
  clusters.forEach((c) => (counts[c.id] = 0));

  cohortCentroids.forEach((p) => {
    counts[p.clusterId] = (counts[p.clusterId] ?? 0) + 1;
  });

  return clusters.map((c) => ({
    id: c.id,
    name: c.label,
    value: counts[c.id] ?? 0,
  }));
}

function buildCohortSamplesPieData(cohorts: CohortMeta[]): PieDatum[] {
  return cohorts.map((c) => ({
    id: c.id,
    name: c.label,
    value: safeN((c as any).n),
  }));
}

function buildCohortCentroidsPieData(
  cohorts: CohortMeta[],
  cohortCentroids: CohortClusterCentroid2D[]
): PieDatum[] {
  const counts: Record<string, number> = {};
  cohorts.forEach((c) => (counts[c.id] = 0));

  cohortCentroids.forEach((p) => {
    counts[p.cohortId] = (counts[p.cohortId] ?? 0) + 1;
  });

  return cohorts.map((c) => ({
    id: c.id,
    name: c.label,
    value: counts[c.id] ?? 0,
  }));
}

function centroidsForCohort(cohortCentroids: CohortClusterCentroid2D[], cohortId: string) {
  return cohortCentroids.filter((p) => p.cohortId === cohortId);
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      className={css`
        background: #ffffff;
        border: 1px solid #dcdde1;
        border-radius: 10px;
        padding: 12px;
        min-width: 0;
      `}
    >
      <div className={css`font-size: 13px; font-weight: 700; margin-bottom: 8px;`}>{title}</div>
      {children}
    </div>
  );
}

export function ClusteringDistributionPies({
  cohorts,
  clusters,
  cohortCentroids,
  height = 280,
}: {
  cohorts: CohortMeta[];
  clusters: { id: string; label: string }[];
  cohortCentroids: CohortClusterCentroid2D[];
  height?: number;
}) {
  const overallCohortSamplesData = buildCohortSamplesPieData(cohorts);
  const overallCohortCentroidsData = buildCohortCentroidsPieData(cohorts, cohortCentroids);

  return (
    <div
      className={css`
        display: grid;
        gap: 16px;
      `}
    >
      {/* Row 1 */}
      <div
        className={css`
          display: grid;
          gap: 16px;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          align-items: start;
        `}
      >
        <Card title="Overall: % of samples contributed by each cohort">
          <div style={{ width: "100%", height }}>
            <ResponsiveContainer>
              <PieChart>
                <Tooltip />
                <Legend />
                <Pie
                  data={overallCohortSamplesData}
                  dataKey="value"
                  nameKey="name"
                  outerRadius="80%"
                  labelLine={false}
                  label={pctLabel}
                  isAnimationActive={false}
                >
                  {overallCohortSamplesData.map((d, i) => (
                    <Cell key={d.id} fill={colorForCohortIndex(i)} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Overall: % of centroids contributed by each cohort">
          <div style={{ width: "100%", height }}>
            <ResponsiveContainer>
              <PieChart>
                <Tooltip />
                <Legend />
                <Pie
                  data={overallCohortCentroidsData}
                  dataKey="value"
                  nameKey="name"
                  outerRadius="80%"
                  labelLine={false}
                  label={pctLabel}
                  isAnimationActive={false}
                >
                  {overallCohortCentroidsData.map((d, i) => (
                    <Cell key={d.id} fill={colorForCohortIndex(i)} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Row 2 */}
      <Card title="Per cohort: % of centroids in each cluster (client-level)">
        <div
          className={css`
            display: grid;
            gap: 16px;
            grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
            align-items: start;
          `}
        >
          {cohorts.map((cohort, cohortIdx) => {
            const cohortRows = centroidsForCohort(cohortCentroids, cohort.id);
            const cohortClusterData = buildClusterPieData(clusters, cohortRows);
            const n = safeN((cohort as any).n);

            return (
              <div
                key={cohort.id}
                className={css`
                  border: 1px solid #eef0f4;
                  border-radius: 10px;
                  padding: 10px;
                  background: #fbfbfd;
                  min-width: 0;
                `}
              >
                <div className={css`font-weight: 700; font-size: 12px; margin-bottom: 6px;`}>
                  {cohort.label}
                </div>

                <div style={{ width: "100%", height: 220 }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Tooltip />
                      <Pie
                        data={cohortClusterData}
                        dataKey="value"
                        nameKey="name"
                        outerRadius="78%"
                        labelLine={false}
                        label={pctLabel}
                        isAnimationActive={false}
                      >
                        {cohortClusterData.map((d, clusterIdx) => (
                          <Cell key={d.id} fill={colorForClusterIndex(clusterIdx)} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className={css`font-size: 11px; color: #6b7280; margin-top: 4px;`}>
                  n={n.toLocaleString()} • centroids={cohortRows.length} (
                  <span style={{ color: colorForCohortIndex(cohortIdx) }}>cohort color</span>)
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
