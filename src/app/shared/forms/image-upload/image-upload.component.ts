import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormControl, ReactiveFormsModule } from '@angular/forms';
import { environment } from '@environments/environment';

@Component({
  selector: 'app-image-upload',

  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <label class="profile-circle" for="fileInput">
  <img [src]="imageUrl" alt="Profile Image" />
  <input
    type="file"
    id="fileInput"
    accept="image/*"
    (change)="onFileChange($event)"
    hidden
  />
  <div class="overlay"><span>Upload</span></div>
</label>

  `,
  styles: [`
    .profile-upload {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 1rem;
  flex-direction: column;
  gap: 0.5rem;
}

.profile-circle {
  width: 160px;
  height: 160px;
  border-radius: 50%;
  overflow: hidden;
  border: 3px solid #2196f3;
  position: relative;
  cursor: pointer;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  box-shadow: 0 4px 12px rgba(33, 150, 243, 0.3);

  &:hover {
    transform: scale(1.05);
    box-shadow: 0 6px 16px rgba(33, 150, 243, 0.5);
  }
}

.profile-circle img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
  transition: filter 0.3s ease;
}

.profile-circle:hover img {
  filter: brightness(0.8);
}

.overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.4);
  color: #fff;
  font-size: 0.95rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.profile-circle:hover .overlay {
  opacity: 1;
}

  `]
})
export class ImageUploadComponent {
  @Input() control!: AbstractControl;
  previewUrl: string | null = null;
  @Input() defaultUrl: string = '';

  get imageUrl() {
    return this.previewUrl || environment.apiUrl + this.defaultUrl || 'assets/avatars/default.jpg';
  }
  onFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      const file = input.files[0];
      this.control.setValue(file);

      const reader = new FileReader();
      reader.onload = () => this.previewUrl = reader.result as string;
      reader.readAsDataURL(file);
    }
  }

  get controlAsFormControl(): FormControl {
    return this.control as FormControl;
  }
}
