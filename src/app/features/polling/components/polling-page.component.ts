import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SettingsService } from '@core/services/settings.service';

@Component({
  selector: 'app-polling-page',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  templateUrl: './polling-page.component.html',
  styleUrls: ['./polling-page.component.scss']
})
export class PollingPageComponent implements OnInit {

  loading = signal(true);
  polls = signal<any[]>([]);

  /** Mobile + OTP */
  mobile: any = '';
  otp = '';
  generatedOtp = '';
  otpSent = false;
  verified = signal(false);

  /** Voting */
  votedPolls = signal<number[]>([]);
  MOBILE_KEY = 'verified_mobile';
  VOTED_KEY = 'voted_polls';

  constructor(
    private settingsService: SettingsService,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit() {
    this.restoreState();
    this.loadPolls();
  }

  restoreState() {
    const m = localStorage.getItem(this.MOBILE_KEY);
    if (m) {
      this.mobile = m;
      this.verified.set(true);
    }

    const v = localStorage.getItem(this.VOTED_KEY);
    if (v) this.votedPolls.set(JSON.parse(v));
  }

  /** OTP FLOW */
  sendOtp() {
    if (!/^[6-9]\d{9}$/.test(this.mobile)) {
      this.snackBar.open('Enter valid mobile number', 'Close', { duration: 3000 });
      return;
    }

    this.generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
    this.otpSent = true;

    console.log('OTP (demo):', this.generatedOtp);
    this.snackBar.open('OTP sent successfully', 'Close', { duration: 3000 });
  }

  verifyOtp() {
    if (this.otp !== this.generatedOtp) {
      this.snackBar.open('Invalid OTP', 'Close', { duration: 3000 });
      return;
    }

    this.verified.set(true);
    localStorage.setItem(this.MOBILE_KEY, this.mobile);
    this.snackBar.open('Mobile verified', 'Close', { duration: 3000 });
  }

  /** POLLS */
  loadPolls() {
    this.settingsService.getPolls().subscribe((res: any) => {
      const arr = Array.isArray(res?.data) ? res.data : res?.data?.polls || [];
      this.polls.set(arr.map((p: any) => ({
        ...p,
        TotalVotes: p.options.reduce((a: number, o: any) => a + o.Votes, 0),
        winner: this.getWinner(p)
      })));
      this.loading.set(false);
    });
  }

  vote(pollId: number, optionId: number) {
    if (!this.verified()) {
      this.snackBar.open('Verify mobile to vote', 'Close', { duration: 3000 });
      return;
    }

    if (this.votedPolls().includes(pollId)) {
      this.snackBar.open('This mobile already voted', 'Close', { duration: 3000 });
      return;
    }

    this.settingsService.votePoll(pollId, optionId, this.mobile).subscribe(() => {
      const voted = [...this.votedPolls(), pollId];
      this.votedPolls.set(voted);
      localStorage.setItem(this.VOTED_KEY, JSON.stringify(voted));
      this.snackBar.open('Vote submitted', 'Close', { duration: 3000 });
      this.loadPolls();
    });
  }

  hasVoted(id: number) {
    return this.votedPolls().includes(id);
  }

  percent(v: number, t: number) {
    return t ? Math.round((v / t) * 100) : 0;
  }

  getWinner(poll: any) {
    return poll.options.reduce((a: any, b: any) => a.Votes > b.Votes ? a : b);
  }
}
