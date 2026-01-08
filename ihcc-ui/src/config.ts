import dotenv from "dotenv";
dotenv.config();

export const ARRANGER_API =
  process.env.REACT_APP_ARRANGER_API || "http://localhost:5050";
export const API_BASIC_AUTH_PAIR =
  process.env.REACT_APP_API_BASIC_AUTH_PAIR || "";
export const SHOW_COHORT_REPO_DISCLAIMER =
  process.env.REACT_APP_SHOW_COHORT_REPO_DISCLAIMER === "true";
export const MAINTENANCE_MODE =
  process.env.REACT_APP_MAINTENANCE_MODE === "true";
