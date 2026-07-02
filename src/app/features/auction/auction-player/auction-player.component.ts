import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { SHARED_FORM_COMPONENTS } from '@shared/forms/form-controls';
import { AuctionPlayerService } from '../services/auction-player.services';
import { AuctionManagementService } from '../services/auction-management.service';
import { ToastService } from '@shared/services/toast.service';

@Component({
  selector: 'app-auction-player',

  imports: [
    CommonModule,
    ReactiveFormsModule,
    ...SHARED_FORM_COMPONENTS
  ],
  templateUrl: './auction-player.component.html',
  styleUrl: './auction-player.component.scss'
})
export class AuctionPlayerComponent implements OnInit {
  form!: FormGroup;
  existingImageUrl = '';
  loading = false;
  submitting = false;
  playerNotFound = false;

  sessions: { label: string; value: number }[] = [];
  sessionsLoading = true;

  roles = [
    { label: 'Batsman', value: 'batsman' },
    { label: 'Bowler', value: 'bowler' },
    { label: 'All-Rounder', value: 'allrounder' },
    { label: 'Wicket-Keeper', value: 'wicketkeeper' }
  ];

  constructor(
    private fb: FormBuilder,
    private auctionPlayerService: AuctionPlayerService,
    private auctionMgt: AuctionManagementService,
    private toast: ToastService
  ) { }

  ngOnInit(): void {
    this.InitForm();
    this.loadSessions();
  }

  InitForm() {
    this.form = this.fb.group({
      SessionID: [null, Validators.required],
      PhotoURL: [null],
      Name: ['', Validators.required],
      DOB: ['', Validators.required],
      FatherName: ['', Validators.required],
      Mobile: ['', Validators.required],
      Email: ['', [Validators.email]],
      Role: ['', Validators.required],
      BasePrice: [0, [Validators.required, Validators.min(0)]],
      Status: ['Active', Validators.required]
    });
  }

  loadSessions() {
    this.sessionsLoading = true;
    this.auctionMgt.getLiveSessions().subscribe({
      next: (res: any) => {
        const raw: any[] = res?.data?.sessions || [];
        this.sessions = raw.map((s: any) => ({
          label: `${s.Name} (${s.Year}) — ${s.Status}`,
          value: s.SessionID
        }));
        // Auto-select if only one session
        if (this.sessions.length === 1) {
          this.form.patchValue({ SessionID: this.sessions[0].value });
        }
        this.sessionsLoading = false;
      },
      error: () => {
        this.toast.error('Failed to load auction sessions.');
        this.sessionsLoading = false;
      }
    });
  }

  onSubmit() {
    if (this.form.invalid) {
      this.toast.info('Please fill all required fields correctly.');
      this.form.markAllAsTouched();
      return;
    }

    this.submitting = true;
    const payload = this.form.getRawValue();

    this.auctionPlayerService.create(payload).subscribe({
      next: () => {
        this.toast.success('Player registered for auction successfully!');
        this.form.reset({ Status: 'Active', BasePrice: 0 });
        // Re-apply session if only one exists
        if (this.sessions.length === 1) {
          this.form.patchValue({ SessionID: this.sessions[0].value });
        }
        this.existingImageUrl = '';
        this.submitting = false;
      },
      error: (err: any) => {
        if (err.status === 409) {
          this.toast.error('This player is already registered for this auction session.');
        } else if (err.status === 400 && err.error?.message?.includes('mobile')) {
          this.toast.error('This mobile number is already registered.');
        } else {
          this.toast.error(err.error?.message || 'Failed to register. Please try again.');
        }
        this.submitting = false;
        console.error(err);
      }
    });
  }
}
