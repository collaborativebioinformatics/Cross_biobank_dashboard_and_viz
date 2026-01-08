import React from "react";
import { Router, Route, Switch } from "react-router-dom";
import { createBrowserHistory } from "history";
import CohortRepo from "./pages/cohortRepo";
import logo from "./logo.png";
import { css } from "emotion";
import { ARRANGER_API, SHOW_COHORT_REPO_DISCLAIMER } from "./config";
import urlJoin from "url-join";
import { API_BASIC_AUTH_PAIR, MAINTENANCE_MODE } from "./config";
import createArrangerFetcher from "./pages/cohortRepo/arrangerFetcher/createArrangerFetcher";

import { ApolloClient, InMemoryCache, ApolloProvider } from "@apollo/client";
import MaintenancePageContent from "./components/MaintenancePageContent";

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
      The IHCC Cohort Atlas currently has a combination of real and mock data
      for demo purposes. The data is not appropriate for research.
    </div>
  );
};

function App() {
  const customHistory = createBrowserHistory();
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
    font-stretch: normal;
    font-style: normal;
    line-height: 1.04;
    letter-spacing: normal;
    background: white;
    border-bottom: solid 2px #dcdde1;
    width: 100%;
    justify-content: space-between;
  `;
  const logoStyle = css`
    width: 62px;
    margin-left: 5px;
  `;
  const pageContainer = css`
    position: relative;
    flex: 1;
  `;
  // second container style
  const pageContainer2 = css`
    position: relative;
    flex: 1;
  `;
    // Tab 2: grid layout for charts
  const dashboardWrap = css`
    height: 100%;
    padding: 16px;
    overflow: auto;
    background: #f7f8fa;
  `;

  const dashboardGrid = css`
    display: grid;
    gap: 16px;

    /* Responsive columns */
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
    align-items: start;
  `;

  const squareTile = css`
    background: #ffffff;
    border: 1px solid #dcdde1;
    border-radius: 8px;
    padding: 12px;

    /* Make each tile square */
    aspect-ratio: 1 / 1;

    display: flex;
    flex-direction: column;
    min-width: 0; /* prevents overflow */
  `;

  const tileHeader = css`
    font-size: 14px;
    font-weight: 600;
    margin-bottom: 8px;
  `;

  const tileBody = css`
    flex: 1;
    border: 1px dashed #dcdde1;
    border-radius: 6px;

    display: flex;
    align-items: center;
    justify-content: center;

    color: #6b7280;
    font-size: 12px;
  `;

  // tab state
  const [activeTab, setActiveTab] = React.useState<"atlas" | "tab2">("atlas");

  const index = "cohort_centric";
  const graphqlField = "cohort";
  const projectId = "ihcc";

  const authorizationHeader = `Basic ${btoa(API_BASIC_AUTH_PAIR)}`;

  const client = new ApolloClient({
    uri: urlJoin(ARRANGER_API, `/${projectId}/graphql`),
    cache: new InMemoryCache(),
    headers: {
      authorization: authorizationHeader,
    },
  });

  const arrangerFetcher = createArrangerFetcher({
    defaultHeaders: {
      authorization: authorizationHeader,
    },
  });
  // simple tab bar style
  const tabsBar = css`
    display: flex;
    gap: 8px;
    padding: 8px 10px;
    border-bottom: solid 1px #dcdde1;
    background: white;
  `;

  const tabButton = (isActive: boolean) => css`
  const cohorts8 = [
    { id: "c1", label: "Cohort A", TN: 120, FP: 18, FN: 22, TP: 95 },
    { id: "c2", label: "Cohort B", TN: 80,  FP: 10, FN: 14, TP: 60 },
    { id: "c3", label: "Cohort C", TN: 150, FP: 25, FN: 30, TP: 110 },
    { id: "c4", label: "Cohort D", TN: 60,  FP: 8,  FN: 12, TP: 55 },
    { id: "c5", label: "Cohort E", TN: 95,  FP: 14, FN: 16, TP: 70 },
    { id: "c6", label: "Cohort F", TN: 130, FP: 20, FN: 24, TP: 90 },
    { id: "c7", label: "Cohort G", TN: 75,  FP: 9,  FN: 11, TP: 50 },
    { id: "c8", label: "Cohort H", TN: 105, FP: 16, FN: 19, TP: 78 },
  ];
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
        {/* Tabs row */}
        <div className={tabsBar}>
          <button
            type="button"
            className={tabButton(activeTab === "atlas")}
            onClick={() => setActiveTab("atlas")}
          >
            Atlas
          </button>
          <button
            type="button"
            className={tabButton(activeTab === "tab2")}
            onClick={() => setActiveTab("tab2")}
          >
            Tab 2
          </button>
        </div>

        {/* Tab 1 container */}
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

        {/* Tab 2 container */}
        {activeTab === "tab2" && (
          <div className={pageContainer2}>
            <div
              className={css`
                padding: 16px;
              `}
            >
            </div>
            </div>
          </div>
        )}
      </div>
    </ApolloProvider>
  );
}

export default App;
