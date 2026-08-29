import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, interval } from 'rxjs';
import { map, switchMap, startWith } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { TaskInfo, AvailableTasksResponse } from '../models/task';
import { WorkflowType } from '../enums/workflow-type';

export interface Task {
  id: string;
  key: string;
  command: string;
  status: 'pending' | 'ready' | 'running' | 'succeeded' | 'failed' | 'retrying';
  attempt_number: number;
  max_attempts: number;
  outputs?: Record<string, any>;
  error_message?: string;
  created_at: string;
  started_at?: string;
  completed_at?: string;
  heartbeat_at?: string;
  depends_on?: string[];
}

export interface WorkflowSummary {
  id: string;
  name: string;
  version: number;
  status: 'pending' | 'running' | 'succeeded' | 'failed';
  progress: string;
  created_at: string;
  started_at?: string;
  completed_at?: string;
}

export interface WorkflowDetail extends WorkflowSummary {
  tasks: Task[];
}

@Injectable({ providedIn: 'root' })
export class WorkflowService {
  private apiUrl = 'http://localhost:8000';

  constructor(private http: HttpClient, private authService: AuthService) {}

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    if (token) {
      return new HttpHeaders({
        Authorization: `Bearer ${token}`,
      });
    }
    return new HttpHeaders();
  }

  getWorkflows(): Observable<WorkflowSummary[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<WorkflowSummary[]>(`${this.apiUrl}/workflows`, { headers });
  }

  // Poll workflows every 5 seconds
  getWorkflowsPolled(intervalMs: number = 5000): Observable<WorkflowSummary[]> {
    return interval(intervalMs).pipe(
      startWith(0),
      switchMap(() => this.getWorkflows())
    );
  }

  getWorkflowDetail(workflowId: string): Observable<WorkflowDetail> {
    const headers = this.getAuthHeaders();
    return this.http.get<WorkflowDetail>(`${this.apiUrl}/workflows/${workflowId}`, { headers });
  }

  // Poll workflow detail every 5 seconds
  getWorkflowDetailPolled(workflowId: string, intervalMs: number = 15000): Observable<WorkflowDetail> {
    return interval(intervalMs).pipe(
      startWith(0),
      switchMap(() => this.getWorkflowDetail(workflowId))
    );
  }

  getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      pending: '#94a3b8',
      ready: '#3b82f6',
      running: '#06b6d4',
      succeeded: '#10b981',
      failed: '#ef4444',
      retrying: '#f59e0b',
    };
    return colors[status] || '#94a3b8';
  }

  getStatusLabel(status: string): string {
    return status.charAt(0).toUpperCase() + status.slice(1);
  }

  createWorkflow(payload: any): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post<any>(`${this.apiUrl}/workflows`, payload, { headers });
  }

  getAvailableTasks(): Observable<AvailableTasksResponse> {
    const headers = this.getAuthHeaders();
    return this.http.get<AvailableTasksResponse>(`${this.apiUrl}/workflows/available-tasks`, { headers });
  }

  getTasksByType(workflowType: WorkflowType): Observable<TaskInfo[]> {
    return this.getAvailableTasks().pipe(
      map(response => response.tasks.filter(t => t.workflow_type === workflowType))
    );
  }
}
