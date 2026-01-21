import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-password',
  
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule
  ],
  template: `
    <mat-form-field appearance="outline" class="full-width">
      <mat-label>{{ label }}</mat-label>
      <input matInput [type]="hide ? 'password' : 'text'" [formControl]="control" [placeholder]="placeholder" />
      <button mat-icon-button matSuffix (click)="toggleVisibility()" [attr.aria-label]="'Toggle password visibility'" [attr.aria-pressed]="!hide">
        <mat-icon>{{ hide ? 'visibility_off' : 'visibility' }}</mat-icon>
      </button>
      <mat-error *ngIf="control.hasError('required')">Password is required</mat-error>
      <mat-error *ngIf="control.hasError('minlength')">Minimum {{ minLength }} characters</mat-error>
    </mat-form-field>
  `,
  styles: [`.full-width { width: 100%; }`]
})
export class PasswordComponent {
  @Input() label = 'Password';
  @Input() placeholder = 'Enter your password';
  @Input() control!: FormControl;
  @Input() minLength = 6;

  hide = true;

  toggleVisibility() {
    this.hide = !this.hide;
  }
}
