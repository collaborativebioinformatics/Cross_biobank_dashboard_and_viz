import React from "react";
import { css } from "emotion";
import logo from "./logo.png";

import { Router, Route, Switch } from "react-router-dom";
import { createBrowserHistory } from "history";
import urlJoin from "url-join";

import CohortRepo from "./pages/cohortRepo";
import createArrangerFetcher from "./pages/cohortRepo/arrangerFetcher/createArrangerFetcher";

import { ARRANGER_API, SHOW_COHORT_REPO_DISCLAIMER } from "./config";
import { API_BASIC_AUTH_PAIR, MAINTENANCE_MODE } from "./config";

import { ApolloClient, InMemoryCache, ApolloProvider } from "@apollo/client";
import MaintenancePageContent from "./components/MaintenancePageContent";

import {
  buildMockCohortClusterCentroids2D,
  ClusteringCohortCentroidsScatter,
  CohortMeta,
} from "./components/ClusteringCohortScatter";

import { ConfusionMatrixQuadrantPiesRecharts } from "./components/ConfusionMatrixQuadrantPies";
import { CohortAccuracyBarChart } from "./components/CohortAccuracyBarChart";
import { RocCurvesChart } from "./components/RocCurvesChart";
import { ClusteringDistributionPies } from "./components/ClusteringDistributionPies";

type RocPoint = { fpr: number; tpr: number };
type CohortRocSeries = { id: string; label: string; roc: RocPoint[] };

const DisclaimerBanner = () => {
  return (
    <div
      className={css`
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: #4f5165;
        opacity: 0.8;
        color: white;
        padding: 10px;
      `}
    >
      The IHCC Cohort Atlas currently has a combination of real and mock data for
      demo purposes. The data is not appropriate for research.
    </div>
  );
};

const cohortRocPointsById: Record<string, RocPoint[]> = {
  "site-1": [
    { fpr: 0.0, tpr: 0.0 },
    { fpr: 0.02, tpr: 0.22 },
    { fpr: 0.05, tpr: 0.40 },
    { fpr: 0.10, tpr: 0.58 },
    { fpr: 0.20, tpr: 0.74 },
    { fpr: 0.35, tpr: 0.84 },
    { fpr: 0.55, tpr: 0.92 },
    { fpr: 0.75, tpr: 0.97 },
    { fpr: 1.0, tpr: 1.0 },
  ],
  "site-2": [
    { fpr: 0.0, tpr: 0.0 },
    { fpr: 0.03, tpr: 0.18 },
    { fpr: 0.06, tpr: 0.33 },
    { fpr: 0.12, tpr: 0.50 },
    { fpr: 0.22, tpr: 0.66 },
    { fpr: 0.38, tpr: 0.79 },
    { fpr: 0.58, tpr: 0.89 },
    { fpr: 0.78, tpr: 0.95 },
    { fpr: 1.0, tpr: 1.0 },
  ],
  "site-3": [
    { fpr: 0.0, tpr: 0.0 },
    { fpr: 0.04, tpr: 0.15 },
    { fpr: 0.08, tpr: 0.28 },
    { fpr: 0.15, tpr: 0.44 },
    { fpr: 0.26, tpr: 0.60 },
    { fpr: 0.42, tpr: 0.74 },
    { fpr: 0.62, tpr: 0.86 },
    { fpr: 0.80, tpr: 0.93 },
    { fpr: 1.0, tpr: 1.0 },
  ],
  "site-4": [
    { fpr: 0.0, tpr: 0.0 },
    { fpr: 0.02, tpr: 0.20 },
    { fpr: 0.05, tpr: 0.38 },
    { fpr: 0.11, tpr: 0.56 },
    { fpr: 0.21, tpr: 0.72 },
    { fpr: 0.36, tpr: 0.83 },
    { fpr: 0.56, tpr: 0.91 },
    { fpr: 0.76, tpr: 0.96 },
    { fpr: 1.0, tpr: 1.0 },
  ],
  "site-5": [
    { fpr: 0.0, tpr: 0.0 },
    { fpr: 0.03, tpr: 0.19 },
    { fpr: 0.06, tpr: 0.35 },
    { fpr: 0.12, tpr: 0.52 },
    { fpr: 0.23, tpr: 0.68 },
    { fpr: 0.39, tpr: 0.80 },
    { fpr: 0.59, tpr: 0.90 },
    { fpr: 0.79, tpr: 0.95 },
    { fpr: 1.0, tpr: 1.0 },
  ],
  "site-6": [
    { fpr: 0.0, tpr: 0.0 },
    { fpr: 0.04, tpr: 0.16 },
    { fpr: 0.08, tpr: 0.30 },
    { fpr: 0.15, tpr: 0.46 },
    { fpr: 0.27, tpr: 0.62 },
    { fpr: 0.43, tpr: 0.76 },
    { fpr: 0.63, tpr: 0.87 },
    { fpr: 0.81, tpr: 0.93 },
    { fpr: 1.0, tpr: 1.0 },
  ],
  "site-7": [
    { fpr: 0.0, tpr: 0.0 },
    { fpr: 0.02, tpr: 0.21 },
    { fpr: 0.05, tpr: 0.39 },
    { fpr: 0.10, tpr: 0.57 },
    { fpr: 0.20, tpr: 0.73 },
    { fpr: 0.35, tpr: 0.84 },
    { fpr: 0.55, tpr: 0.92 },
    { fpr: 0.75, tpr: 0.97 },
    { fpr: 1.0, tpr: 1.0 },
  ],
  "site-8": [
    { fpr: 0.0, tpr: 0.0 },
    { fpr: 0.03, tpr: 0.18 },
    { fpr: 0.06, tpr: 0.34 },
    { fpr: 0.12, tpr: 0.51 },
    { fpr: 0.22, tpr: 0.67 },
    { fpr: 0.38, tpr: 0.80 },
    { fpr: 0.58, tpr: 0.89 },
    { fpr: 0.78, tpr: 0.95 },
    { fpr: 1.0, tpr: 1.0 },
  ],
};

function clamp01(x: number) {
  if (!Number.isFinite(x)) return 0;
  return Math.max(0, Math.min(1, x));
}

function normalizeRoc(points: RocPoint[] | undefined) {
  return (points ?? [])
    .map((p) => ({ fpr: clamp01(p.fpr), tpr: clamp01(p.tpr) }))
    .sort((a, b) => a.fpr - b.fpr);
}

function App() {
  // ---- layout styles ----
  const fullView = css`
    height: 100%;
    max-height: 100%;
    display: flex;
    flex-direction: column;
  `;

  const headerStyle = css`
    height: 64px;
    display: flex;
    align-items: center;
    font-size: 24px;
    line-height: 1.04;
    background: white;
    border-bottom: solid 2px #dcdde1;
    width: 100%;
    justify-content: space-between;
  `;

  const logoStyle = css`
    width: 62px;
    margin-left: 5px;
  `;

  const tabsBar = css`
    display: flex;
    gap: 8px;
    padding: 8px 10px;
    border-bottom: solid 1px #dcdde1;
    background: white;
  `;

  const tabButton = (isActive: boolean) => css`
    padding: 8px 12px;
    border: solid 1px #dcdde1;
    background: ${isActive ? "#f5f6fa" : "white"};
    cursor: pointer;
    border-radius: 6px;
    font-size: 14px;
  `;

  const pageContainer = css`
    position: relative;
    flex: 1;
    overflow: hidden;
  `;

  const dashboardWrap = css`
    height: 100%;
    padding: 16px;
    overflow: auto;
    background: #f7f8fa;
  `;

  // ---- tabs ----
  type TabKey = "atlas" | "tab2" | "tab3" | "tab4" | "tab5";
  const [activeTab, setActiveTab] = React.useState<TabKey>("atlas");

  // ---- GraphQL / Arranger (Atlas tab) ----
  const customHistory = createBrowserHistory();

  const index = "cohort_centric";
  const graphqlField = "cohort";
  const projectId = "ihcc";

  const authorizationHeader = `Basic ${btoa(API_BASIC_AUTH_PAIR)}`;

  const client = new ApolloClient({
    uri: urlJoin(ARRANGER_API, `/${projectId}/graphql`),
    cache: new InMemoryCache(),
    headers: { authorization: authorizationHeader },
  });

  const arrangerFetcher = createArrangerFetcher({
    defaultHeaders: { authorization: authorizationHeader },
  });

  // ---- mock cohort stats (used by charts) ----
  const cohorts8 = [
    { id: "site-1", label: "Nordic Biobank (Sweden)", TN: 37647, FP: 5647, FN: 6902, TP: 29804, n: 80000 },
    { id: "site-2", label: "CHoP Biobank (United States)", TN: 63415, FP: 7927, FN: 11097, TP: 47561, n: 130000 },
    { id: "site-3", label: "Penn Biobank (United States)", TN: 45238, FP: 7540, FN: 9048, TP: 33174, n: 95000 },
    { id: "site-4", label: "Japan Biobank (Japan)", TN: 53333, FP: 7111, FN: 10667, TP: 48889, n: 120000 },
    { id: "site-5", label: "AWS Open Data Program (Global)", TN: 121795, FP: 17949, FN: 20513, TP: 89743, n: 250000 },
    { id: "site-6", label: "CanPath (Canada)", TN: 169886, FP: 26136, FN: 31364, TP: 117614, n: 345000 },
    { id: "site-7", label: "Sage NF1 data (United States)", TN: 7759, FP: 931, FN: 1138, TP: 5172, n: 15000 },
    { id: "site-8", label: "QIAGEN (Germany)", TN: 86697, FP: 13211, FN: 15688, TP: 64404, n: 180000 },
  ];

  const federatedCounts = cohorts8.reduce(
    (acc, c) => ({
      TN: acc.TN + c.TN,
      FP: acc.FP + c.FP,
      FN: acc.FN + c.FN,
      TP: acc.TP + c.TP,
    }),
    { TN: 0, FP: 0, FN: 0, TP: 0 }
  );

  const federatedAccuracy =
    (federatedCounts.TP + federatedCounts.TN) /
    (federatedCounts.TP + federatedCounts.TN + federatedCounts.FP + federatedCounts.FN);

  const cohortRocSeries: CohortRocSeries[] = cohorts8.map((c) => ({
    id: c.id,
    label: c.label,
    roc: normalizeRoc(cohortRocPointsById[c.id]),
  }));

  // ---- clustering mocks ----
  const cohortMeta: CohortMeta[] = cohorts8.map((c) => ({ id: c.id, label: c.label }));

  const { clusters: mockClusterDefs, cohortCentroids: mockCohortCentroids, globalCentroids: mockGlobalCentroids } =
    buildMockCohortClusterCentroids2D({
      cohorts: cohortMeta,
      seed: 20260109,
    });

  return (
    <ApolloProvider client={client}>
      <div className={fullView}>
        <div className={headerStyle}>
          <div
            className={css`
              display: flex;
              align-items: center;
            `}
          >
            <img alt="IHCC logo" src={logo} className={logoStyle} />
            International Health Cohorts Consortium
          </div>
          <div
            className={css`
              text-align: right;
              margin-right: 10px;
              color: black;
            `}
          >
            IHCC Cohort Atlas
          </div>
        </div>

        <div className={tabsBar}>
          <button type="button" className={tabButton(activeTab === "atlas")} onClick={() => setActiveTab("atlas")}>
            Atlas
          </button>
          <button type="button" className={tabButton(activeTab === "tab2")} onClick={() => setActiveTab("tab2")}>
            Clinical Visual
          </button>
          <button type="button" className={tabButton(activeTab === "tab3")} onClick={() => setActiveTab("tab3")}>
            Classification Model Visualization/Performance
          </button>
          <button type="button" className={tabButton(activeTab === "tab4")} onClick={() => setActiveTab("tab4")}>
            Clustering Visualization/Performance
          </button>
          {/* <button type="button" className={tabButton(activeTab === "tab5")} onClick={() => setActiveTab("tab5")}>
            Regression Visualization/Performance
          </button> */}
        </div>

        {activeTab === "atlas" && (
          <div className={pageContainer}>
            {MAINTENANCE_MODE && <MaintenancePageContent />}
            {!MAINTENANCE_MODE && (
              <>
                {SHOW_COHORT_REPO_DISCLAIMER && <DisclaimerBanner />}
                <Router history={customHistory}>
                  <Switch>
                    <Route exact path="/">
                      <CohortRepo
                        index={index}
                        graphqlField={graphqlField}
                        projectId={projectId}
                        arrangerFetcher={arrangerFetcher}
                      />
                    </Route>
                  </Switch>
                </Router>
              </>
            )}
          </div>
        )}

        {activeTab === "tab2" && (
          <div className={pageContainer}>
            <div className={dashboardWrap}>
              <DisclaimerBanner />
              <div
                className={css`
                  padding: 16px;
                  background: white;
                  border: 1px solid #dcdde1;
                  border-radius: 10px;
                `}
              >
                Tab 2 placeholder.
              </div>
            </div>
          </div>
        )}

        {activeTab === "tab3" && (
          <div className={pageContainer}>
            <div className={dashboardWrap}>
              <DisclaimerBanner />

              <ConfusionMatrixQuadrantPiesRecharts cohorts={cohorts8} />

              <div style={{ height: 16 }} />

              <CohortAccuracyBarChart
                cohorts={cohorts8}
                federatedAccuracy={federatedAccuracy}
                height={340}
              />

              <div style={{ height: 16 }} />

              <RocCurvesChart cohorts={cohortRocSeries} height={380} showAuc />
            </div>
          </div>
        )}

        {activeTab === "tab4" && (
          <div className={pageContainer}>
            <div className={dashboardWrap}>
              <DisclaimerBanner />
              <div
                className={css`
                  padding: 16px;
                  background: white;
                  border: 1px solid #dcdde1;
                  border-radius: 10px;
                `}
              >
                <ClusteringCohortCentroidsScatter
                  clusters={mockClusterDefs}
                  cohortCentroids={mockCohortCentroids}
                  globalCentroids={mockGlobalCentroids}
                  cohorts={cohortMeta}
                  height={460}
                />

                <div style={{ height: 16 }} />

                <ClusteringDistributionPies
                  cohorts={cohorts8}
                  clusters={mockClusterDefs}
                  cohortCentroids={mockCohortCentroids}
                  height={280}
                />

                <div
                  className={css`
                    margin-top: 8px;
                    color: #6b7280;
                    font-size: 12px;
                  `}
                >
                  Add: cluster assignment plots, embeddings (PCA/UMAP), silhouette/Dunn/XB, stability curves, etc.
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "tab5" && (
          <div className={pageContainer}>
            <div className={dashboardWrap}>
              <DisclaimerBanner />
              <div
                className={css`
                  padding: 16px;
                  background: white;
                  border: 1px solid #dcdde1;
                  border-radius: 10px;
                `}
              >
                Regression Visualization/Performance placeholder.
                <div
                  className={css`
                    margin-top: 8px;
                    color: #6b7280;
                    font-size: 12px;
                  `}
                >
                  Add: predicted vs actual, residual plots, calibration, MAE/RMSE by cohort, etc.
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ApolloProvider>
  );
}

export default App;
