import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface ConfirmDialogConfig {
  message: string;
  confirmText: string;
  cancelText: string;
  resolve: (result: boolean) => void;
}

@Injectable({ providedIn: 'root' })
export class ConfirmDialogService {
  private _dialog = new BehaviorSubject<ConfirmDialogConfig | null>(null);
  readonly dialog$ = this._dialog.asObservable();

  confirm(message: string, confirmText = 'Confirm', cancelText = 'Cancel'): Promise<boolean> {
    return new Promise(resolve => {
      this._dialog.next({ message, confirmText, cancelText, resolve });
    });
  }

  respond(result: boolean): void {
    const current = this._dialog.value;
    this._dialog.next(null);
    current?.resolve(result);
  }
}
