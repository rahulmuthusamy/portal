import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { SHARED_FORM_COMPONENTS } from '@shared/forms/form-controls';
import { PlayerService } from '../services/players.service';
import { ToastService } from '@shared/services/toast.service';
import { ActivatedRoute, Router } from '@angular/router';
import { AuctionSessionService } from '@features/auction/services/auction-session.service';
import { map } from 'rxjs';


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

  battingStyles = [
    { label: 'Right-Hand Bat', value: 'Right-Hand Bat' },
    { label: 'Left-Hand Bat', value: 'Left-Hand Bat' }
  ];

  bowlingStyles = [
    { label: 'Not Applicable', value: 'N/A' },
    { label: 'Right-Arm Fast', value: 'Right-Arm Fast' },
    { label: 'Right-Arm Medium', value: 'Right-Arm Medium' },
    { label: 'Right-Arm Off-Spin', value: 'Right-Arm Off-Spin' },
    { label: 'Right-Arm Leg-Spin', value: 'Right-Arm Leg-Spin' },
    { label: 'Left-Arm Fast', value: 'Left-Arm Fast' },
    { label: 'Left-Arm Medium', value: 'Left-Arm Medium' },
    { label: 'Left-Arm Orthodox', value: 'Left-Arm Orthodox' },
    { label: 'Left-Arm Chinaman', value: 'Left-Arm Chinaman' }
  ];

  battingPositions = [
    { label: 'Not Specified', value: '' },
    { label: 'Opener (1-2)', value: 'Opener' },
    { label: 'Top Order (3-4)', value: 'Top Order' },
    { label: 'Middle Order (5-7)', value: 'Middle Order' },
    { label: 'Lower Order (8-11)', value: 'Lower Order' }
  ];

  jerseySizes = [
    { label: 'XS', value: 'XS' },
    { label: 'S', value: 'S' },
    { label: 'M', value: 'M' },
    { label: 'L', value: 'L' },
    { label: 'XL', value: 'XL' },
    { label: 'XXL', value: 'XXL' },
    { label: 'XXXL', value: 'XXXL' }
  ];

  private fb = inject(FormBuilder)
  private playerService = inject(PlayerService);
  private toast = inject(ToastService)
  private router = inject(Router)
  private route = inject(ActivatedRoute)
  private auctionSessionService = inject(AuctionSessionService)
  redirectUrl: string = '/kkk/players-list';
  auctionSessions: any[] = [];

  ngOnInit(): void {
    this.InitForm();
    
    this.auctionSessionService.getAll().pipe(
      map((response: any) => (response?.data?.sessions || []).map((s: any) => ({ label: s.Name, value: s.SessionID })))
    ).subscribe(sessions => {
      this.auctionSessions = sessions;
    });
    
    const id = this.route.snapshot.paramMap.get('id')!;;
    if (id) {
      this.isEdit = true;
      this.getByID(+id);
    }

    this.form.get('DOB')?.valueChanges.subscribe(dob => {
      if (dob) {
        const age = this.calculateAge(new Date(dob));
        this.form.get('Age')?.setValue(age, { emitEvent: false });
      }
    });
  }

InitForm() {
    this.form = this.fb.group({
      PlayerID: [],
      Name: ['', Validators.required],
      FatherName: ['', Validators.required],
      Mobile: ['', [Validators.required, Validators.pattern(/^[6-9]\d{9}$/)]],
      Email: ['', [Validators.required, Validators.email]],
      DOB: ['', Validators.required],
      Age: [{ value: '', disabled: true }],
      Address: ['', Validators.required],
      Role: ['', Validators.required],
      BattingStyle: ['', Validators.required],
      BowlingStyle: ['', Validators.required],
      BattingPosition: ['', Validators.required],
      CanKeep: [false],
      CanCaptain: [false],
      CanField: [false],
      Height: [''],
      Weight: [''],
      JerseySize: ['', Validators.required],
      PreviousTeam: [''],
      Experience: [''],
      Notes: [''],
      Bio: [''],
      Nickname: [''],
      EmergencyContact: ['', [Validators.required, Validators.pattern(/^[6-9]\d{9}$/)]],
      PhotoURL: [''],
      AuctionSession: ['', Validators.required]
    });
  }

  calculateAge(birthDate: Date): number {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age;
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

        // Calculate age if DOB exists
        if (players.DOB) {
          const age = this.calculateAge(new Date(players.DOB));
          this.form.get('Age')?.setValue(age);
        }

        if (players.PhotoURL && !players.PhotoURL.startsWith('http')) {
          // PhotoURL preview logic handled by component or service
        }
      },
      error: (error: any) => {
        console.error('Error fetching Teams:', error);
      }
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.toast.error('Please fill all required fields correctly.');
      this.form.markAllAsTouched();
      return;
    }

    const player = this.form.getRawValue();

    const payload = new FormData();

    if (player.PhotoURL instanceof File) {
      payload.append('image', player.PhotoURL);
    } else if (player.PhotoURL && typeof player.PhotoURL === 'object') {
      const photoStr = player.PhotoURL.url || player.PhotoURL.path || '';
      payload.append('PhotoURL', photoStr);
    }
    const { PhotoURL, Age, ...playerData } = player;

    Object.keys(playerData).forEach(key => {
      if (playerData[key] !== null && playerData[key] !== undefined) {
        payload.append(key, playerData[key]);
      }
    });

    const request$ = this.isEdit
      ? this.playerService.update(player.PlayerID, payload)
      : this.playerService.create(payload);

    request$.subscribe({
      next: (response: any) => {
        this.toast.success(response?.message || (this.isEdit ? 'Player updated successfully.' : 'Player registered successfully.'));
        this.router.navigate([this.redirectUrl]);
      },
      error: (error) => {
        console.error(this.isEdit ? 'Update failed:' : 'Creation failed:', error);
        this.toast.error(this.isEdit ? 'Failed to update Player.' : 'Failed to register Player.');
      }
    });
  }

  close() {
    this.router.navigate([this.redirectUrl]);
  }
}
