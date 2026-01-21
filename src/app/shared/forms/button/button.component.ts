import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-button',
  imports: [CommonModule, FormsModule],
  template: `
   <button class="full-width"
  [type]="type"
  [disabled]="disabled || loading"
  [ngClass]="{
    'btn': true,
    'btn-primary': variant === 'primary',
    'btn-secondary': variant === 'secondary',
    'btn-danger': variant === 'danger'
  }"
  (click)="btnClick()"
>
  <span *ngIf="loading" class="spinner-border spinner-border-sm me-1"></span>
  {{ label }}
</button>
  `,
  styles: `
  button {
  min-width: 100px;
  padding: 0.5rem 1rem;
  font-weight: 500;
}`
})
export class ButtonComponent {
  @Input() label: string = 'Submit';
  @Input() variant: 'primary' | 'secondary' | 'danger' = 'primary';
  @Input() type: 'button' | 'submit' = 'button';
  @Input() disabled: boolean = false;
  @Input() loading: boolean = false;

  @Output() actionClick = new EventEmitter<any>();


  btnClick() {
    this.actionClick.emit();
  }

}
