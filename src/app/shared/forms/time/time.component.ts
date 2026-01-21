import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormControl, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-time',
  
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <label class="label">{{ label }}</label>
    <input type="time" class="time-input" [formControl]="controlAsFormControl" />
  `,
  styles: [`
    .label {
      display: block;
      margin-bottom: 4px;
      font-weight: 500;
    }
    .time-input {
      width: 100%;
      padding: 8px;
      font-size: 14px;
      border-radius: 4px;
      border: 1px solid #ccc;
    }
  `]
})
export class TimeComponent {
  @Input() control!: AbstractControl;
  @Input() label = 'Select Time';

    get controlAsFormControl(): FormControl {
    return this.control as FormControl;
  }
}
