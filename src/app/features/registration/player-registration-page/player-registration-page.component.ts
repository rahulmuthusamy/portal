import { Component, OnInit, OnDestroy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { OnboardingService } from '@core/services/onboarding.service';
import { AuctionSessionService } from '@features/auction/services/auction-session.service';
import { PlayerService } from '@features/players/services/players.service';
import { environment } from '@environments/environment';
import Swal from 'sweetalert2';
import { PhoneNumberDirective } from '@shared/directive/phone-number.directive';

@Component({
  selector: 'app-player-registration-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, MatIconModule, MatProgressSpinnerModule, PhoneNumberDirective],
  templateUrl: './player-registration-page.component.html',
  styleUrls: ['./player-registration-page.component.scss']
})
export class PlayerRegistrationPageComponent implements OnInit, OnDestroy {
  playerRegForm = {
    playerName: '',
    fatherName: '',
    dob: '',
    contactNumber: '',
    isIconicPlayer: false,
    photoUrl: '',
    role: 'Batsman',
    battingStyle: 'Right-hand bat',
    bowlingStyle: 'Right-arm medium',
    jerseySize: 'M',
    basePrice: 100,
    sessionId: null as any,
    transactionId: '',
    aadharUrl: ''
  };
  maxDate: string = new Date().toISOString().split('T')[0];
  selectedPhotoFile: File | null = null;
  selectedReceiptFile: File | null = null;
  receiptPreviewUrl: string | null = null;
  selectedAadharFile: File | null = null;
  aadharPreviewUrl: string | null = null;

  isRegistering = false;
  registrationError = '';
  hideBack = false;
  IsAgeEligible = signal<boolean>(false);
  activeSessions = signal<any[]>([]);
  selectedSessionData: any = null;
  existingPlayers: any[] = [];
  lookupMessage = '';
  lookupMessageType: 'info' | 'success' | 'error' = 'info';
  private phoneLookupTimer: any;

  countdownDays: number = 0;
  countdownHours: number = 0;
  countdownMinutes: number = 0;
  countdownSeconds: number = 0;
  countdownInterval: any;
  showCountdown: boolean = false;

  private route = inject(ActivatedRoute);

  constructor(
    private onboardingService: OnboardingService,
    private auctionSessionService: AuctionSessionService,
    private playerService: PlayerService,
    private router: Router
  ) { }

  ngOnInit() {
    this.route.queryParamMap.subscribe(params => {
      const sessionId = params.get('sessionId');
      const hideBack = params.get('hideBack');
      if (sessionId) this.playerRegForm.sessionId = sessionId;
      this.hideBack = hideBack === '1' || hideBack === 'true';
    });

    this.fetchActiveSessions();
    this.loadExistingPlayers();
  }

  ngOnDestroy() {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
  }

  fetchActiveSessions() {
    this.auctionSessionService.getAuctionList().subscribe({
      next: (res: any) => {
        // Show live or upcoming sessions for registration
        const sessions = (res?.data?.sessions || []).filter((s: any) => s.Status !== 'completed');
        this.activeSessions.set(sessions);
        if (sessions.length > 0) {
          const selected = sessions.find((s: any) => (s.SessionID || s.id) == this.playerRegForm.sessionId);
          this.playerRegForm.sessionId = selected ? (selected.SessionID || selected.id) : sessions[0].SessionID || sessions[0].id;
          this.onSessionChange();
        }
      },
      error: () => {
        this.registrationError = 'Failed to load auction sessions.';
      }
    });
  }

  onSessionChange() {
    const session = this.activeSessions().find((s: any) => (s.SessionID || s.id) == this.playerRegForm.sessionId);
    if (session) {
      const qrUrl = session.UPIScannerImageURL;
      this.selectedSessionData = {
        ...session,
        UPIScannerImageURL: qrUrl
          ? (qrUrl.startsWith('http') ? qrUrl : `${environment.apiUrl}${qrUrl}`)
          : null
      };
      this.startCountdown(session.EndDate);
    } else {
      this.selectedSessionData = null;
      this.showCountdown = false;
      if (this.countdownInterval) clearInterval(this.countdownInterval);
    }
  }

  startCountdown(endDateStr: string) {
    if (this.countdownInterval) clearInterval(this.countdownInterval);
    this.showCountdown = false;

    if (!endDateStr) return;

    const endDate = new Date(endDateStr).getTime();
    if (isNaN(endDate)) return;

    this.showCountdown = true;

    const updateTimer = () => {
      const now = new Date().getTime();
      const distance = endDate - now;

      if (distance < 0) {
        clearInterval(this.countdownInterval);
        this.countdownDays = 0;
        this.countdownHours = 0;
        this.countdownMinutes = 0;
        this.countdownSeconds = 0;
        this.showCountdown = false;
        return;
      }

      this.countdownDays = Math.floor(distance / (1000 * 60 * 60 * 24));
      this.countdownHours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      this.countdownMinutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      this.countdownSeconds = Math.floor((distance % (1000 * 60)) / 1000);
    };

    updateTimer();
    this.countdownInterval = setInterval(updateTimer, 1000);
  }

  onPhotoSelected(event: any) {
    const file = event.target.files?.[0];
    if (file) {
      this.selectedPhotoFile = file;
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.playerRegForm.photoUrl = e.target.result as string;
      };
      reader.readAsDataURL(file);
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

 

  onAadharSelected(event: any) {
    const file = event.target.files?.[0];
    if (file) {
      this.selectedAadharFile = file;
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.aadharPreviewUrl = e.target.result as string;
        this.playerRegForm.aadharUrl = e.target.result as string;
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


  loadExistingPlayers() {
    this.playerService.getAll().subscribe({
      next: (res: any) => {
        const raw = Array.isArray(res) ? res : (res?.data?.players || res?.players || []);
        this.existingPlayers = Array.isArray(raw) ? raw : [];
      },
      error: () => {
        this.existingPlayers = [];
      }
    });
  }

  onContactNumberChange(value: string) {
    const phone = this.normalizePhone(value);

    if (this.phoneLookupTimer) {
      clearTimeout(this.phoneLookupTimer);
    }

    if (!phone || phone.length < 10) {
      this.lookupMessage = '';
      this.lookupMessageType = 'info';
      return;
    }

    this.phoneLookupTimer = setTimeout(() => {
      this.lookupExistingPlayer(phone);
    }, 350);
  }

  lookupExistingPlayer(phone: string) {
    if (!phone || phone.length < 10) {
      this.lookupMessage = '';
      this.lookupMessageType = 'info';
      return;
    }

    const match = this.existingPlayers.find((player: any) => {
      const existingPhone = this.normalizePhone(player.Mobile || player.contactNumber || player.Contact || player.mobile || '');
      return existingPhone === phone;
    });

    if (match) {
      const basicInfo = [
        match.Name ? `<div><strong>Name:</strong> ${match.Name}</div>` : null,
        match.FatherName ? `<div><strong>Father:</strong> ${match.FatherName}</div>` : null,
        match.DOB ? `<div><strong>DOB:</strong> ${match.DOB}</div>` : null,
        match.Role ? `<div><strong>Role:</strong> ${match.Role}</div>` : null
      ].filter(Boolean).join('');

      Swal.fire({
        icon: 'question',
        title: 'Existing information found',
        html: `We found an existing profile for this phone number.<br><br><div style="text-align:left; line-height:1.6;">${basicInfo || '<div>No additional details available.</div>'}</div><br>Do you want to use these details?`,
        showCancelButton: true,
        confirmButtonText: 'Yes, use it',
        cancelButtonText: 'No, clear phone',
        confirmButtonColor: '#0ea5e9',
        cancelButtonColor: '#ef4444'
      }).then((result) => {
        if (result.isConfirmed) {
          this.applyExistingPlayer(match);
          this.lookupMessage = 'Existing profile details were applied.';
          this.lookupMessageType = 'success';
        } else {
          this.playerRegForm = { ...this.playerRegForm, contactNumber: '' };
          this.lookupMessage = 'Phone number cleared. You can enter a new number or continue with fresh details.';
          this.lookupMessageType = 'error';
        }
      });
    } else {
      this.lookupMessage = 'No existing profile found for this number. You can continue with a new registration.';
      this.lookupMessageType = 'error';
    }
  }

  applyExistingPlayer(player: any) {
    this.playerRegForm = {
      ...this.playerRegForm,
      playerName: this.playerRegForm.playerName || player.Name || '',
      fatherName: this.playerRegForm.fatherName || player.FatherName || '',
      dob: this.playerRegForm.dob || player.DOB || '',
      role: this.playerRegForm.role || player.Role || 'Batsman',
      battingStyle: this.playerRegForm.battingStyle || player.BattingStyle || 'Right-hand bat',
      bowlingStyle: this.playerRegForm.bowlingStyle || player.BowlingStyle || 'Right-arm medium',
      jerseySize: this.playerRegForm.jerseySize || player.JerseySize || 'M',
      photoUrl: this.playerRegForm.photoUrl || this.normalizePhotoUrl(player.PhotoURL),
      aadharUrl: this.playerRegForm.aadharUrl || this.normalizePhotoUrl(player.AadharURL)
    };

    if (this.playerRegForm.dob) {
      this.onDobChange(this.playerRegForm.dob);
    }
  }

  private normalizePhotoUrl(url: string | null | undefined): string {
    if (!url) return '';
    return url.startsWith('http') ? url : `${environment.apiUrl}${url}`;
  }

  onDobChange(dob: string): void {
    const age = this.calculateAge(dob);
    if (age < 19) {
      this.IsAgeEligible.set(false);
    } else {
      this.IsAgeEligible.set(true);
    }
  }
  calculateAge(dob: string | Date): number {
    if (!dob) return 0;

    const birthDate = new Date(dob);
    const today = new Date();

    let age = today.getFullYear() - birthDate.getFullYear();

    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    return age;
  }

  submitRegistration() {
    const phone = this.normalizePhone(this.playerRegForm.contactNumber);
    if (!/^\d{10}$/.test(phone)) {
      this.registrationError = 'Please enter a valid 10-digit mobile number.';
      return;
    }
    if (!this.playerRegForm.photoUrl ||!this.playerRegForm.aadharUrl || !this.playerRegForm.playerName || !this.playerRegForm.fatherName || !this.playerRegForm.contactNumber || !this.playerRegForm.sessionId || !this.playerRegForm.dob) {
      this.registrationError = 'Please fill all required fields.';
      return;
    }

    if (this.IsAgeEligible() === true) {
      if (this.selectedSessionData && this.selectedSessionData.PlayerRegistrationFee > 0) {
        if (!this.selectedReceiptFile) {
          this.registrationError = 'Payment receipt are required for this auction.';
          return;
        }
      }
    }

    this.isRegistering = true;
    this.registrationError = '';
    const payload: any = { ...this.playerRegForm, contactNumber: phone };
    if (this.selectedPhotoFile) {
      payload.photoFile = this.selectedPhotoFile;
    }
    if (this.selectedPersonalQrFile) {
      payload.qrCodeFile = this.selectedPersonalQrFile;
    }
    if (this.selectedAadharFile) {
      payload.aadharFile = this.selectedAadharFile;
    }

    this.onboardingService.registerPlayerForAuction(payload, this.selectedReceiptFile || undefined).subscribe({
      next: () => {
        this.isRegistering = false;
        Swal.fire({
          icon: 'success',
          title: 'Registration Successful!',
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
