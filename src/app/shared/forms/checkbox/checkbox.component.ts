import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';

@Component({
  selector: 'app-checkbox',
  
  imports: [CommonModule, ReactiveFormsModule, MatCheckboxModule],
  template: `
    <mat-checkbox class="full-width" [formControl]="controlAsFormControl">{{ label }}</mat-checkbox>
  `,
  styles: [`
    mat-checkbox {
      margin: 8px 0;
    }
  `]
})
export class CheckboxComponent {
  @Input() control!: AbstractControl;
  @Input() label = 'Checkbox';


  get controlAsFormControl(): FormControl {
    return this.control as FormControl;
  }
}
