import { Client } from "@elastic/elasticsearch";
import isEqual from "lodash/isEqual";
import retry from "async-retry";
import projectMetadata from "./arrangerMetadata/projectMetadata.json";
import projectManifest from "./arrangerMetadata/arrangerProject.json";
import { ARRANGER_PROJECT_ID, ARRANGER_COHORT_CENTRIC_INDEX } from "./config";

export const ARRANGER_PROJECT_METADATA_INDEX = `arranger-projects-${ARRANGER_PROJECT_ID}`;
export const ARRANGER_PROJECTS_INDEX = `arranger-projects`;

export const harmonizedCohortCentricConfig: typeof projectMetadata = {
  ...projectMetadata,
  index: ARRANGER_COHORT_CENTRIC_INDEX,
};

export default async (esClient: Client) => {
  const initMetadata = async () => {
    await Promise.all([
      esClient.indices
        .create({ index: ARRANGER_PROJECTS_INDEX })
        .catch((err) =>
          console.warn(
            `trying to create es index ${ARRANGER_PROJECTS_INDEX}: ${err}`
          )
        ),
      esClient.indices
        .create({ index: ARRANGER_PROJECT_METADATA_INDEX })
        .catch((err) =>
          console.warn(
            `trying to create es index ${ARRANGER_PROJECT_METADATA_INDEX}: ${err}`
          )
        ),
    ]);

    try {
      await Promise.all([
        esClient.index({
          index: ARRANGER_PROJECTS_INDEX,
          id: ARRANGER_PROJECT_ID,
          body: projectManifest,
          refresh: "wait_for",
        }),
        esClient.index({
          index: ARRANGER_PROJECT_METADATA_INDEX,
          id: harmonizedCohortCentricConfig.name,
          body: harmonizedCohortCentricConfig,
          refresh: "wait_for",
        }),
      ]);
    } catch (err) {
      // we'll validate the data and only kill the app if the data doesn't match
      console.warn(
        "failed to index metadata, will now check ES to confirm data"
      );
    }

    const [projectManifestInEs, cohortCentricArrangerSetting]: [
      typeof projectManifest,
      typeof projectMetadata
    ] = await Promise.all([
      esClient
        .get({
          index: ARRANGER_PROJECTS_INDEX,
          id: ARRANGER_PROJECT_ID,
        })
        .then((response) => response.body._source),
      esClient
        .get({
          index: ARRANGER_PROJECT_METADATA_INDEX,
          id: harmonizedCohortCentricConfig.name,
        })
        .then((response) => response.body._source),
    ]);

    if (
      isEqual(projectManifestInEs, projectManifest) &&
      isEqual(cohortCentricArrangerSetting, harmonizedCohortCentricConfig)
    ) {
      return true;
    } else {
      throw new Error("arranger metadata mismatch in elasticsearch");
    }
  };
  console.info("initializing arranger metadata");
  return retry(initMetadata, { retries: 10 });
};
