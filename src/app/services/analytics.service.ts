import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, interval } from 'rxjs';
import { map, switchMap, startWith } from 'rxjs/operators';
import { AuthService } from './auth.service';

export interface AnalyticsSummary {
  total_workflows: number;
  success_rate: number;
  avg_execution_time_seconds: number;
  total_failures: number;
}

export interface TrendData {
  date: string;
  success_rate: number;
}

export interface AnalyticsTrends {
  trends: TrendData[];
}

export interface ErrorData {
  error: string;
  count: number;
}

export interface AnalyticsErrors {
  errors: ErrorData[];
}

export interface TaskStats {
  command: string;
  total_runs: number;
  successes: number;
  failures: number;
  avg_time_seconds: number;
}

export interface AnalyticsTasks {
  tasks: TaskStats[];
}

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
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

  getSummary(): Observable<AnalyticsSummary> {
    const headers = this.getAuthHeaders();
    return this.http.get<AnalyticsSummary>(`${this.apiUrl}/analytics/summary`, { headers });
  }

  getSummaryPolled(intervalMs: number = 30000): Observable<AnalyticsSummary> {
    return interval(intervalMs).pipe(
      startWith(0),
      switchMap(() => this.getSummary())
    );
  }

  getTrends(): Observable<AnalyticsTrends> {
    const headers = this.getAuthHeaders();
    return this.http.get<AnalyticsTrends>(`${this.apiUrl}/analytics/trends`, { headers });
  }

  getErrors(): Observable<AnalyticsErrors> {
    const headers = this.getAuthHeaders();
    return this.http.get<AnalyticsErrors>(`${this.apiUrl}/analytics/errors`, { headers });
  }

  getTasks(): Observable<AnalyticsTasks> {
    const headers = this.getAuthHeaders();
    return this.http.get<AnalyticsTasks>(`${this.apiUrl}/analytics/tasks`, { headers });
  }

  formatExecutionTime(seconds: number): string {
    if (seconds < 60) {
      return `${Math.round(seconds)}s`;
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
    return `${minutes}m ${remainingSeconds}s`;
  }
}
