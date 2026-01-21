import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-textarea',
  
  imports: [CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule],
  template: `
    <mat-form-field appearance="outline" class="full-width">
      <mat-label>{{ label }}</mat-label>
      <textarea matInput [formControl]="controlAsFormControl" [rows]="rows"></textarea>
    </mat-form-field>
  `,
  styles: [`.full-width { width: 100%; }`]
})
export class TextareaComponent {
  @Input() control!: AbstractControl;
  @Input() label = 'Enter text';
  @Input() rows = 3;

    get controlAsFormControl(): FormControl {
    return this.control as FormControl;
  }
}
