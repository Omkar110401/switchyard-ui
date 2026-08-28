export enum WorkflowType {
  ML = 'ml-pipeline',
  ETL = 'etl-pipeline',
  ECOMMERCE = 'ecommerce',
  CICD = 'cicd',
  MEDIA = 'media',
  REPORTING = 'reporting',
  RETRY_TEST = 'retry-test',
}

export const WorkflowTypeLabels: Record<WorkflowType, string> = {
  [WorkflowType.ML]: 'ML Pipeline',
  [WorkflowType.ETL]: 'ETL',
  [WorkflowType.ECOMMERCE]: 'E-commerce',
  [WorkflowType.CICD]: 'CI/CD',
  [WorkflowType.MEDIA]: 'Media',
  [WorkflowType.REPORTING]: 'Reporting',
  [WorkflowType.RETRY_TEST]: 'Retry Test',
};
