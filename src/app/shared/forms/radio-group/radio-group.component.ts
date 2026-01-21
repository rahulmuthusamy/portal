import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatRadioModule } from '@angular/material/radio';

@Component({
  selector: 'app-radio-group',
  
  imports: [CommonModule, ReactiveFormsModule, MatRadioModule],
  template: `
    <label class="group-label">{{ label }}</label>
    <mat-radio-group [formControl]="controlAsFormControl" class="full-width">
      <mat-radio-button *ngFor="let option of options" [value]="option.value">
        {{ option.label }}
      </mat-radio-button>
    </mat-radio-group>
  `,
  styles: [`
    .group-label {
      display: block;
      margin-bottom: 8px;
      font-weight: 500;
    }
    mat-radio-button {
      display: block;
      margin: 4px 0;
    }
  `]
})
export class RadioGroupComponent {
  @Input() control!: AbstractControl;
  @Input() label = 'Select an option';
  @Input() options: { label: string; value: any }[] = [];

    get controlAsFormControl(): FormControl {
    return this.control as FormControl;
  }
}
