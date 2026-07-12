import { Component, OnInit, OnDestroy, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { SocketService } from '@core/services/socket.service';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { environment } from '@environments/environment';
import { AuctionManagementService } from '../services/auction-management.service';

@Component({
  selector: 'app-auction-room',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatSnackBarModule,
    MatListModule,
    MatDividerModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatTooltipModule
  ],
  templateUrl: './auction-room.component.html',
  styleUrl: './auction-room.component.scss'
})
export class AuctionRoomComponent implements OnInit, OnDestroy {
  sessionId = signal<number | null>(null);
  sessionInfo = signal<any>(null);
  currentPlayer = signal<any>(null);
  secondsLeft = signal<number>(30);
  bidHistory = signal<any[]>([]);
  auctionTeams = signal<any[]>([]);
  allPlayers = signal<any[]>([]);
  loading = signal(true);

  apiUrl = environment.apiUrl;

  private route = inject(ActivatedRoute);
  private socketService = inject(SocketService);
  private snackBar = inject(MatSnackBar);
  public router = inject(Router);
  private auctionService = inject(AuctionManagementService);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id') || this.route.snapshot.queryParamMap.get('id') || this.route.parent?.snapshot.paramMap.get('sessionId');
    if (id) {
      this.sessionId.set(+id);
      this.setupSocket(+id);
    } else {
      this.snackBar.open('Session ID missing', 'Error');
    }
  }

  ngOnDestroy(): void {
    if (this.sessionId()) {
      this.socketService.disconnect('/auction');
    }
  }

  setupSocket(id: number): void {
    this.socketService.connect('/auction');

    // Handle connection error (bad JWT, server down)
    this.socketService.onConnectError('/auction').subscribe((err: any) => {
      this.snackBar.open(`Socket failed: ${err.message}`, 'Error', { duration: 5000 });
      this.loading.set(false);
    });

    // join-session buffered inside emit() until socket is connected
    this.socketService.emit('/auction', 'join-session', { sessionId: id });

    // Safety timeout for loading
    const loadTimeout = setTimeout(() => {
      if (this.loading()) {
        this.snackBar.open('Connection timed out — check the backend is running', 'Retry', { duration: 8000 });
        this.loading.set(false);
      }
    }, 12000);

    // Handle full state payload
    this.socketService.on('/auction', 'session-state').subscribe((state: any) => {
      clearTimeout(loadTimeout);
      this.sessionInfo.set(state.session);
      this.auctionTeams.set(state.teams);
      this.allPlayers.set(state.players || []);
      this.currentPlayer.set(state.currentPlayer);
      this.secondsLeft.set(state.secondsLeft || 30);
      this.loading.set(false);
    });

    // Handle timer
    this.socketService.on('/auction', 'timer-tick').subscribe((data: any) => {
      this.secondsLeft.set(data.secondsLeft);
    });

    // Handle player status changes
    this.socketService.on('/auction', 'player-started').subscribe((data: any) => {
      this.currentPlayer.set(data.player);
      this.secondsLeft.set(data.secondsLeft);
      this.bidHistory.set([]);
      this.snackBar.open(`${data.player.name} is now LIVE for bidding!`, 'Go', { duration: 2000 });
    });

    this.socketService.on('/auction', 'player-sold').subscribe((data: any) => {
      this.snackBar.open(`SOLD! ${data.player.name} to Team ${data.teamId} for ₹${data.soldPrice}`, 'SOLD', {
        duration: 5000,
        panelClass: ['sold-snack']
      });
      // Update teams with new budgets
      if (data.teams) {
        this.auctionTeams.set(data.teams);
      }
      // Wait a moment then ask for state again or process nextPlayer
      setTimeout(() => this.socketService.emit('/auction', 'get-state', {}), 3000);
    });

    this.socketService.on('/auction', 'player-unsold').subscribe((data: any) => {
      this.snackBar.open(`${data.player.name} went UNSOLD`, 'Unsold', { duration: 3000 });
      setTimeout(() => this.socketService.emit('/auction', 'get-state', {}), 3000);
    });

    this.socketService.on('/auction', 'player-skipped').subscribe((data: any) => {
      this.snackBar.open(`Player SKIPPED by Admin`, 'Skipped', { duration: 2000 });
      setTimeout(() => this.socketService.emit('/auction', 'get-state', {}), 2000);
    });

    // Handle bids
    this.socketService.on('/auction', 'bid-placed').subscribe((data: any) => {
      // Update current player's bid directly
      const player = this.currentPlayer();
      if (player && player.playerId === data.playerId) {
        player.currentBid = data.bidAmount;
        player.highestBidTeamId = data.teamId;
        this.currentPlayer.set({ ...player });
      }

      this.bidHistory.update(prev => [data, ...prev].slice(0, 10));
      this.snackBar.open(`New bid: ₹${data.bidAmount} by ${data.teamName || 'Team ' + data.teamId}`, 'Bid', { duration: 1500 });
    });

    // Handle errors
    this.socketService.on('/auction', 'error').subscribe((err: any) => {
      this.snackBar.open(err.message, 'Error', { duration: 3000 });
    });

    this.socketService.on('/auction', 'bid-rejected').subscribe((err: any) => {
      this.snackBar.open(`Bid Failed: ${err.reason}`, 'Error', { duration: 3000 });
    });

    this.socketService.on('/auction', 'auction-paused').subscribe((data: any) => {
      this.snackBar.open('Auction Paused', 'Info', { duration: 3000 });
      this.sessionInfo.update(s => ({ ...s, status: 'upcoming' }));
    });

    this.socketService.on('/auction', 'auction-end').subscribe((data: any) => {
      this.snackBar.open('Auction Ended', 'Info', { duration: 3000 });
      this.sessionInfo.update(s => ({ ...s, status: 'completed' }));
    });
  }

  // --- ADMIN ACTIONS ---
  pauseAuction(): void {
    const id = this.sessionId();
    if (id) {
      this.auctionService.pauseAuction(id).subscribe({
        next: () => this.snackBar.open('Auction Paused Successfully', 'Success', { duration: 3000 }),
        error: (err) => this.snackBar.open(`Failed to pause: ${err.error?.message || err.message}`, 'Error', { duration: 3000 })
      });
    }
  }

  resumeAuction(): void {
    const id = this.sessionId();
    if (id) {
      this.auctionService.startAuction(id).subscribe({
        next: () => this.snackBar.open('Auction Resumed Successfully', 'Success', { duration: 3000 }),
        error: (err) => this.snackBar.open(`Failed to resume: ${err.error?.message || err.message}`, 'Error', { duration: 3000 })
      });
    }
  }

  endAuction(): void {
    const id = this.sessionId();
    if (id) {
      if (confirm('Are you sure you want to end this auction?')) {
        this.auctionService.completeAuction(id).subscribe({
          next: () => this.snackBar.open('Auction Ended Successfully', 'Success', { duration: 3000 }),
          error: (err) => this.snackBar.open(`Failed to end: ${err.error?.message || err.message}`, 'Error', { duration: 3000 })
        });
      }
    }
  }

  startPlayer(): void {
    this.socketService.emit('/auction', 'start-player', {});
  }

  skipPlayer(): void {
    this.socketService.emit('/auction', 'skip-player', {});
  }

  sellPlayer(): void {
    const player = this.currentPlayer();
    if (!player || !player.highestBidTeamId) {
      this.snackBar.open('No bids yet!', 'Wait');
      return;
    }
    this.socketService.emit('/auction', 'sell-player', {
      teamId: player.highestBidTeamId,
      finalBid: player.currentBid
    });
  }

  requeueUnsoldPlayers(): void {
    const id = this.sessionId();
    if (!id) return;
    this.auctionService.requeueUnsoldPlayers(id).subscribe({
      next: (res: any) => {
        const count = res?.data?.requeuedCount ?? 0;
        this.snackBar.open(`✅ ${count} player(s) re-queued for auction`, 'OK', { duration: 3000 });
        // Refresh state from server
        this.socketService.emit('/auction', 'get-state', {});
      },
      error: (err: any) => this.snackBar.open(`Failed: ${err.error?.message || err.message}`, 'Error', { duration: 3000 })
    });
  }

  get unsoldCount(): number {
    return this.allPlayers().filter(p => p.status === 'unsold' || p.status === 'skipped').length;
  }

  markUnsold(): void {
    this.socketService.emit('/auction', 'mark-unsold', {});
  }

  getHighestBidTeamName(): string {
    const player = this.currentPlayer();
    if (!player || !player.highestBidTeamId) return '';
    const team = this.auctionTeams().find(t => t.teamId === player.highestBidTeamId);
    return team ? team.name : `Team ${player.highestBidTeamId}`;
  }

  getPlayerImageUrl(photo: string): string {
    return photo ? `${this.apiUrl}${photo}` : 'assets/images/default-player.png';
  }
}
