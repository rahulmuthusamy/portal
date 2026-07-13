import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormControl, ReactiveFormsModule } from '@angular/forms';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import {
  MAT_DATE_FORMATS,
  DateAdapter
} from '@angular/material/core';

import {
  MatMomentDateModule,
  MomentDateAdapter
} from '@angular/material-moment-adapter';

import { MatIconModule } from '@angular/material/icon';

export const MY_DATE_FORMATS = {
  parse: {
    dateInput: 'DD/MM/YYYY',
  },
  display: {
    dateInput: 'DD/MM/YYYY',
    monthYearLabel: 'MMM YYYY',
    dateA11yLabel: 'LL',
    monthYearA11yLabel: 'MMMM YYYY',
  },
};

@Component({
  selector: 'app-datepicker',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatMomentDateModule,
    MatIconModule
  ],
  providers: [
    {
      provide: DateAdapter,
      useClass: MomentDateAdapter
    },
    {
      provide: MAT_DATE_FORMATS,
      useValue: MY_DATE_FORMATS
    }
  ],
  template: `
    <mat-form-field appearance="outline" class="full-width">
      <mat-label>{{ label }}</mat-label>

      <input
        matInput
        [matDatepicker]="picker"
        [formControl]="controlAsFormControl"
        [placeholder]="placeholder"
        [min]="minDate"
        [max]="maxDate">

      <mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>

      <mat-datepicker #picker></mat-datepicker>

      <mat-error *ngIf="control.hasError('required')">
        Date is required
      </mat-error>
    </mat-form-field>
  `,
  styles: [`
    .full-width {
      width: 100%;
    }
  `]
})
export class DatepickerComponent {

  @Input() control!: AbstractControl;
  @Input() label = 'Select Date';
  @Input() placeholder = 'MM/DD/YYYY';
  @Input() minDate?: Date;
  @Input() maxDate?: Date;

  ngOnInit(): void {
    // Removed default minDate to allow components to specify if they want to restrict past dates
  }

  get controlAsFormControl(): FormControl {
    return this.control as FormControl;
  }
}