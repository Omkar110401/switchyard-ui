import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { WorkflowService } from '../../services/workflow.service';
import { WorkflowType, WorkflowTypeLabels } from '../../enums/workflow-type';
import { TaskInfo } from '../../models/task';

@Component({
  selector: 'app-workflow-create',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MatDialogModule],
  templateUrl: './workflow-create.component.html',
  styleUrl: './workflow-create.component.scss',
})
export class WorkflowCreateComponent implements OnInit {
  workflowTypes = Object.values(WorkflowType);
  workflowTypeLabels = WorkflowTypeLabels;

  selectedType: WorkflowType | null = null;
  allTasks: TaskInfo[] = [];
  filteredTasks: TaskInfo[] = [];
  selectedTasks: TaskInfo[] = [];
  taskDependencies: (string | null)[] = [];

  workflowName = '';
  loading = false;
  errorMessage = '';
  tasksLoading = false;

  constructor(
    private workflowService: WorkflowService,
    private router: Router,
    public dialogRef: MatDialogRef<WorkflowCreateComponent>
  ) {}

  ngOnInit() {
    this.loadAvailableTasks();
  }

  loadAvailableTasks() {
    this.tasksLoading = true;
    this.workflowService.getAvailableTasks().subscribe({
      next: (response) => {
        this.allTasks = response.tasks;
        this.tasksLoading = false;
      },
      error: () => {
        this.tasksLoading = false;
        this.errorMessage = 'Failed to load available tasks';
      },
    });
  }

  selectWorkflowType(type: WorkflowType) {
    this.selectedType = type;
    this.filteredTasks = this.allTasks.filter(t => t.workflow_type === type);
    this.selectedTasks = [];
    this.taskDependencies = [];
  }

  addNewTask() {
    if (this.filteredTasks.length > 0) {
      const firstAvailableTask = this.filteredTasks.find(t => !this.selectedTasks.some(sel => sel.name === t.name));
      if (firstAvailableTask) {
        this.selectedTasks.push(firstAvailableTask);
        this.taskDependencies.push(this.selectedTasks.length > 1 ? this.selectedTasks[this.selectedTasks.length - 2].name : '');
      }
    }
  }

  updateTask(index: number, event: any) {
    const taskName = event.target?.value;
    if (taskName) {
      const newTask = this.filteredTasks.find(t => t.name === taskName);
      if (newTask) {
        this.selectedTasks[index] = newTask;
      }
    }
  }

  removeTask(taskName: string) {
    const index = this.selectedTasks.findIndex(t => t.name === taskName);
    if (index > -1) {
      this.selectedTasks.splice(index, 1);
      this.taskDependencies.splice(index, 1);
    }
  }

  onSubmit() {
    if (!this.workflowName.trim()) {
      this.errorMessage = 'Workflow name is required';
      return;
    }

    if (this.selectedTasks.length === 0) {
      this.errorMessage = 'Please select at least one task';
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    // Ensure taskDependencies array has correct length
    while (this.taskDependencies.length < this.selectedTasks.length) {
      this.taskDependencies.push('');
    }

    const workflowPayload = {
      name: this.workflowName.trim(),
      tasks: this.selectedTasks.map((task, index) => {
        const dependsOn = this.taskDependencies[index];
        return {
          id: task.name,
          command: task.command,
          params: {},
          depends_on: dependsOn ? [dependsOn] : [],
        };
      }),
    };

    this.workflowService.createWorkflow(workflowPayload).subscribe({
      next: (response) => {
        this.loading = false;
        this.dialogRef.close(response);
        this.router.navigate(['/workflows', response.workflow_run_id]);
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = error.error?.detail || 'Failed to create workflow';
      },
    });
  }

  onCancel() {
    this.dialogRef.close();
  }
}
