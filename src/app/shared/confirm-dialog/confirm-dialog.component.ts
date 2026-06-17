import { Component } from '@angular/core';
import { ConfirmDialogService, ConfirmDialogConfig } from '../../core/services/confirm-dialog.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-confirm-dialog',
  templateUrl: './confirm-dialog.component.html',
  styleUrls: ['./confirm-dialog.component.css']
})
export class ConfirmDialogComponent {
  readonly dialog$: Observable<ConfirmDialogConfig | null>;

  constructor(private confirmService: ConfirmDialogService) {
    this.dialog$ = this.confirmService.dialog$;
  }

  respond(result: boolean): void {
    this.confirmService.respond(result);
  }
}
