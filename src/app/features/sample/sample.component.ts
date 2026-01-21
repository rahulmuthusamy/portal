import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { ChatComponent } from '@features/chat/chat.component';
import { DynamicFormComponent } from '@shared/components/dynamic-form/dynamic-form.component';
import { FormConfig, FormService } from '@shared/components/form.service';

@Component({
  selector: 'app-sample',
  imports: [DynamicFormComponent, ChatComponent, CommonModule, FormsModule, MatInputModule],
  templateUrl: './sample.component.html',
  styleUrl: './sample.component.scss'
})
export class SampleComponent {
  userGoal: string = '';
  generatedFormConfig: FormConfig | null = null;
  loadingForm: boolean = false;
  submissionMessage: string = '';

  constructor(private formService: FormService, private http: HttpClient) { }

  onGenerateForm(): void {
    if (!this.userGoal.trim()) {
      this.submissionMessage = 'Please enter a goal for the form.';
      return;
    }
    this.loadingForm = true;
    this.submissionMessage = 'Generating form...';
    this.generatedFormConfig = null; // Clear previous form

    this.formService.generateFormSchema(this.userGoal).subscribe({
      next: (config: any) => {
        this.generatedFormConfig = config;
        this.loadingForm = false;
        this.submissionMessage = 'Form generated successfully!';
      },
      error: (err: any) => {
        console.error('Error generating form:', err);
        this.loadingForm = false;
        this.submissionMessage = `Error generating form: ${err.error?.error || 'Unknown error'}`;
      }
    });
  }

  onFormSubmitted(event: { formName: string, formData: any }): void {
    this.loadingForm = true;
    this.submissionMessage = 'Submitting form data (not saved to DB)...';

    this.formService.submitDynamicForm(event.formName, event.formData).subscribe({
      next: (response: any) => {
        this.loadingForm = false;
        this.submissionMessage = response.message;
        console.log('Submission simulated successful:', response);       
      },
      error: (err: any) => {
        this.loadingForm = false;
        this.submissionMessage = `Error submitting form: ${err.error?.error || 'Unknown error'}`;
        console.error('Submission error:', err);
      }
    });
  }

  todoItems: ToDoItem[] = [];
  loading: boolean = false;
  error: string = '';


  generateTasks() {
    if (!this.userGoal.trim()) {
      this.error = 'Please enter a goal.';
      return;
    }
    this.loading = true;
    this.error = '';
    this.todoItems = []; // Clear previous tasks

    this.http.post<ToDoItem[]>('http://localhost:3000/generate-tasks', { goal: this.userGoal })
      .subscribe({
        next: (data: any) => {
          this.todoItems = data;
          this.loading = false;
        },
        error: (err: any) => {
          console.error('Error fetching tasks:', err);
          this.error = 'Failed to generate tasks. Please try again.';
          this.loading = false;
        }
      });
  }
}
interface ToDoItem {
  task: string;
  priority: string; // e.g., 'High', 'Medium', 'Low'
}


