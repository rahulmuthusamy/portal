// src/app/form.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface FormField {
  id: string;
  label: string;
  type: 'text' | 'number' | 'email' | 'date' | 'textarea' | 'select' | 'checkbox';
  required: boolean;
  placeholder?: string;
  options?: string[];
  validators?: string[];
}

export interface FormConfig {
  formName: string;
  formTitle: string;
  fields: FormField[];
}

@Injectable({
  providedIn: 'root'
})
export class FormService {
  private backendUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) { }

  generateFormSchema(userGoal: string): Observable<FormConfig> {
    return this.http.post<FormConfig>(`${this.backendUrl}/generate-form-schema`, { userGoal });
  }

  submitDynamicForm(formName: string, formData: any): Observable<any> {
    return this.http.post(`${this.backendUrl}/submit-dynamic-form`, { formName, formData });
  }
}