import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ReactiveFormsModule, FormControl, AbstractControl } from '@angular/forms';

@Component({
  selector: 'app-email',
  
  imports: [CommonModule, MatFormFieldModule, MatInputModule, ReactiveFormsModule],
  template: `
    <mat-form-field appearance="outline" class="full-width">
      <mat-label>{{ label }}</mat-label>
      <input matInput type="email" [placeholder]="placeholder" [formControl]="controlAsFormControl" />
      <mat-error *ngIf="control?.invalid && (control?.dirty || control?.touched)">
        {{ getErrorMessage() }}
      </mat-error>
    </mat-form-field>
  `
})
export class EmailComponent implements OnInit {
  @Input() label = 'Email';
  @Input() placeholder = 'Enter your email';
  @Input() control!: AbstractControl;

  ngOnInit() {
    if (!this.control) {
      throw new Error('FormControl is required for app-email');
    }
  }

  getErrorMessage(): string {
    if (this.control.hasError('required')) return 'Email is required';
    if (this.control.hasError('email')) return 'Invalid email address';
    return 'Invalid input';
  }

  get controlAsFormControl(): FormControl {
    return this.control as FormControl;
  }
}
