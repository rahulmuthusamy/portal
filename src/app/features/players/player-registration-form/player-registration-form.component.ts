import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { SHARED_FORM_COMPONENTS } from '@shared/forms/form-controls';
import { PlayerService } from '../services/players.service';
import { ToastService } from '@shared/services/toast.service';
import { ActivatedRoute, Router } from '@angular/router';


@Component({
  selector: 'app-registration-form',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ...SHARED_FORM_COMPONENTS
  ],
  templateUrl: './player-registration-form.component.html',
  styleUrl: './player-registration-form.component.scss'
})
export class PlayerRegistrationFormComponent {
  form!: FormGroup;
  isEdit: boolean = false;

  roles = [
    { label: 'Batsman', value: 'Batsman' },
    { label: 'Bowler', value: 'Bowler' },
    { label: 'All-Rounder', value: 'All-Rounder' },
    { label: 'Wicket-Keeper', value: 'Wicket-Keeper' }
  ];

  private fb = inject(FormBuilder)
  private playerService = inject(PlayerService);
  private toast = inject(ToastService)
  private router = inject(Router)
  private route = inject(ActivatedRoute)

  ngOnInit(): void {
    this.InitForm();
    const id = this.route.snapshot.paramMap.get('id')!;;
    if (id) {
      this.isEdit = true;
      this.getByID(+id);
    }
  }

  InitForm() {
    this.form = this.fb.group({
      PlayerID: [],
      Name: ['', Validators.required],
      FatherName: ['', Validators.required],
      Mobile: ['', [Validators.required, Validators.pattern(/^[6-9]\d{9}$/)]],
      Email: ['',],
      DOB: ['', Validators.required],
      Role: ['', Validators.required],
      BattingStyle: [''],
      BowlingStyle: [''],
      Notes: [''],
      PhotoURL: ['']
    });
  }




  getByID(id: number) {
    this.playerService.getById(id).subscribe({
      next: (response: any) => {
        const players = response?.data?.players;

        if (!players) {
          console.warn('No Teams data found');
          return;
        }

        this.form.patchValue(players);
      },
      error: (error: any) => {
        console.error('Error fetching Teams:', error);
      }
    });

  }


  onSubmit(): void {
    if (this.form.invalid) {
      alert('Please fill all required fields correctly.');
      return;
    }

    const player = this.form.value;

    const request$ = this.isEdit
      ? this.playerService.update(player.PlayerID, player)
      : this.playerService.create(player);

    request$.subscribe({
      next: (response: any) => {
        this.toast.success(response?.message || (this.isEdit ? 'Player updated successfully.' : 'Player created successfully.'));
        this.router.navigate(['players-list']);
      },
      error: (error) => {
        console.error(this.isEdit ? 'Update failed:' : 'Creation failed:', error);
        this.toast.error(this.isEdit ? 'Failed to update Player.' : 'Failed to create Player.');
      }
    });
  }

  close() {
    this.router.navigate(['players-list']);
  }
}
