export const PORT = Number(process.env.PORT) || 6060;
export const ES_HOSTS = (process.env.ES_HOSTS || "http://localhost:9200").split(
  ","
);
export const ARRANGER_PROJECT_ID = String(
  process.env.ARRANGER_PROJECT_ID || "ihcc"
);
export const ARRANGER_COHORT_CENTRIC_INDEX = String(
  process.env.ARRANGER_COHORT_CENTRIC_INDEX || "demo_index"
);
