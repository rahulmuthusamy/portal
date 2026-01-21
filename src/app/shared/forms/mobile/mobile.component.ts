import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-mobile-input',
  
  imports: [CommonModule, ReactiveFormsModule, MatInputModule],
  template: `
    <mat-form-field appearance="outline" class="full-width">
      <mat-label>{{ label }}</mat-label>
      <input
        matInput
        [formControl]="controlAsFormControl"
        type="tel"
        [placeholder]="placeholder"
        maxlength="10"
        pattern="[6-9][0-9]{9}"
      />
      <mat-error *ngIf="control?.invalid && (control?.dirty || control?.touched)">
        <ng-container *ngIf="control?.errors?.['required']">Mobile number is required</ng-container>
        <ng-container *ngIf="control?.errors?.['pattern']">Invalid mobile number</ng-container>
        <ng-container *ngIf="control?.errors?.['maxlength']">Maximum 10 digits allowed</ng-container>
      </mat-error>
    </mat-form-field>
  `,
})
export class MobileInputComponent {
  @Input() control!: AbstractControl;
  @Input() label: string = 'Mobile Number';
  @Input() placeholder: string = 'Enter mobile number';
  @Input() readonly = false;

  get controlAsFormControl(): FormControl {
    return this.control as FormControl;
  }
}
