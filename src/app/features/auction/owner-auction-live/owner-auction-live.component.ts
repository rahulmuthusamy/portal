import {
  Component, OnInit, OnDestroy, signal, inject, computed
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SocketService } from '@core/services/socket.service';
import { AuctionManagementService } from '../services/auction-management.service';
import { AuthService } from '@core/services/auth.service';
import { environment } from '@environments/environment';

@Component({
  selector: 'app-owner-auction-live',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './owner-auction-live.component.html',
  styleUrl: './owner-auction-live.component.scss'
})
export class OwnerAuctionLiveComponent implements OnInit, OnDestroy {

  // ── State ──
  loading = signal(true);
  auctionStatus = signal<'waiting' | 'live' | 'ended'>('waiting');
  statusMessage = signal('Waiting for auction to start...');

  sessionInfo = signal<any>(null);
  sessionId = signal<number | null>(null);
  currentPlayer = signal<any>(null);
  secondsLeft = signal<number>(30);
  bidHistory = signal<any[]>([]);
  allTeams = signal<any[]>([]);
  mySquad = signal<any[]>([]);
  notification = signal<string | null>(null);

  // ── Bidder Identity ──
  private authService = inject(AuthService);
  private socketService = inject(SocketService);
  private auctionService = inject(AuctionManagementService);
  public router = inject(Router);
  apiUrl = environment.apiUrl;

  get myTeamId(): number | null {
    const user = this.authService.getUser();
    return user?.ownerProfile?.TeamID ?? null;
  }

  get myTeamName(): string {
    return this.myTeam()?.name ?? 'Your Team';
  }

  myTeam = computed(() => this.allTeams().find(t => t.teamId === this.myTeamId) ?? null);

  get timerPercent(): number {
    return (this.secondsLeft() / 30) * 100;
  }

  get nextBidAmount(): number {
    const player = this.currentPlayer();
    if (!player) return 0;
    const current = player.currentBid || player.basePrice || 0;
    if (current >= 50000) return current + 5000;
    if (current >= 10000) return current + 2000;
    if (current >= 5000) return current + 1000;
    if (current >= 1000) return current + 500;
    return current + 100;
  }

  canBid = computed(() => {
    const player = this.currentPlayer();
    const team = this.myTeam();
    if (!player || !team) return false;
    return (
      player.status === 'live' &&
      this.auctionStatus() === 'live' &&
      team.remainingBudget >= this.nextBidAmount &&
      player.highestBidTeamId !== this.myTeamId
    );
  });

  ngOnInit() {
    if (!this.myTeamId) {
      this.statusMessage.set('Your account is not linked to a team. Please contact the admin.');
      this.loading.set(false);
      return;
    }
    this.loadLiveSession();
  }

  ngOnDestroy() {
    this.socketService.disconnect('/auction');
  }

  loadLiveSession() {
    this.auctionService.getLiveSessions().subscribe({
      next: (res: any) => {
        const sessions = res?.data?.sessions ?? [];
        if (!sessions.length) {
          this.statusMessage.set('No active auction sessions at the moment. Please wait for the admin to start one.');
          this.loading.set(false);
          return;
        }
        // Find the session where my team is registered
        const mySession = sessions[0]; // Use the first live/upcoming session
        this.sessionId.set(mySession.SessionID ?? mySession.sessionId);
        this.setupSocket(this.sessionId()!);
      },
      error: () => {
        this.statusMessage.set('Failed to load auction session. Please refresh.');
        this.loading.set(false);
      }
    });
  }

  setupSocket(sessionId: number) {
    // Connect to the shared /auction namespace (same as admin)
    this.socketService.connect('/auction');
    this.socketService.emit('/auction', 'join-session', { sessionId });

    // Full state on join
    this.socketService.on('/auction', 'session-state').subscribe((state: any) => {
      this.sessionInfo.set(state.session);
      this.allTeams.set(state.teams ?? []);
      this.currentPlayer.set(state.currentPlayer ?? null);
      this.secondsLeft.set(state.secondsLeft ?? 30);

      if (state.session?.status === 'live') {
        this.auctionStatus.set('live');
        this.statusMessage.set('Auction is LIVE!');
      } else {
        this.auctionStatus.set('waiting');
        this.statusMessage.set('Session is ready. Waiting for admin to start the auction...');
      }

      // Load my squad
      if (this.myTeamId) {
        this.loadTeamDashboard(sessionId);
      }
      this.loading.set(false);

      // Auto-register team if not in the session
      const myTeamInSession = state.teams?.find((t: any) => t.teamId === this.myTeamId);
      if (!myTeamInSession && this.myTeamId) {
        this.registerMyTeam(sessionId);
      }
    });

    // Auction started by admin
    this.socketService.on('/auction', 'auction-started').subscribe(() => {
      this.auctionStatus.set('live');
      this.statusMessage.set('🚀 Auction has started! Get ready to bid!');
      this.showNotification('🔥 Auction is now LIVE!');
    });

    // Player started for bidding
    this.socketService.on('/auction', 'player-started').subscribe((data: any) => {
      this.currentPlayer.set(data.player);
      this.secondsLeft.set(data.secondsLeft ?? 30);
      this.bidHistory.set([]);
      this.auctionStatus.set('live');
      this.showNotification(`🏏 ${data.player.name} is up for bidding!`);
    });

    // Timer tick
    this.socketService.on('/auction', 'timer-tick').subscribe((data: any) => {
      this.secondsLeft.set(data.secondsLeft);
    });

    // Bid placed
    this.socketService.on('/auction', 'bid-placed').subscribe((data: any) => {
      const player = this.currentPlayer();
      if (player && player.playerId === data.playerId) {
        this.currentPlayer.set({ ...player, currentBid: data.bidAmount, highestBidTeamId: data.teamId });
      }
      this.bidHistory.update(prev => [data, ...prev].slice(0, 15));

      if (data.teamId === this.myTeamId) {
        this.showNotification(`✅ Your bid of ₹${data.bidAmount.toLocaleString()} is leading!`);
      } else {
        this.showNotification(`💰 ${data.teamName ?? 'Team'} bid ₹${data.bidAmount.toLocaleString()}`);
      }
    });

    // Bid accepted (my bid confirmed)
    this.socketService.on('/auction', 'bid-accepted').subscribe((data: any) => {
      this.showNotification(`✅ Bid of ₹${data.bidAmount.toLocaleString()} accepted!`);
    });

    // Bid rejected
    this.socketService.on('/auction', 'bid-rejected').subscribe((err: any) => {
      this.showNotification(`❌ Bid rejected: ${err.reason}`);
    });

    // Player sold
    this.socketService.on('/auction', 'player-sold').subscribe((data: any) => {
      if (data.teams) this.allTeams.set(data.teams);
      const wonByMe = data.teamId === this.myTeamId;
      if (wonByMe) {
        this.showNotification(`🏆 You won ${data.player?.name}! for ₹${data.soldPrice?.toLocaleString()}`);
        // Refresh my squad
        if (this.myTeamId) {
          this.auctionService.getTeamDashboard(sessionId, this.myTeamId).subscribe({
            next: (res: any) => this.mySquad.set(res?.data?.boughtPlayers ?? [])
          });
        }
      } else {
        this.showNotification(`🔨 ${data.player?.name} sold for ₹${data.soldPrice?.toLocaleString()}`);
      }
    });

    // Player unsold
    this.socketService.on('/auction', 'player-unsold').subscribe((data: any) => {
      this.showNotification(`❌ ${data.player?.name} went UNSOLD`);
    });

    // Player skipped
    this.socketService.on('/auction', 'player-skipped').subscribe(() => {
      this.showNotification(`⏭ Player skipped by admin`);
    });

    // Auction ended
    this.socketService.on('/auction', 'auction-end').subscribe(() => {
      this.auctionStatus.set('ended');
      this.currentPlayer.set(null);
      this.statusMessage.set('🏁 Auction has ended! Check your final squad below.');
    });

    // Error
    this.socketService.on('/auction', 'error').subscribe((err: any) => {
      this.showNotification(`⚠️ ${err.message}`);
    });

    // Team registered callback
    this.socketService.on('/auction', 'team-registered').subscribe((res: any) => {
      if (res.success) {
        this.showNotification('✅ Your team has been registered in the auction');
      } else {
        this.showNotification(`❌ Failed to register team: ${res.message || 'Unknown error'}`);
      }
    });
  }

  registerMyTeam(sessionId: number) {
    if (!this.myTeamId) return;

    // Emit registration request - the listener is already set up in setupSocket
    this.socketService.emit('/auction', 'register-team', { teamId: this.myTeamId });
  }

  loadTeamDashboard(sessionId: number) {
    this.auctionService.getTeamDashboard(sessionId, this.myTeamId!).subscribe({
      next: (res: any) => {
        this.mySquad.set(res?.data?.boughtPlayers ?? []);
      },
      error: (err: any) => {
        console.warn('Team dashboard not available:', err.error?.message || err.message);
      }
    });
  }

  placeBid() {
    const player = this.currentPlayer();
    if (!player || !this.canBid() || !this.myTeamId) return;

    this.socketService.emit('/auction', 'place-bid', {
      teamId: this.myTeamId,
      playerId: player.playerId,
      bidAmount: this.nextBidAmount
    });
  }

  showNotification(msg: string) {
    this.notification.set(msg);
    setTimeout(() => this.notification.set(null), 4000);
  }

  getPlayerImageUrl(photo: string): string {
    if (!photo) return 'assets/images/default-player.png';
    return photo.startsWith('http') ? photo : `${this.apiUrl}${photo}`;
  }

  getTeamLogoUrl(logo: string): string {
    if (!logo) return 'assets/logo.jpeg';
    return logo.startsWith('http') ? logo : `${this.apiUrl}${logo}`;
  }

  getHighestBidTeamName(): string {
    const player = this.currentPlayer();
    if (!player?.highestBidTeamId) return 'No bids yet';
    const team = this.allTeams().find(t => t.teamId === player.highestBidTeamId);
    return team?.name ?? `Team ${player.highestBidTeamId}`;
  }

  isHighestBidder(): boolean {
    const player = this.currentPlayer();
    return !!player && player.highestBidTeamId === this.myTeamId;
  }

  logout() {
    this.authService.logout();
  }
}
