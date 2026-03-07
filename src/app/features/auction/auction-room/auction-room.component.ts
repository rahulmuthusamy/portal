import { Component, OnInit, OnDestroy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuctionManagementService } from '../services/auction-management.service';
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
  currentPlayer = signal<any>(null);
  highestBid = signal<number>(0);
  highestBidTeam = signal<any>(null);
  bidHistory = signal<any[]>([]);
  auctionTeams = signal<any[]>([]);
  loading = signal(true);

  apiUrl = environment.apiUrl;

  private route = inject(ActivatedRoute);
  private auctionService = inject(AuctionManagementService);
  private socketService = inject(SocketService);
  private snackBar = inject(MatSnackBar);
  public router = inject(Router);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id') || this.route.snapshot.queryParamMap.get('id');
    if (id) {
      this.sessionId.set(+id);
      this.setupSocket(+id);
      this.loadAuctionState(+id);
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
    this.socketService.emit('/auction', 'join-auction', id);

    this.socketService.on('/auction', 'new-bid').subscribe((data: any) => {
      this.highestBid.set(data.bidAmount);
      this.highestBidTeam.set({ teamId: data.teamId, teamName: data.teamName });
      this.bidHistory.update(prev => [data, ...prev].slice(0, 10));
      this.snackBar.open(`New bid: ${data.bidAmount} by ${data.teamName}`, 'Bid', { duration: 1500 });
    });

    this.socketService.on('/auction', 'player-sold').subscribe((data: any) => {
      this.snackBar.open(`SOLD! ${data.teamName} bought player for ${data.finalBid}`, 'SOLD', {
        duration: 5000,
        panelClass: ['sold-snack']
      });
      this.loadAuctionState(id);
    });

    this.socketService.on('/auction', 'player-unsold').subscribe((data: any) => {
      this.snackBar.open('Player MARKED UNSOLD', 'Unsold', { duration: 3000 });
      this.loadAuctionState(id);
    });

    this.socketService.on('/auction', 'error').subscribe((err: any) => {
      this.snackBar.open(err.message, 'Error', { duration: 3000 });
    });
  }

  loadAuctionState(id: number): void {
    this.loading.set(true);
    // Fetch initial state - we can use the results endpoint or a new detail endpoint
    this.auctionService.getAuctionResults(id).subscribe({
      next: (res: any) => {
        const results = res.data;
        // In a real app, we'd have a specific "Current Player" broadcast or state
        // For now, let's assume the first player in pool without a team is current
        this.auctionTeams.set(results.teams);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  placeBid(team: any): void {
    const currentPrice = this.highestBid() || this.currentPlayer()?.basePrice || 0;
    const bidAmount = currentPrice + 100; // Simple increment

    if (team.remainingBudget < bidAmount) {
      this.snackBar.open('Insufficient Budget!', 'Error', { duration: 2000 });
      return;
    }

    const payload = {
      sessionId: this.sessionId(),
      teamId: team.teamId,
      playerId: this.currentPlayer()?.PlayerID,
      bidAmount: bidAmount
    };

    this.socketService.emit('/auction', 'place-bid', payload);
  }

  sellPlayer(): void {
    if (!this.highestBidTeam()) {
      this.snackBar.open('No bids yet!', 'Wait');
      return;
    }

    const payload = {
      sessionId: this.sessionId(),
      playerId: this.currentPlayer()?.PlayerID,
      teamId: this.highestBidTeam().teamId,
      finalBid: this.highestBid()
    };

    this.socketService.emit('/auction', 'sell-player', payload);
  }

  markUnsold(): void {
    const payload = {
      sessionId: this.sessionId(),
      playerId: this.currentPlayer()?.PlayerID
    };
    this.socketService.emit('/auction', 'mark-unsold', payload);
  }

  getPlayerImageUrl(photo: string): string {
    return photo ? `${this.apiUrl}${photo}` : 'assets/images/default-player.png';
  }
}
