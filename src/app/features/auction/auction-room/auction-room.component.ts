import { Component, OnInit, OnDestroy, signal, inject } from '@angular/core';
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
import { environment } from '@environments/environment';

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
    MatProgressSpinnerModule
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
  loading = signal(true);

  apiUrl = environment.apiUrl;

  private route = inject(ActivatedRoute);
  private socketService = inject(SocketService);
  private snackBar = inject(MatSnackBar);
  public router = inject(Router);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id') || this.route.snapshot.queryParamMap.get('id');
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
    // Reconnect/Join room
    this.socketService.emit('/auction', 'join-session', { sessionId: id });

    // Handle full state payload
    this.socketService.on('/auction', 'session-state').subscribe((state: any) => {
      this.sessionInfo.set(state.session);
      this.auctionTeams.set(state.teams);
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
  }

  // --- ADMIN ACTIONS ---
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
