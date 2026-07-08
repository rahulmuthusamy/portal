import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { OnboardingService } from '@core/services/onboarding.service';
import { AuctionSessionService } from '@features/auction/services/auction-session.service';
import { SettingsService } from '@core/services/settings.service';
import { environment } from '@environments/environment';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-owner-registration-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './owner-registration-page.component.html',
  styleUrls: ['./owner-registration-page.component.scss']
})
export class OwnerRegistrationPageComponent implements OnInit {
  regForm = {
    ownerName: '',
    contactNumber: '',
    password: '',
    teamName: '',
    location: '',
    slogan: '',
    sessionId: null as any,
    transactionId: '',
    notes: ''
  };

  selectedReceiptFile: File | null = null;
  receiptPreviewUrl: string | null = null;

  isRegistering = false;
  registrationError = '';
  showPassword = false;
  hideBack = false;

  activeSessions = signal<any[]>([]);
  selectedSessionData: any = null;

  availableLocations = signal<any[]>([]);
  locationSearch = '';
  showLocationDropdown = false;

  private route = inject(ActivatedRoute);

  constructor(
    private onboardingService: OnboardingService,
    private auctionSessionService: AuctionSessionService,
    private settingsService: SettingsService,
    private router: Router
  ) { }

  ngOnInit() {
    this.route.queryParamMap.subscribe(params => {
      const sessionId = params.get('sessionId');
      const hideBack = params.get('hideBack');
      if (sessionId) this.regForm.sessionId = sessionId;
      this.hideBack = hideBack === '1' || hideBack === 'true';
    });

    this.fetchActiveSessions();
    this.loadLocations();
  }

  fetchActiveSessions() {
    this.auctionSessionService.getAuctionList().subscribe({
      next: (res: any) => {
        const sessions = (res?.data?.sessions || []).filter((s: any) => s.Status !== 'completed');
        this.activeSessions.set(sessions);
        if (sessions.length > 0) {
          const selected = sessions.find((s: any) => (s.SessionID || s.id) == this.regForm.sessionId);
          this.regForm.sessionId = selected ? (selected.SessionID || selected.id) : sessions[0].SessionID || sessions[0].id;
          this.onSessionChange();
        }
      },
      error: () => {
        this.registrationError = 'Failed to load auction sessions.';
      }
    });
  }

  loadLocations() {
    this.settingsService.getLocations(true).subscribe({
      next: (res: any) => {
        this.availableLocations.set(res.data?.locations || []);
      },
      error: () => { }
    });
  }

  get filteredLocations() {
    const q = this.locationSearch.toLowerCase();
    return this.availableLocations().filter(loc =>
      !q || (loc.Name || '').toLowerCase().includes(q) || (loc.District || '').toLowerCase().includes(q)
    );
  }

  selectLocation(loc: any) {
    this.regForm.location = loc.Name;
    this.locationSearch = loc.Name + (loc.District ? `, ${loc.District}` : '');
    this.showLocationDropdown = false;
  }

  onLocationSearchFocus() { this.showLocationDropdown = true; }
  onLocationSearchBlur() { setTimeout(() => this.showLocationDropdown = false, 200); }

  onSessionChange() {
    const session = this.activeSessions().find((s: any) => (s.SessionID || s.id) == this.regForm.sessionId);
    if (session) {
      // Resolve relative QR URL to full URL for display
      const qrUrl = session.UPIScannerImageURL;
      this.selectedSessionData = {
        ...session,
        UPIScannerImageURL: qrUrl
          ? (qrUrl.startsWith('http') ? qrUrl : `${environment.apiUrl}${qrUrl}`)
          : null
      };
    } else {
      this.selectedSessionData = null;
    }
  }

  onReceiptSelected(event: any) {
    const file = event.target.files?.[0];
    if (file) {
      this.selectedReceiptFile = file;
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.receiptPreviewUrl = e.target.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  selectedPersonalQrFile: File | null = null;
  personalQrPreviewUrl: string | null = null;

  onPersonalQrSelected(event: any) {
    const file = event.target.files?.[0];
    if (file) {
      this.selectedPersonalQrFile = file;
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.personalQrPreviewUrl = e.target.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  private normalizePhone(value: string) {
    return String(value || '').replace(/\D/g, '').slice(-10);
  }

  submitRegistration() {
    const phone = this.normalizePhone(this.regForm.contactNumber);
    if (!/^\d{10}$/.test(phone)) {
      this.registrationError = 'Please enter a valid 10-digit mobile number.';
      return;
    }
    if (!this.regForm.ownerName || !this.regForm.password || !this.regForm.teamName || !this.regForm.sessionId) {
      this.registrationError = 'Please fill all required fields.';
      return;
    }

    // Check if receipt and transaction ID are present (only if fee exists or is enforced globally)
    if (!this.selectedReceiptFile) {
      this.registrationError = 'Payment receipt are required for team registration.';
      return;
    }

    this.isRegistering = true;
    this.registrationError = '';
    const payload: any = { ...this.regForm, contactNumber: phone };
    if (this.selectedPersonalQrFile) {
      payload.qrCodeFile = this.selectedPersonalQrFile;
    }

    this.onboardingService.registerTeam(payload, this.selectedReceiptFile).subscribe({
      next: () => {
        this.isRegistering = false;
        Swal.fire({
          icon: 'success',
          title: 'Franchise Registered!',
          text: 'Your registration has been submitted and is pending admin approval.',
          confirmButtonColor: '#0ea5e9',
        }).then(() => {
          this.router.navigate(['/']);
        });
      },
      error: (err: any) => {
        this.isRegistering = false;
        this.registrationError = err.error?.message || 'Registration failed. Please try again.';
      }
    });
  }
}
