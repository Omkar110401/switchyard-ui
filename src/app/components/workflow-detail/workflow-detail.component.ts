import { Component, OnInit, OnDestroy, NgZone, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';
import { WorkflowService, WorkflowDetail, Task } from '../../services/workflow.service';

@Component({
  selector: 'app-workflow-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './workflow-detail.component.html',
  styleUrl: './workflow-detail.component.scss',
})
export class WorkflowDetailComponent implements OnInit, OnDestroy {
  workflow: WorkflowDetail | null = null;
  loading = true;
  error: string | null = null;
  selectedTask: Task | null = null;
  private workflowId: string = '';
  private destroy$ = new Subject<void>();

  constructor(
    private workflowService: WorkflowService,
    private route: ActivatedRoute,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      this.workflowId = params['id'];
      this.loadWorkflowDetail();
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadWorkflowDetail() {
    this.loading = true;
    this.error = null;
    this.cdr.markForCheck();

    // Initial load (not polling) to get data quickly
    this.workflowService
      .getWorkflowDetail(this.workflowId)
      .pipe(
        finalize(() => {
          this.loading = false;
          console.log('[WorkflowDetailComponent] Loading complete, loading flag:', this.loading);
          this.cdr.markForCheck();
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (workflow) => {
          this.workflow = workflow;
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Failed to load workflow:', error);
          this.error = 'Failed to load workflow details. Please try again.';
          this.cdr.markForCheck();
        },
      });

    // After initial load, start polling for updates (every 5 seconds)
    this.ngZone.run(() => {
      setTimeout(() => {
        this.startPolling();
      }, 100);
    });
  }

  private startPolling() {
    this.workflowService
      .getWorkflowDetailPolled(this.workflowId, 5000)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (workflow) => {
          this.workflow = workflow;
        },
        error: (error) => {
          console.error('Polling error:', error);
        },
      });
  }

  selectTask(task: Task) {
    this.selectedTask = task;
  }

  getStatusColor(status: string): string {
    return this.workflowService.getStatusColor(status);
  }

  getStatusLabel(status: string): string {
    return this.workflowService.getStatusLabel(status);
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleString();
  }

  getTaskDuration(task: Task): string {
    if (!task.started_at || !task.completed_at) {
      return '-';
    }
    const start = new Date(task.started_at).getTime();
    const end = new Date(task.completed_at).getTime();
    const seconds = Math.floor((end - start) / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m ${seconds % 60}s`;
  }

  formatJson(obj: any): string {
    return JSON.stringify(obj, null, 2);
  }

  getProgress(): string {
    if (!this.workflow) return '—';
    if (!this.workflow.progress) return '—';
    return this.workflow.progress;
  }
}
