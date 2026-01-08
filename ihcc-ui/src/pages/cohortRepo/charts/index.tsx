import React from "react";
import { css } from "emotion";
import BarChart from "./BarChart";
import BiosampleSankey from "./BiosampleSankey";

import { Row, Col } from "react-grid-system";

const container = css`
  display: flex;
  position: relative;
  margin-top: 10px;
  border: solid 1px #d9d9df;
  padding: 8px;
`;
const chartContainer = css`
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 150px;
`;

const barChartContainer = css`
  & svg {
    overflow-x: overlay;
  }
`;
const chartTitleStyle = css`
  font-size: 12px;
  font-weight: bold;
  color: #202020;
`;

export default ({ sqon }: { sqon: {} | null }) => {
  return (
    <div className={container}>
      <Row className="row" style={{ width: "100%" }}>
        <Col lg={6}>
          <div className={`${chartContainer} ${barChartContainer}`}>
            <div className={chartTitleStyle}>Cohorts by Country</div>
            <BarChart sqon={sqon} />
          </div>
        </Col>
        <Col lg={6}>
          <div className={`${chartContainer}`}>
            <div className={chartTitleStyle}>Biosample Types</div>
            <BiosampleSankey sqon={sqon} />
          </div>
        </Col>
      </Row>
    </div>
  );
};
