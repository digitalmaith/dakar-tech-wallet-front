import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ConfirmDialogComponent } from './shared/components/confirm-dialog/confirm-dialog';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ConfirmDialogComponent],
  templateUrl: './app.html'
})
export class AppComponent {}