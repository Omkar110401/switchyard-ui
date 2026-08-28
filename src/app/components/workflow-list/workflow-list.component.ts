import { Component, OnInit, OnDestroy, NgZone, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Subject, timer } from 'rxjs';
import { takeUntil, finalize, switchMap } from 'rxjs/operators';
import { WorkflowService, WorkflowSummary } from '../../services/workflow.service';
import { WorkflowCreateComponent } from '../workflow-create/workflow-create.component';

@Component({
  selector: 'app-workflow-list',
  standalone: true,
  imports: [CommonModule, RouterModule, MatDialogModule],
  templateUrl: './workflow-list.component.html',
  styleUrl: './workflow-list.component.scss',
})
export class WorkflowListComponent implements OnInit, OnDestroy {
  workflows: WorkflowSummary[] = [];
  loading = true;
  error: string | null = null;
  private destroy$ = new Subject<void>();

  constructor(
    private workflowService: WorkflowService,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef,
    private dialog: MatDialog
  ) {}

  ngOnInit() {
    this.loadWorkflows();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadWorkflows() {
    this.loading = true;
    this.error = null;
    this.cdr.markForCheck();

    // Initial load (not polling) to get data quickly
    this.workflowService
      .getWorkflows()
      .pipe(
        finalize(() => {
          this.loading = false;
          console.log('[WorkflowListComponent] Loading complete, loading flag:', this.loading);
          this.cdr.markForCheck();
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (workflows) => {
          this.workflows = workflows;
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Failed to load workflows:', error);
          this.error = 'Failed to load workflows. Please try again.';
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
      .getWorkflowsPolled(5000)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (workflows) => {
          this.workflows = workflows;
        },
        error: (error) => {
          console.error('Polling error:', error);
        },
      });
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

  openWorkflowCreate() {
    this.dialog.open(WorkflowCreateComponent, {
      width: '550px',
      maxHeight: '90vh',
      disableClose: false,
    });
  }
}
