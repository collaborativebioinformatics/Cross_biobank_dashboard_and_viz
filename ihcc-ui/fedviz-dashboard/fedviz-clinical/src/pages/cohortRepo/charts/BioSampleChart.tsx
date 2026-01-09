import React from "react";
import { ResponsivePie } from "@nivo/pie";
import { css } from "emotion";

import { gql, useQuery } from "@apollo/client";

type ChartData = {
  id: string;
  label: string;
  value: number;
}[];

const container = css`
  height: 100%;
  width: 100%;
  position: relative;
`;
const totalContainer = css`
  position: absolute;
  top: 0px;
  bottom: 24px;
  left: 0px;
  right: 0px;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  & .text {
    font-size: 11px;
  }
`;

export default ({ sqon }: { sqon: {} | null }) => {
  const { data: bioSampleQueryData } = useQuery<{
    cohort: {
      aggregations: {
        biosample__sample_types: {
          buckets: {
            key: string;
            doc_count: number;
          }[];
        };
      };
    };
  }>(
    gql`
      query BIOSAMPLE_AGGREGATION($sqon: JSON) {
        cohort {
          aggregations(aggregations_filter_themselves: true, filters: $sqon) {
            biosample__sample_types {
              buckets {
                key
                doc_count
              }
            }
          }
        }
      }
    `,
    {
      variables: {
        sqon: sqon,
      },
      fetchPolicy: "network-only",
    }
  );

  const chartData: ChartData =
    bioSampleQueryData?.cohort.aggregations.biosample__sample_types.buckets.map(
      ({ doc_count, key }) => ({
        id: key,
        label: key,
        value: doc_count,
      })
    ) || [];

  return (
    <div className={container}>
      <div className={totalContainer}>
        {chartData.length}
        <div className="text">total</div>
      </div>
      <ResponsivePie
        data={chartData}
        margin={{ top: 10, right: 0, bottom: 30, left: 0 }}
        innerRadius={0.5}
        padAngle={0.7}
        cornerRadius={0}
        colors={{ scheme: "nivo" }}
        borderWidth={1}
        borderColor={{ from: "color", modifiers: [["darker", 0.2]] }}
        radialLabelsSkipAngle={10}
        radialLabelsTextXOffset={6}
        radialLabelsTextColor="#333333"
        radialLabelsLinkOffset={0}
        radialLabelsLinkDiagonalLength={16}
        radialLabelsLinkHorizontalLength={24}
        radialLabelsLinkStrokeWidth={1}
        radialLabelsLinkColor={{ from: "color" }}
        slicesLabelsSkipAngle={10}
        slicesLabelsTextColor="#333333"
        animate={true}
        motionStiffness={90}
        motionDamping={15}
        enableRadialLabels={false}
      />
    </div>
  );
};
