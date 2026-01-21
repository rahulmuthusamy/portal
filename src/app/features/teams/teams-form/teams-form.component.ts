import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonComponent, ImageUploadComponent, InputComponent } from '@shared/forms/form-controls';
import { TeamsService } from '../services/teams.service';
import { ToastService } from '@shared/services/toast.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-teams-form',
  imports: [CommonModule, ReactiveFormsModule, ImageUploadComponent, InputComponent, ButtonComponent],
  templateUrl: './teams-form.component.html',
  styleUrl: './teams-form.component.scss'
})
export class TeamsFormComponent implements OnInit {
  isEdit: boolean = false;
  form!: FormGroup;
  constructor(
    private fb: FormBuilder,
    private teamService: TeamsService,
    private toast: ToastService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.InitForm();
    const id = sessionStorage.getItem('TeamID');
    if (id) {
      this.isEdit = true;
      this.getByID(+id);
    }

  }

  getByID(id: number) {
    this.teamService.getById(id).subscribe({
      next: (response: any) => {
        const teams = response?.data?.teams;

        if (!teams) {
          console.warn('No Teams data found');
          return;
        }

        this.form.patchValue({
          TeamID: teams.TeamID,
          Name: teams.Name,
          LogoURL: teams.LogoURL
        });
      },
      error: (error: any) => {
        console.error('Error fetching Teams:', error);
      }
    });

  }

  InitForm() {
    this.form = this.fb.group({
      TeamID: [],
      Name: ['', Validators.required],
      LogoURL: ['']
    })
  }


  onSubmit(): void {
    if (this.form.invalid) {
      alert('Please fill all required fields correctly.');
      return;
    }

    const teams = this.form.value;

    const request$ = this.isEdit
      ? this.teamService.update(teams.TeamID, teams)
      : this.teamService.create(teams);

    request$.subscribe({
      next: (response: any) => {
        this.toast.success(response?.message || (this.isEdit ? 'Teams updated successfully.' : 'Teams created successfully.'));
        this.router.navigate(['teams-list']);
      },
      error: (error) => {
        console.error(this.isEdit ? 'Update failed:' : 'Creation failed:', error);
        this.toast.error(this.isEdit ? 'Failed to update Teams.' : 'Failed to create Teams.');
      }
    });
  }
}
