import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-file-upload',
  
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <label class="file-label">
      <input type="file" (change)="onFileChange($event)" />
      Upload File
    </label>
    <div *ngIf="fileName" class="file-name">{{ fileName }}</div>
  `,
  styles: [`
    .file-label {
      display: inline-block;
      padding: 8px 12px;
      background: #1976d2;
      color: white;
      cursor: pointer;
      border-radius: 4px;
    }
    input[type="file"] {
      display: none;
    }
    .file-name {
      margin-top: 8px;
      font-size: 14px;
      color: #555;
    }
  `]
})
export class FileUploadComponent {
  @Input() control!: FormControl;
  fileName = '';

  onFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      const file = input.files[0];
      this.fileName = file.name;
      this.control.setValue(file);
    }
  }
}
