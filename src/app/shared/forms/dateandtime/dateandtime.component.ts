import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';

@Component({
  selector: 'app-dateandtime',
  
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatInputModule
  ],
  template: `
    <mat-form-field appearance="outline" class="full-width">
      <mat-label>{{ label }}</mat-label>
      <input matInput [matDatepicker]="picker" [formControl]="controlAsFormDateControl" />
      <mat-datepicker-toggle matSuffix [for]="picker" />
      <mat-datepicker #picker></mat-datepicker>
    </mat-form-field>

    <label class="time-label">Time</label>
    <input type="time" class="time-input" [formControl]="controlAsFormTimeControl" />
  `,
  styles: [`
    .full-width { width: 100%; margin-bottom: 10px; }
    .time-label {
      display: block;
      margin-top: 8px;
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
export class DateAndTimeComponent {
  @Input() dateControl!: AbstractControl;
  @Input() timeControl!: AbstractControl;
  @Input() label = 'Select Date and Time';


  get controlAsFormDateControl(): FormControl {
    return this.dateControl as FormControl;
  }


  get controlAsFormTimeControl(): FormControl {
    return this.timeControl as FormControl;
  }
}
