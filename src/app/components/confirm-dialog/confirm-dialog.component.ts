import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export type DialogType = 'confirm' | 'warning' | 'delete' | 'info' | 'success' | 'error';

export interface DialogAction {
  label: string;
  color?: 'primary' | 'accent' | 'warn';
  type?: 'mat-raised-button' | 'mat-button';
}

export interface SharedDialogData {
  type: DialogType;
  title: string;
  message: string;
  icon?: string;
  confirmAction?: DialogAction;
  cancelAction?: DialogAction;
  showActions?: boolean;
}

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  templateUrl: './confirm-dialog.component.html',
  styleUrl: './confirm-dialog.component.scss',
})
export class ConfirmDialogComponent {

  private typeDefaults: Record<DialogType, Partial<SharedDialogData>> = {
    confirm: {
      icon: 'help_outline',
      confirmAction: { label: 'Confirm', color: 'primary', type: 'mat-raised-button' },
      cancelAction: { label: 'Cancel', color: 'primary', type: 'mat-button' },
      showActions: true,
    },
    warning: {
      icon: 'warning',
      confirmAction: { label: 'OK', color: 'warn', type: 'mat-raised-button' },
      showActions: true,
    },
    delete: {
      icon: 'delete_outline',
      confirmAction: { label: 'Delete', color: 'warn', type: 'mat-raised-button' },
      cancelAction: { label: 'Cancel', color: 'primary', type: 'mat-button' },
      showActions: true,
    },
    info: {
      icon: 'info',
      confirmAction: { label: 'Got it', color: 'primary', type: 'mat-raised-button' },
      showActions: true,
    },
    success: {
      icon: 'check_circle',
      confirmAction: { label: 'Done', color: 'primary', type: 'mat-raised-button' },
      showActions: true,
    },
    error: {
      icon: 'error_outline',
      confirmAction: { label: 'OK', color: 'warn', type: 'mat-raised-button' },
      showActions: true,
    },
  };

  data: SharedDialogData;

  constructor(
    public dialogRef: MatDialogRef<ConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) rawData: SharedDialogData
  ) {
    const defaults = this.typeDefaults[rawData.type];
    this.data = {
      ...defaults,
      ...rawData,
    };
  }

  onConfirm(): void {
    this.dialogRef.close(true);
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }

  getIconColor(): string {
    switch (this.data.type) {
      case 'warning':
      case 'delete':
      case 'error':
        return 'warn';
      case 'success':
        return 'success';
      default:
        return 'info';
    }
  }

  getDialogClass(): string {
    return `dialog-${this.data.type}`;
  }
}
