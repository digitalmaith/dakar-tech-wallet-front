import { Component, inject } from '@angular/core';
import { ConfirmDialogService } from '../../../core/services/confirm-dialog.service';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  templateUrl: './confirm-dialog.html'
})
export class ConfirmDialogComponent {
  dialogService = inject(ConfirmDialogService);
}