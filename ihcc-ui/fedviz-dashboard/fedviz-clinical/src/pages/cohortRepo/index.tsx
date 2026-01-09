import React from "react";
import { css } from "emotion";

import chevron from "./assets/chevron-right.svg";
import websiteIcon from "./assets/website.svg";
import arrow from "./assets/arrow-right@2x.png";
import checkmark from "./assets/check.svg";
import Xmark from "./assets/X.svg";

import Charts from "./charts";
import {
  Arranger,
  Aggregations,
  CurrentSQON,
  Table,
  // @ts-ignore
} from "@arranger/components/dist/Arranger";
import "@arranger/components/public/themeStyles/beagle/beagle.css";
import createArrangerFetcher from "./arrangerFetcher/createArrangerFetcher";
import Footer from "../../components/Footer";

const pageContainer = css`
  display: flex;
  flex-direction: row;
  max-height: 100%;
  height: 100%;
`;
const facetPanelContainer = (collapsed: boolean) => css`
  width: ${collapsed ? `50px` : `250px`};
  transition: all 0.25s;
  max-height: calc(100vh - 64px);
  border-right: solid 1px #dcdde1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  box-shadow: 1px 1px 5px 1px rgba(0, 0, 0, 0.1);
  min-height: 100%;
`;
const body = css`
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
`;
const bodyContent = css`
  position: relative;
  display: flex;
  flex-direction: column;
  flex: 1;
  padding: 18px;
  padding-bottom: 0px;
  & .sqon-view {
    & .sqon-bubble.sqon-value {
      background-color: #1e6e6d;
    }
    & .sqon-bubble.sqon-clear {
      color: #191970;
    }
  }
`;
const tableContainer = css`
  & .tableToolbar {
    padding: 8px 0px;
    font-size: 12px;
    height: 32px;
    & .group {
      height: 32px;
      & .buttonWrapper {
        /* Hide the Export TSV button */
        display: none;
      }
      & .dropDownHeader {
        /* Fix Column Selector Borders */
        border-radius: 10px;
        border: solid 1px #b2b7c1;
        height: 27px;
      }
    }
    & .inputWrapper {
      display: none !important;
    }
  }
  & .ReactTable {
    border: none;
    max-height: calc(100vh - 430px);
    & .rt-table {
      border: solid 1px lightgrey;
      & .rt-td:first-child,
      & .rt-th:first-child {
        /* hides the select checkboxes */
        display: none;
      }
      & .rt-thead {
        background: white;
        & .rt-tr .rt-th {
          padding-top: 4px;
          padding-bottom: 4px;
          vertical-align: middle;

          font-size: 11px;
          color: #202020;
          text-align: left;
          & .rt-resizable-header-content {
            color: #202020;
          }
          &.-sort-asc {
            box-shadow: inset 0 3px 0 0 #748ea6;
          }
          &.-sort-desc {
            box-shadow: inset 0 -3px 0 0 #748ea6;
          }
        }
      }
    }
    & .pagination-bottom {
      & .-pagination {
        padding: 0px;
        height: 45px;
        box-shadow: none;
        border: none;
      }
    }
  }
  & .ReactTable .rt-th {
    white-space: normal;
  }
`;
const facetScroller = (collapsed: boolean) => css`
  overflow: scroll;
  display: flex;
  ${collapsed
    ? css`
        & > * {
          display: none;
        }
      `
    : ""}
  .aggregation-card {
    border-top: none;
    border-left: none;
    padding: 0px;
    margin: 0px;
    .textHighlight {
      word-break: break-word;
    }
    & .header {
      & .title-control {
        align-items: center;
        & .arrow {
          position: relative;
          display: flex;
          justify-content: center;
          align-items: center;
          ::after {
            font-size: 18px;
            line-height: 100%;
          }
        }
      }
    }
    & .header .filter .inputWrapper {
      justify-content: unset !important;
      & input {
        max-width: 100%;
      }
      .inputIcon {
        display: none;
      }
    }
    &:last-child {
      border-bottom: none;
    }
    .header {
      margin: 0px;
      .title-wrapper {
        padding: 7px;
        background-color: #e8e8f0;
        color: #202020;
        & .title {
          margin-right: 10px;
          font-size: 12px;
          font-weight: bold;
          color: #202020;
        }
        &.collapsed {
          & > .arrow {
            padding: 0px;
          }
        }
      }
    }
    & .showMore-wrapper {
      & ::before {
        color: #47a8bd;
      }
      color: #202020;
      margin-top: 0px;
      padding-left: 8px;
      justify-content: flex-start;
    }
    .filter {
      padding-left: 5px;
      padding-right: 5px;
    }
    .bucket {
      padding: 3px 5px 5px 5px;
    }
  }
`;
const footerStyle = css`
  height: 56px;
  min-height: 56px;
  max-height: 56px;
  background: white;
  border-top: solid 1px #dcdde1;
  font-size: 12px;
  padding: 0px 10px;
`;
const facetPanelFooter = css`
  display: flex;
  justify-content: flex-end;
  align-items: center;
`;
const chevronLeft = css`
  width: 10px;
  margin-left: -5px;
`;

const emptySqonContainer = css`
  padding: 0px;
  height: 52px;
  font-size: 14px;
  padding-left: 19px;
  display: flex;
  align-items: center;
`;

const emptySqonArrowStyle = css`
  width: 12px;
  transform: rotate(180deg);
  margin-right: 5px;
`;

const collapseButtonStyle = (collapsed: boolean) => css`
  border: none;
  cursor: pointer;
  transform: rotate(${collapsed ? "0deg" : "180deg"});
  transition: all 0.5s;
`;

const TableWebsiteCell = ({ original }: { original: { website: string } }) => {
  const icon = css`
    width: 15px;
  `;
  const link = css`
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
  `;
  return (
    <a
      className={link}
      href={original.website}
      target="_blank"
      rel="noopener noreferrer"
    >
      <img alt="website_icon" className={icon} src={websiteIcon}></img>
    </a>
  );
};

type SQON = {};

type CohortDocument = {
  cohort_name: string;
  countries: string[];
  current_enrollment: number;
  available_data_types: {
    biospecimens: boolean;
    environmental_data: boolean;
    genomic_data: boolean;
    phenotypic_clinical_data: boolean;
  };
  pi_lead: string;
};

const BooleanCell = ({ isTrue, ...rest }: { isTrue: boolean }) => {
  const containerStyle = css`
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
  `;
  const iconStyle = css`
    height: 11px;
  `;
  return (
    <div className={`${containerStyle}`}>
      {isTrue ? (
        <img alt="check_mark" className={`${iconStyle}`} src={checkmark}></img>
      ) : (
        <img alt="x_mark" className={`${iconStyle}`} src={Xmark}></img>
      )}
    </div>
  );
};

const customTypeConfigs = {
  boolean: {
    width: 55,
    Cell: ({ value }: any) => <BooleanCell isTrue={value} />,
  },
  enrollment: {
    width: 100,
  },
  percent_range: {
    width: 69,
  },
  string_array: {
    style: { whiteSpace: "unset" },
    Cell: ({ value }: any) => <>{value?.join ? value?.join(", ") : value}</>,
  },
  website: {
    resizable: false,
    Cell: TableWebsiteCell,
    width: 70,
  },
};

const PageContent = (props: { sqon: SQON | null }) => {
  const [facetPanelCollapsed, setFacetPanelCollapsed] = React.useState(false);
  const onFacetCollapserClick = () => {
    setFacetPanelCollapsed(!facetPanelCollapsed);
  };
  return (
    <div className={pageContainer}>
      <div className={facetPanelContainer(facetPanelCollapsed)}>
        <div className={facetScroller(facetPanelCollapsed)}>
          <Aggregations
            style={{
              width: "100%",
            }}
            componentProps={{
              getTermAggProps: () => ({
                maxTerms: 3,
              }),
            }}
            {...props}
          />
        </div>
        <div className={`${footerStyle} ${facetPanelFooter}`}>
          <div
            className={collapseButtonStyle(facetPanelCollapsed)}
            onClick={onFacetCollapserClick}
          >
            <img alt="chevron_left" src={chevron} className={chevronLeft}></img>
            <img alt="chevron_left" src={chevron} className={chevronLeft}></img>
          </div>
        </div>
      </div>
      <div className={body}>
        <div className={bodyContent}>
          {!props.sqon ? (
            <div className={`sqon-view ${emptySqonContainer}`}>
              <img
                alt="arrow_icon"
                src={arrow}
                className={emptySqonArrowStyle}
              ></img>
              Use the filter panel on the left to customize your cohort search.
            </div>
          ) : (
            <CurrentSQON {...props} />
          )}
          <Charts sqon={props.sqon}></Charts>
          <div className={tableContainer}>
            <Table
              columnDropdownText="Columns"
              enableDropDownControls={true}
              customTypeConfigs={customTypeConfigs}
              {...props}
            />
          </div>
        </div>
        <Footer />
      </div>
    </div>
  );
};

const CohortRepo = ({
  index,
  graphqlField,
  projectId,
  arrangerFetcher,
}: {
  index: string;
  graphqlField: string;
  projectId: string;
  arrangerFetcher: ReturnType<typeof createArrangerFetcher>;
}) => {
  return (
    <Arranger
      disableSocket
      api={arrangerFetcher}
      index={index}
      graphqlField={graphqlField}
      projectId={projectId}
      render={(props: any) => <PageContent {...props} />}
    />
  );
};

export default CohortRepo;
