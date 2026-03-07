import { CommonModule } from '@angular/common';
import { Component, computed, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ImageUploadComponent, InputComponent } from '@shared/forms/form-controls';
import { TeamsService } from '../services/teams.service';
import { ToastService } from '@shared/services/toast.service';
import { Router } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { environment } from '@environments/environment';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-teams-form',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    ImageUploadComponent,
    InputComponent,
    MatTableModule,
    MatChipsModule,
    MatSelectModule,
    MatFormFieldModule,
    MatIconModule,
    MatSnackBarModule
  ],
  templateUrl: './teams-form.component.html',
  styleUrl: './teams-form.component.scss'
})
export class TeamsFormComponent implements OnInit {
  isEdit: boolean = false;
  form!: FormGroup;
  Math = Math;

  // Ultimate Continuity Flow - Local Squad State
  scoutedPlayerIds = signal<number[]>([]);
  teamRoster = signal<any[]>([]);
  availableScouts = signal<any[]>([]);
  scoutSearchQuery = signal<string>('');

  filteredScouts = computed(() => {
    const query = this.scoutSearchQuery().toLowerCase();
    const scoutedIds = this.scoutedPlayerIds();
    return this.availableScouts().filter(p =>
      (p.Name.toLowerCase().includes(query) || p.Mobile.includes(query)) &&
      !scoutedIds.includes(p.PlayerID)
    ).slice(0, 5); // Just show top 5 matches for cleaner UI
  });

  // Quick Register State
  showQuickRegister = false;
  quickRegisterForm!: FormGroup;

  loading = false;
  apiUrl = environment.apiUrl;
  constructor(
    private fb: FormBuilder,
    private teamService: TeamsService,
    private toast: ToastService,
    private snackBar: MatSnackBar,
    public router: Router
  ) { }

  ngOnInit(): void {
    this.InitForm();
    const id = sessionStorage.getItem('TeamID');
    if (id) {
      this.isEdit = true;
      this.getByID(+id);
      this.loadTeamRoster(+id);
    }
    this.loadAvailablePlayers();
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
          LogoURL: teams.LogoURL,
          Captain: teams.Captain,
          Founded: teams.Founded,
          OwnerName: teams.OwnerName,
          Contact: teams.Contact,
          Bio: teams.Bio,
          Slogan: teams.Slogan,
          Location: teams.Location,
          Coach: teams.Coach
        });

        if (teams.Players) {
          this.teamRoster.set(teams.Players);
          this.scoutedPlayerIds.set(teams.Players.map((p: any) => p.PlayerID));
        }
      },
      error: (error: any) => {
        console.error('Error fetching Teams:', error);
      }
    });

  }

  // Roster Methods - Continuity Flow
  loadTeamRoster(teamId: number): void {
    this.teamService.getTeamPlayers(teamId).subscribe({
      next: (response: any) => {
        const players = response.data.players || [];
        this.teamRoster.set(players);
        this.scoutedPlayerIds.set(players.map((p: any) => p.PlayerID));
      }
    });
  }

  loadAvailablePlayers(): void {
    this.teamService.getAvailablePlayers().subscribe({
      next: (response: any) => {
        this.availableScouts.set(response.data || []);
      }
    });
  }

  onScoutSelectionChange(event: any): void {
    const newSelectedIds = event.value as number[];
    this.scoutedPlayerIds.set(newSelectedIds);

    // Sync roster object
    const currentRoster = this.teamRoster();
    const allAvailable = [...currentRoster, ...this.availableScouts()];

    const updatedRoster = newSelectedIds.map(id => {
      return allAvailable.find(p => p.PlayerID === id);
    }).filter(p => !!p);

    this.teamRoster.set(updatedRoster);
  }

  removeScout(playerId: number): void {
    const currentIds = this.scoutedPlayerIds();
    this.scoutedPlayerIds.set(currentIds.filter(id => id !== playerId));
    this.teamRoster.set(this.teamRoster().filter(p => p.PlayerID !== playerId));
  }

  toggleScout(player: any): void {
    const current = this.scoutedPlayerIds();
    if (current.includes(player.PlayerID)) {
      this.removeScout(player.PlayerID);
    } else {
      this.scoutedPlayerIds.set([...current, player.PlayerID]);
      this.teamRoster.set([...this.teamRoster(), player]);
    }
  }

  quickRegisterPlayer(): void {
    if (this.quickRegisterForm.invalid) {
      this.toast.error('Please provide Name, Valid Mobile (10+ digits), and Father Name');
      this.quickRegisterForm.markAllAsTouched();
      return;
    }

    const payload = {
      ...this.quickRegisterForm.getRawValue(),
      Status: 'Active',
      Role: 'All Rounder'
    };

    this.teamService.apiCall('post', `${this.apiUrl}/players`, payload).subscribe({
      next: (res: any) => {
        const p = res.data?.players || res.data;
        this.toast.success(`Registered ${p.Name} successfully!`);
        this.toggleScout(p);
        this.showQuickRegister = false;
        this.quickRegisterForm.reset();
        this.loadAvailablePlayers();
      },
      error: (err: any) => this.toast.error(err.error?.message || 'Quick registration failed')
    });
  }

  getPlayerImageUrl(photo: string): string {
    return photo ? `${this.apiUrl}${photo}` : 'assets/logo.jpeg';
  }

  InitForm() {
    this.form = this.fb.group({
      TeamID: [],
      Name: ['', Validators.required],
      LogoURL: [''],
      Captain: ['', Validators.required],
      Founded: [''],
      OwnerName: [''],
      Contact: [''],
      Bio: [''],
      Slogan: [''],
      Location: [''],
      Coach: ['']
    });

    this.quickRegisterForm = this.fb.group({
      Name: ['', [Validators.required, Validators.minLength(3)]],
      Mobile: ['', [Validators.required, Validators.pattern('^[+]?[0-9]{10,15}$')]],
      FatherName: ['', Validators.required]
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.toast.error('Please fill required fields');
      return;
    }

    const teamsData = this.form.getRawValue();
    const payload = new FormData();

    // Map Player IDs for One Continuity Flow
    const players = this.scoutedPlayerIds();
    players.forEach(id => payload.append('PlayerIDs', id.toString()));

    Object.keys(teamsData).forEach(key => {
      if (key === 'LogoURL' && teamsData[key] instanceof File) {
        payload.append('image', teamsData[key]);
      } else if (teamsData[key] !== null && teamsData[key] !== undefined) {
        payload.append(key, teamsData[key]);
      }
    });

    const request$ = this.isEdit
      ? this.teamService.update(teamsData.TeamID, payload)
      : this.teamService.create(payload);

    this.loading = true;
    request$.subscribe({
      next: (response: any) => {
        this.toast.success('Team Master updated successfully');
        this.router.navigate(['/kkk/teams-list']);
      },
      error: (error) => {
        this.toast.error('Save failed');
        this.loading = false;
      }
    });
  }
}
