import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { MatchService } from '../services/match.service';
import { TournamentService } from '@features/tournaments/services/tournament.service';
import { TeamsService } from '@features/teams/services/teams.service';
import { ButtonComponent, InputComponent, SelectComponent } from '@shared/forms/form-controls';
import { ToastService } from '@shared/services/toast.service';

@Component({
  selector: 'app-match-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    InputComponent,
    SelectComponent,
    ButtonComponent
  ],
  template: `
    <div class="match-form-container animate-fade p-2 p-md-4"> 
      <div class="header-section mb-4">
        <h2 class="fw-bold text-dark mb-1">{{ isEdit ? 'Edit' : 'Schedule' }} Match</h2>
        <p class="text-muted">Fill in the details to {{ isEdit ? 'update' : 'create' }} a cricket match.</p>
      </div>

      <div class="form-wrapper bg-white shadow-sm rounded-4 border p-4">
        <form [formGroup]="matchForm" (ngSubmit)="onSubmit()">
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
              <div class="vs-badge">VS</div>
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
                <label class="form-check-label fw-bold" for="neutralVenue">
                  Neutral Venue
                </label>
              </div>
            </div>
          </div>

          <!-- Officials -->
          <div class="section-title mb-4 pb-2 border-bottom">
            <h5 class="fw-bold mb-0 text-primary">Officials</h5>
          </div>

          <div class="row g-4 mb-5">
            <div class="col-md-6">
              <app-input
                label="Umpire 1"
                [control]="matchForm.get('Umpire1Name')!"
                placeholder="Primary Umpire Name">
              </app-input>
            </div>
            <div class="col-md-6">
              <app-input
                label="Umpire 2"
                [control]="matchForm.get('Umpire2Name')!"
                placeholder="Secondary Umpire Name">
              </app-input>
            </div>
            <div class="col-md-4">
              <app-input
                label="Third Umpire"
                [control]="matchForm.get('ThirdUmpireName')!">
              </app-input>
            </div>
            <div class="col-md-4">
              <app-input
                label="Match Referee"
                [control]="matchForm.get('RefereeName')!">
              </app-input>
            </div>
            <div class="col-md-4">
              <app-input
                label="Official Scorer"
                [control]="matchForm.get('ScorerName')!">
              </app-input>
            </div>
          </div>

          <!-- Conditions -->
          <div class="section-title mb-4 pb-2 border-bottom">
            <h5 class="fw-bold mb-0 text-primary">Conditions & Media</h5>
          </div>

          <div class="row g-4 mb-5">
            <div class="col-md-6">
              <app-input
                label="Pitch Conditions"
                [control]="matchForm.get('PitchConditions')!"
                placeholder="e.g. Dry, Flat, Grassy">
              </app-input>
            </div>
            <div class="col-md-6">
              <app-input
                label="Weather"
                [control]="matchForm.get('WeatherConditions')!"
                placeholder="e.g. Sunny, Overcast">
              </app-input>
            </div>
            <div class="col-md-12">
              <app-input
                label="Live Stream URL"
                [control]="matchForm.get('StreamURL')!"
                placeholder="YouTube / Facebook Live Link">
              </app-input>
            </div>
            <div class="col-md-12">
              <label class="form-label fw-bold small text-uppercase text-muted">Additional Match Notes</label>
              <textarea class="form-control rounded-3" formControlName="MatchNotes" rows="3" placeholder="Any extra details..."></textarea>
            </div>
          </div>

          <div class="col-md-12 mt-4">
            <div class="d-flex gap-3 justify-content-end">
              <button type="button" class="btn btn-light px-4 py-2 border fw-bold rounded-3" 
                (click)="cancel()">Cancel</button>
              <app-button
                type="submit"
                [loading]="isSubmitting()"
                [disabled]="matchForm.invalid"
                variant="primary"
                [label]="isEdit ? 'Update Match' : 'Schedule Match'">
              </app-button>
            </div>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .match-form-container { max-width: 1000px; margin: 0 auto; }
    .vs-badge {
      width: 40px;
      height: 40px;
      background: #f8fafc;
      border: 2px solid #e2e8f0;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 900;
      color: #64748b;
      font-size: 0.8rem;
    }
    .form-check-input:checked {
      background-color: #3b82f6;
      border-color: #3b82f6;
    }
  `]
})
export class MatchFormComponent implements OnInit {
  isEdit = false;
  isSubmitting = signal(false);
  matchForm: FormGroup;

  tournamentOptions = signal<any[]>([]);
  teamOptions = signal<any[]>([]);

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
      TeamA_ID: ['', Validators.required],
      TeamB_ID: ['', Validators.required],
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

    this.isSubmitting.set(true);
    const request = this.isEdit
      ? this.matchService.update(val.MatchID, val)
      : this.matchService.create(val);

    request.subscribe({
      next: () => {
        this.toast.success(`Match ${this.isEdit ? 'updated' : 'scheduled'} successfully!`);
        this.router.navigate(['/kkk/match-list']);
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

