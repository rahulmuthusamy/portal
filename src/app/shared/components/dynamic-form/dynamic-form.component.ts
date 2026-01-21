import { Component, Input, OnInit, OnChanges, SimpleChanges, Output, EventEmitter } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormControl, AbstractControl, ReactiveFormsModule, FormsModule } from '@angular/forms'; // Added AbstractControl
import { FormConfig, FormField } from '../form.service';
import { CommonModule } from '@angular/common';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatNativeDateModule } from '@angular/material/core';

@Component({
  selector: 'app-dynamic-form',

  imports: [ReactiveFormsModule, CommonModule, MatInputModule, MatCheckboxModule, MatDatepickerModule, MatSelectModule,
    MatFormFieldModule, FormsModule, MatNativeDateModule],

  templateUrl: './dynamic-form.component.html',
  styleUrls: ['./dynamic-form.component.scss']
})
export class DynamicFormComponent implements OnInit, OnChanges {
  @Input() formConfig: FormConfig | null = null;
  @Output() formSubmitted = new EventEmitter<any>();

  dynamicForm!: FormGroup;

  constructor(private fb: FormBuilder) { }

  ngOnInit(): void {
    console.log('DynamicFormComponent - ngOnInit: formConfig', this.formConfig);
    if (this.formConfig) {
      this.buildForm();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    console.log('DynamicFormComponent - ngOnChanges: changes', changes);
    if (changes['formConfig'] && this.formConfig) {
      console.log('DynamicFormComponent - ngOnChanges: Building form with new config', this.formConfig);
      this.buildForm();
    }
  }

  private buildForm(): void {
    if (!this.formConfig) {
      console.warn('DynamicFormComponent - buildForm: formConfig is null or undefined. Cannot build form.');
      return;
    }

    console.log('DynamicFormComponent - buildForm: Processing fields:', this.formConfig.fields);
    const formGroup: { [key: string]: AbstractControl } = {};

    this.formConfig.fields.forEach(field => {
      const validators = this.getValidators(field);
      formGroup[field.id] = this.fb.control('', validators);
      console.log(`Added control for field ID: ${field.id}, Type: ${field.type}`);
    });

    this.dynamicForm = this.fb.group(formGroup);
    console.log('Dynamic form group created:', this.dynamicForm);
  }

  private getValidators(field: FormField): any[] {
    const fieldValidators: any[] = [];
    if (field.required) {
      fieldValidators.push(Validators.required);
    }
    if (field.validators) {
      field.validators.forEach(validator => {
        if (validator === 'email') {
          fieldValidators.push(Validators.email);
        } else if (validator.startsWith('min:')) {
          const value = parseFloat(validator.split(':')[1]);
          fieldValidators.push(Validators.min(value));
        } else if (validator.startsWith('max:')) {
          const value = parseFloat(validator.split(':')[1]);
          fieldValidators.push(Validators.max(value));
        } else if (validator.startsWith('minLength:')) {
          const value = parseInt(validator.split(':')[1], 10);
          fieldValidators.push(Validators.minLength(value));
        } else if (validator.startsWith('maxLength:')) {
          const value = parseInt(validator.split(':')[1], 10);
          fieldValidators.push(Validators.maxLength(value));
        }
      });
    }
    return fieldValidators;
  }

  onSubmit(): void {
    if (this.dynamicForm.valid) {
      this.formSubmitted.emit({
        formName: this.formConfig?.formName,
        formData: this.dynamicForm.value
      });
    } else {
      this.dynamicForm.markAllAsTouched();
      console.error('Form is invalid. Please check the fields.');
    }
  }

  getErrorMessage(field: FormField): string {
    const control = this.dynamicForm.get(field.id);
    if (control?.hasError('required')) {
      return 'This field is required.';
    }
    if (control?.hasError('email')) {
      return 'Please enter a valid email address.';
    }
    if (control?.hasError('min')) {
      return `Value must be at least ${field.validators?.find(v => v.startsWith('min:'))?.split(':')[1]}.`;
    }
    if (control?.hasError('max')) {
      return `Value must be at most ${field.validators?.find(v => v.startsWith('max:'))?.split(':')[1]}.`;
    }
    if (control?.hasError('minlength')) {
      return `Must be at least ${control.errors?.['minlength']?.requiredLength} characters.`;
    }
    if (control?.hasError('maxlength')) {
      return `Must be at most ${control.errors?.['maxlength']?.requiredLength} characters.`;
    }
    return 'Invalid entry.';
  }
}