import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'app-select',
  
  imports: [CommonModule, ReactiveFormsModule, MatFormFieldModule, MatSelectModule],
  template: `
   <mat-form-field appearance="outline" class="full-width">
      <mat-label>{{ label }}</mat-label>
      <mat-select [formControl]="controlAsFormControl" [placeholder]="placeholder">
        <mat-option value="" disabled>{{ placeholder }}</mat-option>
        <mat-option *ngFor="let option of options" [value]="option.value">
          {{ option.label }}
        </mat-option>
      </mat-select>
    </mat-form-field>
  `,
  styles: ``
})
export class SelectComponent {
  @Input() control!: AbstractControl;
  @Input() label = 'Select Option';
  @Input() options: { label: string; value: any }[] = [];
  @Input() placeholder: string = 'Select option';

  get controlAsFormControl(): FormControl {
    return this.control as FormControl;
  }
}
