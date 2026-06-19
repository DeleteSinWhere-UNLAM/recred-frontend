import { Injectable, signal } from '@angular/core';

export interface DialogOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  showCancel?: boolean;
  resolve: (value: boolean) => void;
}

@Injectable({ providedIn: 'root' })
export class DialogService {
  private readonly activeDialogState = signal<DialogOptions | null>(null);

  readonly activeDialog = this.activeDialogState.asReadonly();

  confirm(message: string, title = 'Confirmar', confirmText = 'Aceptar', cancelText = 'Cancelar'): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      this.activeDialogState.set({
        title,
        message,
        confirmText,
        cancelText,
        showCancel: true,
        resolve,
      });
    });
  }

  alert(message: string, title = 'Alerta', confirmText = 'Aceptar'): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      this.activeDialogState.set({
        title,
        message,
        confirmText,
        showCancel: false,
        resolve,
      });
    });
  }

  handleConfirm(): void {
    const active = this.activeDialogState();
    if (active) {
      active.resolve(true);
      this.activeDialogState.set(null);
    }
  }

  handleDismiss(): void {
    const active = this.activeDialogState();
    if (active) {
      active.resolve(false);
      this.activeDialogState.set(null);
    }
  }
}
