import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { MatchService } from '../services/match.service';
import { TournamentService } from '@features/tournaments/services/tournament.service';
import { TeamsService } from '@features/teams/services/teams.service';
import { ButtonComponent, InputComponent, SelectComponent } from '@shared/forms/form-controls';
import { ToastService } from '@shared/services/toast.service';
import { environment } from '@environments/environment';

@Component({
  selector: 'app-match-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    InputComponent,
    SelectComponent
  ],
  template: `
    <div class="match-form-container animate-fade p-2 p-md-4"> 
      <div class="header-section mb-4 d-flex justify-content-between align-items-end">
        <div>
          <h2 class="fw-bold text-dark mb-1">{{ isEdit ? 'Edit' : 'Schedule' }} Match</h2>
          <p class="text-muted mb-0">Step {{ currentStep() === 'info' ? '1: Identity & Config' : '2: Squad Verification' }}</p>
        </div>
        <div class="step-indicator d-flex gap-2">
           <div class="dot" [class.active]="currentStep() === 'info'"></div>
           <div class="dot" [class.active]="currentStep() === 'squad'"></div>
        </div>
      </div>

      <!-- STEP 1: MATCH IDENTITY & CONFIG -->
      <div class="form-wrapper bg-white shadow-sm rounded-4 border p-4" *ngIf="currentStep() === 'info'">
        <form [formGroup]="matchForm">
          <!-- Match Identity -->
          <div class="section-title mb-4 pb-2 border-bottom">
            <h5 class="fw-bold mb-0 text-primary">Match Identity</h5>
          </div>

          <div class="row g-4 mb-5">
            <div class="col-md-6">
              <app-select
                label="Tournament Association"
                [control]="matchForm.get('TournamentID')!"
                [options]="tournamentOptions()"
                placeholder="-- No Tournament (Quick Match) --">
              </app-select>
            </div>
            <div class="col-md-6">
              <app-input
                label="Match Number"
                type="number"
                [control]="matchForm.get('MatchNumber')!"
                placeholder="e.g. 1">
              </app-input>
            </div>
            <div class="col-md-6">
              <app-select
                label="Match Type"
                [control]="matchForm.get('MatchType')!"
                [options]="matchTypeOptions">
              </app-select>
            </div>
            <div class="col-md-6">
              <app-input
                label="Group/Round Name (Optional)"
                [control]="matchForm.get('GroupName')!"
                placeholder="e.g. Group A / Semi Final">
              </app-input>
            </div>
          </div>

          <!-- Teams Selection -->
          <div class="section-title mb-4 pb-2 border-bottom">
            <h5 class="fw-bold mb-0 text-primary">Teams & Venue</h5>
          </div>

          <div class="row g-4 mb-5 align-items-center">
            <div class="col-md-5">
              <app-select
                label="Team A (Home)"
                [control]="matchForm.get('TeamA_ID')!"
                [options]="teamOptions()"
                required="true"
                placeholder="-- Select Team A --">
              </app-select>
            </div>

            <div class="col-md-2 d-flex justify-content-center pt-4">
              <div class="vs-badge shadow-sm">VS</div>
            </div>

            <div class="col-md-5">
              <app-select
                label="Team B (Away)"
                [control]="matchForm.get('TeamB_ID')!"
                [options]="teamOptions()"
                required="true"
                placeholder="-- Select Team B --">
              </app-select>
            </div>

            <div class="col-md-6">
              <app-input
                label="Match Date & Time"
                type="datetime-local"
                [control]="matchForm.get('MatchDate')!"
                required="true">
              </app-input>
            </div>
            <div class="col-md-6">
              <app-input
                label="Venue / Ground"
                [control]="matchForm.get('Venue')!"
                required="true"
                placeholder="Enter ground name">
              </app-input>
            </div>
          </div>

          <!-- Match Configuration -->
          <div class="section-title mb-4 pb-2 border-bottom">
            <h5 class="fw-bold mb-0 text-primary">Match Configuration</h5>
          </div>

          <div class="row g-4 mb-5">
            <div class="col-md-4">
              <app-select
                label="Match Format"
                [control]="matchForm.get('MatchFormat')!"
                [options]="matchFormatOptions">
              </app-select>
            </div>
            <div class="col-md-2">
              <app-input
                label="Overs"
                type="number"
                [control]="matchForm.get('OversPerSide')!">
              </app-input>
            </div>
            <div class="col-md-2">
              <app-input
                label="Balls/Over"
                type="number"
                [control]="matchForm.get('BallsPerOver')!">
              </app-input>
            </div>
            <div class="col-md-2">
              <app-input
                label="Powerplay"
                type="number"
                [control]="matchForm.get('PowerplayOvers')!">
              </app-input>
            </div>
            <div class="col-md-2">
              <div class="form-check pt-4 mt-2">
                <input class="form-check-input" type="checkbox" formControlName="IsNeutralVenue" id="neutralVenue">
                <label class="form-check-label fw-bold" for="neutralVenue"> Neutral Venue </label>
              </div>
            </div>
          </div>

          <div class="d-flex justify-content-end gap-3 pt-3">
             <button type="button" class="btn btn-light px-5 py-3 rounded-pill fw-bold border" (click)="cancel()">Cancel</button>
             <button type="button" class="btn btn-primary px-5 py-3 rounded-pill fw-bold shadow" (click)="proceedToSquad()">
                Next: Squad Verification <i class="bi bi-chevron-right ms-2"></i>
             </button>
          </div>
        </form>
      </div>

      <!-- STEP 2: SQUAD VERIFICATION -->
      <div class="squad-verification-step animate-fade" *ngIf="currentStep() === 'squad'">
        <div class="row g-4">
          <!-- TEAM A SQUAD -->
          <div class="col-md-6">
            <div class="premium-card h-100">
              <div class="d-flex justify-content-between align-items-center mb-4 border-bottom pb-2">
                <h5 class="fw-bold text-primary m-0">{{ teamAName() }}</h5>
                <span class="badge" [class.bg-success]="selectedTeamAPlayers().length === 11" [class.bg-warning]="selectedTeamAPlayers().length !== 11">
                  {{ selectedTeamAPlayers().length }}/11 Selected
                </span>
              </div>
              <div class="player-selection-grid">
                <div *ngFor="let p of teamAPlayers()" 
                  class="player-item d-flex align-items-center p-2 rounded-3 mb-2 border transition-all cursor-pointer"
                  [class.selected]="selectedTeamAPlayers().includes(p.PlayerID)"
                  (click)="togglePlayer(p.PlayerID, true)">
                  <img [src]="p.PhotoURL ? apiUrl + p.PhotoURL : 'assets/logo.jpeg'" class="rounded-circle me-3" style="width: 40px; height: 40px; object-fit: cover;">
                  <div class="flex-grow-1">
                    <div class="fw-bold small">{{ p.Name }}</div>
                    <div class="text-muted" style="font-size: 0.7rem;">{{ p.Role }}</div>
                  </div>
                  <i class="bi" [class.bi-check-circle-fill]="selectedTeamAPlayers().includes(p.PlayerID)" [class.text-success]="selectedTeamAPlayers().includes(p.PlayerID)" [class.bi-circle]="!selectedTeamAPlayers().includes(p.PlayerID)"></i>
                </div>
              </div>
            </div>
          </div>

          <!-- TEAM B SQUAD -->
          <div class="col-md-6">
            <div class="premium-card h-100">
              <div class="d-flex justify-content-between align-items-center mb-4 border-bottom pb-2">
                <h5 class="fw-bold text-primary m-0">{{ teamBName() }}</h5>
                <span class="badge" [class.bg-success]="selectedTeamBPlayers().length === 11" [class.bg-warning]="selectedTeamBPlayers().length !== 11">
                  {{ selectedTeamBPlayers().length }}/11 Selected
                </span>
              </div>
              <div class="player-selection-grid">
                <div *ngFor="let p of teamBPlayers()" 
                  class="player-item d-flex align-items-center p-2 rounded-3 mb-2 border transition-all cursor-pointer"
                  [class.selected]="selectedTeamBPlayers().includes(p.PlayerID)"
                  (click)="togglePlayer(p.PlayerID, false)">
                  <img [src]="p.PhotoURL ? apiUrl + p.PhotoURL : 'assets/logo.jpeg'" class="rounded-circle me-3" style="width: 40px; height: 40px; object-fit: cover;">
                  <div class="flex-grow-1">
                    <div class="fw-bold small">{{ p.Name }}</div>
                    <div class="text-muted" style="font-size: 0.7rem;">{{ p.Role }}</div>
                  </div>
                  <i class="bi" [class.bi-check-circle-fill]="selectedTeamBPlayers().includes(p.PlayerID)" [class.text-success]="selectedTeamBPlayers().includes(p.PlayerID)" [class.bi-circle]="!selectedTeamBPlayers().includes(p.PlayerID)"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="actions-footer mt-5 p-4 bg-white shadow-sm rounded-4 border d-flex justify-content-between align-items-center">
           <button type="button" class="btn btn-light px-4 py-2 border fw-bold rounded-pill" (click)="currentStep.set('info')">
             <i class="bi bi-chevron-left me-2"></i> Back to Identity
           </button>
           <div class="d-flex gap-3">
             <button type="button" class="btn btn-light px-4 py-2 border fw-bold rounded-pill" (click)="cancel()">Cancel</button>
             <button type="button" class="btn btn-primary px-5 py-3 rounded-pill fw-bold shadow" 
               [disabled]="isSubmitting() || selectedTeamAPlayers().length !== 11 || selectedTeamBPlayers().length !== 11" 
               (click)="onSubmit()">
                <span class="spinner-border spinner-border-sm me-2" *ngIf="isSubmitting()"></span>
                {{ isEdit ? 'Sync Match & Squads' : 'Confirm & Schedule' }}
             </button>
           </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .match-form-container { max-width: 1100px; margin: 0 auto; }
    .vs-badge {
      width: 50px;
      height: 50px;
      background: white;
      border: 2px solid #3b82f6;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 900;
      color: #3b82f6;
      font-size: 1rem;
    }
    .form-check-input:checked {
      background-color: #3b82f6;
      border-color: #3b82f6;
    }
    .dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: #e2e8f0;
      transition: all 0.3s;
    }
    .dot.active {
      background: #3b82f6;
      transform: scale(1.3);
    }
    .premium-card {
      background: white;
      border-radius: 24px;
      padding: 2rem;
      border: 1px solid rgba(0, 0, 0, 0.05);
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.02);
    }
    .player-item {
      cursor: pointer;
      background: #f8fafc;
      border: 2px solid transparent !important;
      transition: all 0.2s;
    }
    .player-item:hover {
      background: #f1f5f9;
      transform: translateX(5px);
    }
    .player-item.selected {
      border-color: #3b82f6 !important;
      background: #eff6ff;
    }
    .animate-fade {
      animation: fadeIn 0.4s ease-out;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class MatchFormComponent implements OnInit {
  isEdit = false;
  isSubmitting = signal(false);
  apiUrl = environment.apiUrl;
  matchForm: FormGroup;

  tournamentOptions = signal<any[]>([]);
  teamOptions = signal<any[]>([]);

  // Squad Selection State
  currentStep = signal<'info' | 'squad'>('info');
  teamAPlayers = signal<any[]>([]);
  teamBPlayers = signal<any[]>([]);
  selectedTeamAPlayers = signal<number[]>([]);
  selectedTeamBPlayers = signal<number[]>([]);

  teamAName = signal('');
  teamBName = signal('');

  matchTypeOptions = [
    { label: 'League Match', value: 'League' },
    { label: 'Group Stage', value: 'Group' },
    { label: 'Round of 16', value: 'Round16' },
    { label: 'Quarter Final', value: 'QuarterFinal' },
    { label: 'Semi Final', value: 'SemiFinal' },
    { label: 'Final', value: 'Final' }
  ];

  matchFormatOptions = [
    { label: 'T20', value: 'T20' },
    { label: 'ODI', value: 'ODI' },
    { label: 'T10', value: 'T10' },
    { label: 'The 100', value: 'The100' },
    { label: 'Test', value: 'Test' },
    { label: 'Custom', value: 'Custom' }
  ];

  private fb = inject(FormBuilder);
  private matchService = inject(MatchService);
  private tournamentService = inject(TournamentService);
  private teamService = inject(TeamsService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private toast = inject(ToastService);

  constructor() {
    this.matchForm = this.fb.group({
      MatchID: [null],
      TournamentID: [null],
      TeamA_ID: [null],
      TeamB_ID: [null],
      MatchDate: ['', Validators.required],
      Venue: ['', Validators.required],
      MatchNumber: [1],
      MatchType: ['League'],
      GroupName: [''],
      MatchFormat: ['T20'],
      OversPerSide: [20, [Validators.required, Validators.min(1)]],
      BallsPerOver: [6],
      PowerplayOvers: [6],
      IsNeutralVenue: [true],
      Umpire1Name: [''],
      Umpire2Name: [''],
      ThirdUmpireName: [''],
      RefereeName: [''],
      ScorerName: [''],
      PitchConditions: [''],
      WeatherConditions: [''],
      StreamURL: [''],
      MatchNotes: [''],
      Status: ['Scheduled']
    });

    // Auto-adjust overs based on format
    this.matchForm.get('MatchFormat')?.valueChanges.subscribe(format => {
      this.updateConfig(format);
    });
  }

  loadTeamPlayers(teamId: number, isTeamA: boolean): void {
    this.teamService.getTeamPlayers(teamId).subscribe((res: any) => {
      const players = res.data?.players || [];
      if (isTeamA) {
        this.teamAPlayers.set(players);
        this.teamAName.set(this.teamOptions().find(t => t.value === teamId)?.label || 'Team A');
      } else {
        this.teamBPlayers.set(players);
        this.teamBName.set(this.teamOptions().find(t => t.value === teamId)?.label || 'Team B');
      }
    });
  }

  proceedToSquad(): void {
    const teamAId = this.matchForm.get('TeamA_ID')?.value;
    const teamBId = this.matchForm.get('TeamB_ID')?.value;

    if (!teamAId || !teamBId) {
      this.toast.error('Please select both teams first');
      return;
    }

    if (teamAId === teamBId) {
      this.toast.error('Teams must be different');
      return;
    }

    this.loadTeamPlayers(teamAId, true);
    this.loadTeamPlayers(teamBId, false);
    this.currentStep.set('squad');
  }

  togglePlayer(playerId: number, isTeamA: boolean): void {
    const selected = isTeamA ? this.selectedTeamAPlayers() : this.selectedTeamBPlayers();
    const setFunc = isTeamA ? this.selectedTeamAPlayers : this.selectedTeamBPlayers;

    if (selected.includes(playerId)) {
      setFunc.set(selected.filter(id => id !== playerId));
    } else {
      if (selected.length >= 11) {
        this.toast.info('Maximum 11 players already selected');
        return;
      }
      setFunc.set([...selected, playerId]);
    }
  }

  ngOnInit(): void {
    this.loadData();
    const id = this.route.snapshot.params['id'];
    if (id) {
      this.isEdit = true;
      this.loadMatch(id);
    }
  }

  loadData(): void {
    this.tournamentService.getAll().subscribe((res: any) => {
      const ts = res.data?.tournaments || res || [];
      this.tournamentOptions.set(ts.map((t: any) => ({ label: t.Name, value: t.TournamentID })));
    });

    this.teamService.getAll().subscribe((res: any) => {
      const teams = res.data?.teams || res || [];
      this.teamOptions.set(teams.map((t: any) => ({ label: t.Name, value: t.TeamID })));
    });
  }

  loadMatch(id: string): void {
    this.matchService.getById(Number(id)).subscribe((res: any) => {
      const m = res.data?.match || res;
      this.matchForm.patchValue({
        ...m,
        MatchDate: m.MatchDate ? new Date(m.MatchDate).toISOString().slice(0, 16) : ''
      });

      // Load squads if they exist
      this.matchService.getMatchSquad(Number(id)).subscribe((sres: any) => {
        const squads = sres.data;
        if (squads) {
          if (squads.teamA) this.selectedTeamAPlayers.set(squads.teamA.map((p: any) => p.PlayerID));
          if (squads.teamB) this.selectedTeamBPlayers.set(squads.teamB.map((p: any) => p.PlayerID));
        }
      });
    });
  }

  updateConfig(format: string): void {
    const overs = this.matchForm.get('OversPerSide');
    const pp = this.matchForm.get('PowerplayOvers');
    switch (format) {
      case 'T20': overs?.setValue(20); pp?.setValue(6); break;
      case 'ODI': overs?.setValue(50); pp?.setValue(10); break;
      case 'T10': overs?.setValue(10); pp?.setValue(4); break;
      case 'The100': overs?.setValue(16); pp?.setValue(5); break;
      case 'Test': overs?.setValue(90); pp?.setValue(0); break;
    }
  }

  onSubmit(): void {
    if (this.matchForm.invalid) {
      this.matchForm.markAllAsTouched();
      return;
    }

    const val = this.matchForm.getRawValue();
    if (val.TeamA_ID === val.TeamB_ID) {
      this.toast.error('Teams must be different');
      return;
    }

    // Basic Squad Validation (Optional but recommended)
    if (this.selectedTeamAPlayers().length !== 11 || this.selectedTeamBPlayers().length !== 11) {
      this.toast.info('Both teams should normally have 11 players selected.');
      // We will allow proceeding if the user really wants to, or we can force it.
      // Based on MatchService logic, it requires exactly 11 players.
      if (this.selectedTeamAPlayers().length !== 11 || this.selectedTeamBPlayers().length !== 11) {
        this.toast.error('Exactly 11 players are required for each team.');
        return;
      }
    }

    this.isSubmitting.set(true);
    const request = this.isEdit
      ? this.matchService.update(val.MatchID, val)
      : this.matchService.create(val);

    request.subscribe({
      next: (res: any) => {
        const matchId = this.isEdit ? val.MatchID : (res.data?.match?.MatchID || res.data?.MatchID);

        // Save Squads
        const squadA = this.selectedTeamAPlayers().map((id, index) => ({
          playerId: id,
          isCaptain: index === 0, // Placeholder captain
          isWicketKeeper: index === 1 // Placeholder keeper
        }));

        const squadB = this.selectedTeamBPlayers().map((id, index) => ({
          playerId: id,
          isCaptain: index === 0,
          isWicketKeeper: index === 1
        }));

        // Parallel squad saves
        const saveA = this.matchService.saveMatchSquad(matchId, val.TeamA_ID, squadA);
        const saveB = this.matchService.saveMatchSquad(matchId, val.TeamB_ID, squadB);

        saveA.subscribe(() => {
          saveB.subscribe(() => {
            this.toast.success(`Match and Squads ${this.isEdit ? 'updated' : 'scheduled'} successfully!`);
            this.router.navigate(['/kkk/match-list']);
          });
        });
      },
      error: (err) => {
        console.error(err);
        this.toast.error('Failed to save match');
        this.isSubmitting.set(false);
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/kkk/match-list']);
  }
}

