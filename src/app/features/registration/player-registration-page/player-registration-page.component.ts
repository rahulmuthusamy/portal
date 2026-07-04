import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { OnboardingService } from '@core/services/onboarding.service';
import { AuctionSessionService } from '@features/auction/services/auction-session.service';
import { environment } from '@environments/environment';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-player-registration-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './player-registration-page.component.html',
  styleUrls: ['./player-registration-page.component.scss']
})
export class PlayerRegistrationPageComponent implements OnInit {
  playerRegForm = { 
    playerName: '', 
    fatherName: '', 
    contactNumber: '', 
    photoUrl: '', 
    role: 'Batsman', 
    battingStyle: 'Right-hand bat', 
    bowlingStyle: 'Right-arm medium', 
    jerseySize: 'M', 
    basePrice: 100, 
    sessionId: null as any,
    transactionId: ''
  };
  
  selectedPhotoFile: File | null = null;
  selectedReceiptFile: File | null = null;
  receiptPreviewUrl: string | null = null;

  isRegistering = false;
  registrationError = '';

  activeSessions = signal<any[]>([]);
  selectedSessionData: any = null;

  constructor(
    private onboardingService: OnboardingService,
    private auctionSessionService: AuctionSessionService,
    private router: Router
  ) {}

  ngOnInit() {
    this.fetchActiveSessions();
  }

  fetchActiveSessions() {
    this.auctionSessionService.getAuctionList().subscribe({
      next: (res: any) => {
        // Show live or upcoming sessions for registration
        const sessions = (res?.data?.sessions || []).filter((s: any) => s.Status !== 'completed');
        this.activeSessions.set(sessions);
        if (sessions.length > 0) {
          this.playerRegForm.sessionId = sessions[0].SessionID || sessions[0].id;
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
    } else {
      this.selectedSessionData = null;
    }
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
    const phone = this.normalizePhone(this.playerRegForm.contactNumber);
    if (!/^\d{10}$/.test(phone)) {
      this.registrationError = 'Please enter a valid 10-digit mobile number.';
      return;
    }
    if (!this.playerRegForm.playerName || !this.playerRegForm.fatherName || !this.playerRegForm.contactNumber || !this.playerRegForm.sessionId) {
      this.registrationError = 'Please fill all required fields.';
      return;
    }
    if (this.selectedSessionData && this.selectedSessionData.PlayerRegistrationFee > 0) {
      if (!this.playerRegForm.transactionId || !this.selectedReceiptFile) {
        this.registrationError = 'Payment receipt and Transaction ID are required for this auction.';
        return;
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
