import { Component, OnInit, OnDestroy, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AnalyticsService, AnalyticsSummary, TrendData, ErrorData, TaskStats } from '../../services/analytics.service';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './analytics.component.html',
  styleUrl: './analytics.component.scss',
})
export class AnalyticsComponent implements OnInit, OnDestroy {
  summary: AnalyticsSummary | null = null;
  trends: TrendData[] = [];
  errors: ErrorData[] = [];
  tasks: TaskStats[] = [];

  loading = true;
  error: string | null = null;
  private destroy$ = new Subject<void>();

  constructor(
    private analyticsService: AnalyticsService,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
  ) {}

  ngOnInit() {
    this.loadAnalytics();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadAnalytics() {
    this.loading = true;
    this.error = null;
    this.cdr.markForCheck();

    // Load all analytics data in parallel
    Promise.all([
      this.analyticsService.getSummary().toPromise(),
      this.analyticsService.getTrends().toPromise(),
      this.analyticsService.getErrors().toPromise(),
      this.analyticsService.getTasks().toPromise(),
    ])
      .then(([summary, trends, errors, tasks]) => {
        this.summary = summary || null;
        this.trends = trends?.trends || [];
        this.errors = errors?.errors || [];
        this.tasks = tasks?.tasks || [];
        this.loading = false;
        this.cdr.markForCheck();

        // Start polling for summary updates
        this.ngZone.run(() => {
          setTimeout(() => {
            this.startPolling();
          }, 100);
        });
      })
      .catch((err) => {
        console.error('Failed to load analytics:', err);
        this.error = 'Failed to load analytics. Please try again.';
        this.loading = false;
        this.cdr.markForCheck();
      });
  }

  private startPolling() {
    this.analyticsService
      .getSummaryPolled(30000)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (summary) => {
          this.summary = summary;
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Polling error:', error);
        },
      });
  }

  formatExecutionTime(seconds: number): string {
    return this.analyticsService.formatExecutionTime(seconds);
  }

  getSuccessRateColor(rate: number): string {
    if (rate >= 90) return '#10b981';
    if (rate >= 75) return '#f59e0b';
    return '#ef4444';
  }

  getErrorColor(index: number): string {
    const colors = ['#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16'];
    return colors[index % colors.length];
  }
}
