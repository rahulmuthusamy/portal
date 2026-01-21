import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ReactiveFormsModule, FormControl, AbstractControl } from '@angular/forms';

@Component({
  selector: 'app-input',
  
  imports: [CommonModule, MatFormFieldModule, MatInputModule, ReactiveFormsModule],
  template: `
    <mat-form-field appearance="outline" class="full-width">
      <mat-label>{{ label }}</mat-label>
      <input matInput [formControl]="controlAsFormControl" [type]="type" [placeholder]="placeholder"[min]="min"
    [max]="max" />
      <mat-error *ngIf="control?.invalid && (control?.dirty || control?.touched)">
        {{ getErrorMessage() }}
      </mat-error>
    </mat-form-field>
  `,
})
export class InputComponent implements OnInit {
  @Input() label = '';
  @Input() placeholder = '';
  @Input() type: string = 'text';
  @Input() control!: AbstractControl;
  @Input() readonly = false;
  @Input() min?: number;
  @Input() max?: number;
  ngOnInit() {
    if (!this.control) {
      throw new Error('FormControl is required for app-input');
    }
  }

  getErrorMessage(): string {
    if (this.control.hasError('required')) return 'This field is required';
    if (this.control.hasError('minlength')) return 'Too short';
    if (this.control.hasError('maxlength')) return 'Too long';
    if (this.control.hasError('pattern')) return 'Invalid format';
    return 'Invalid input';
  }

  get controlAsFormControl(): FormControl {
    return this.control as FormControl;
  }
}
