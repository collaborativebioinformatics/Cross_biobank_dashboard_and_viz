// src/types.ts
export interface Summary {
  total_cohorts: number;
  total_unique_variables: number;
  common_variables_count: number;
  readiness_percentage: number;
}

export type Matrix = Record<string, string[]>;

export type CohortSizes = Record<string, number>;

export interface FederatedDataset {
  summary: Summary;
  matrix: Matrix;
  cohortSizes: CohortSizes;
  cohorts: string[];
  variables: string[];
  commonVariables: string[];
  uniqueVariables: string[];
}
