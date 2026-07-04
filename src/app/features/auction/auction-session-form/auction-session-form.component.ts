import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { SHARED_FORM_COMPONENTS } from '@shared/forms/form-controls';
import { AuctionSessionService } from '../services/auction-session.service';
import { TournamentService } from '@features/tournaments/services/tournament.service';
import { ToastService } from '@shared/services/toast.service';
import { Router } from '@angular/router';
import { environment } from '@environments/environment';

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

  // QR Scanner file upload
  qrScannerFile = signal<File | null>(null);
  qrScannerPreview = signal<string | null>(null);
  existingQrUrl = signal<string | null>(null);

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

        // If session has an existing QR image, show it as preview
        if (session.UPIScannerImageURL) {
          this.existingQrUrl.set(`${environment.apiUrl}${session.UPIScannerImageURL}`);
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
          TournamentID: session.TournamentID,
          Description: session.Description,
          PlayerRegistrationFee: session.PlayerRegistrationFee,
          OwnerRegistrationFee: session.OwnerRegistrationFee,
          UPIName: session.UPIName,
          UPIId: session.UPIId
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
      Description: ['', Validators.maxLength(500)],
      PlayerRegistrationFee: [0],
      OwnerRegistrationFee: [0],
      UPIName: [''],
      UPIId: ['']
    });
  }

  onQrFileSelected(event: any): void {
    const file: File = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      this.qrScannerFile.set(file);
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.qrScannerPreview.set(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  }

  removeQrImage(): void {
    this.qrScannerFile.set(null);
    this.qrScannerPreview.set(null);
    this.existingQrUrl.set(null);
  }

  onSubmit(): void {
    if (this.form.invalid) {
      alert('Please fill all required fields correctly.');
      return;
    }

    const formValue = { ...this.form.value };
    const sessionId = formValue.SessionID;  // null when creating
    delete formValue.SessionID;

    // Map Description → Notes (model column name)
    if (formValue.Description !== undefined) {
      formValue.Notes = formValue.Description;
      delete formValue.Description;
    }

    const qrFile = this.qrScannerFile();

    const request$ = this.isEdit
      ? this.auctionSessionService.updateSessionWithFile(sessionId, formValue, qrFile)
      : this.auctionSessionService.createSessionWithFile(formValue, qrFile);

    request$.subscribe({
      next: (response: any) => {
        this.toast.success(response?.message || (this.isEdit ? 'Session updated successfully.' : 'Session created successfully.'));
        sessionStorage.removeItem('SessionID');
        this.router.navigate(['/kkk/auction-session-list']);
      },
      error: (error) => {
        console.error(this.isEdit ? 'Update failed:' : 'Creation failed:', error);
        this.toast.error(error?.error?.message || (this.isEdit ? 'Failed to update session.' : 'Failed to create session.'));
      }
    });
  }
}
