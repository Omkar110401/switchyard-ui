import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { AuthService } from '../../services/auth.service';
import { WorkflowCreateComponent } from '../workflow-create/workflow-create.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, MatDialogModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent {
  private authService = inject(AuthService);
  private dialog = inject(MatDialog);
  currentUser$ = this.authService.currentUser$;

  openWorkflowCreate() {
    this.dialog.open(WorkflowCreateComponent, {
      width: '600px',
      maxHeight: '90vh',
      disableClose: false,
    });
  }
}
