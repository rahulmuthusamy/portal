import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { SHARED_FORM_COMPONENTS } from '@shared/forms/form-controls';
import { AuctionSessionService } from '../services/auction-session.service';
import { TournamentService } from '@features/tournaments/services/tournament.service';
import { ToastService } from '@shared/services/toast.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-auction-session-form',
  imports: [
    CommonModule, ReactiveFormsModule,
    ...SHARED_FORM_COMPONENTS
  ],
  templateUrl: './auction-session-form.component.html',
  styleUrl: './auction-session-form.component.scss'
})
export class AuctionSessionFormComponent {
  form!: FormGroup;
  isEdit: boolean = false;
  Status = ['upcoming', 'live', 'completed'];
  StatusOptions = this.Status.map(s => ({ label: s, value: s }));
  tournaments: any[] = [];
  tournamentOptions: any[] = [];

  constructor(
    private fb: FormBuilder,
    private auctionSessionService: AuctionSessionService,
    private tournamentService: TournamentService,
    private toast: ToastService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.InitForm();
    this.loadTournaments();
    const id = sessionStorage.getItem('SessionID');
    if (id) {
      this.isEdit = true;
      this.getByID(+id);
    }
  }

  loadTournaments() {
    this.tournamentService.getAll().subscribe({
      next: (res: any) => {
        this.tournaments = res.data?.tournaments || res.data || [];
        this.tournamentOptions = this.tournaments.map(t => ({
          label: t.Name,
          value: t.TournamentID
        }));
      },
      error: (err) => console.error('Failed to load tournaments', err)
    });
  }

  getByID(id: number) {
    this.auctionSessionService.getById(id).subscribe({
      next: (response: any) => {
        const session = response?.data?.sessions;

        if (!session) {
          console.warn('No session data found');
          return;
        }

        this.form.patchValue({
          SessionID: session.SessionID,
          Name: session.Name,
          Status: session.Status,
          StartDate: session.StartDate,
          EndDate: session.EndDate,
          Year: session.Year,
          MaxBudget: session.MaxBudget,
          MaxPlayersPerTeam: session.MaxPlayersPerTeam,
          TournamentID: session.TournamentID
        });
      },
      error: (error: any) => {
        console.error('Error fetching session:', error);
      }
    });

  }

  InitForm() {
    this.form = this.fb.group({
      SessionID: [],
      Name: ['', Validators.required],
      Status: ['upcoming'],
      StartDate: ['', Validators.required],
      EndDate: ['', Validators.required],
      Year: [new Date().getFullYear(), [Validators.required, Validators.min(2000)]],
      MaxBudget: [100, [Validators.required, Validators.min(1)]],
      MaxPlayersPerTeam: [11, [Validators.required, Validators.min(1)]],
      TournamentID: [null],
      Description: ['']
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      alert('Please fill all required fields correctly.');
      return;
    }

    const auction = this.form.value;

    const request$ = this.isEdit
      ? this.auctionSessionService.update(auction.SessionID, auction)
      : this.auctionSessionService.create(auction);

    request$.subscribe({
      next: (response: any) => {
        this.toast.success(response?.message || (this.isEdit ? 'Session updated successfully.' : 'Session created successfully.'));
        this.router.navigate(['/kkk/auction-session-list']);
      },
      error: (error) => {
        console.error(this.isEdit ? 'Update failed:' : 'Creation failed:', error);
        this.toast.error(this.isEdit ? 'Failed to update session.' : 'Failed to create session.');
      }
    });
  }

}
