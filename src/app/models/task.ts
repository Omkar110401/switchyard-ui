import { WorkflowType } from '../enums/workflow-type';

export interface TaskInfo {
  name: string;
  command: string;
  workflow_type: WorkflowType;
  outputs: string[];
}

export interface AvailableTasksResponse {
  workflow_types: string[];
  tasks: TaskInfo[];
}
