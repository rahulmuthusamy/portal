import { Component, OnInit, OnDestroy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { SocketService } from '@core/services/socket.service';
import { AuctionManagementService } from '../../services/auction-management.service';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatListModule } from '@angular/material/list';
import { environment } from '@environments/environment';

@Component({
  selector: 'app-team-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatListModule
  ],
  templateUrl: './team-dashboard.component.html',
  styleUrls: ['./team-dashboard.component.scss']
})
export class TeamDashboardComponent implements OnInit, OnDestroy {
  sessionId = signal<number | null>(null);
  teamId = signal<number | null>(null);
  
  loading = signal(true);
  selectingSession = signal(false);
  selectingTeam = signal(false);
  availableSessions = signal<any[]>([]);
  availableTeams = signal<any[]>([]);

  team = signal<any>({
    id: 0,
    name: 'Loading...',
    budget: 0,
    players: [] as any[]
  });

  currentPlayer = signal<any>(null);
  highestBid = signal<number>(0);
  highestBidTeamId = signal<number | null>(null);
  highestBidTeamName = signal<string>('No bids yet');
  timer = signal<number>(30);
  progress = signal<number>(100);

  bidHistory = signal<{ amount: number; team: string; time: Date }[]>([]);

  apiUrl = environment.apiUrl;

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private socketService = inject(SocketService);
  private auctionService = inject(AuctionManagementService);
  private snackBar = inject(MatSnackBar);

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const sId = params['id'];
      const tId = params['teamId'];

      if (sId) {
        this.sessionId.set(+sId);
        this.selectingSession.set(false);
        if (tId) {
          this.teamId.set(+tId);
          this.selectingTeam.set(false);
          this.loadDashboardData(+sId, +tId);
        } else {
          // If teamId is missing, show team selection screen
          this.selectingTeam.set(true);
          this.loadTeamsForSelection(+sId);
        }
      } else {
        // If sessionId is missing, show session selection screen
        this.selectingSession.set(true);
        this.selectingTeam.set(false);
        this.loadSessions();
      }
    });
  }

  ngOnDestroy() {
    if (this.sessionId()) {
      this.socketService.disconnect('/auction-team');
    }
  }

  loadSessions() {
    this.loading.set(true);
    this.auctionService.getLiveSessions().subscribe({
      next: (res: any) => {
        this.availableSessions.set(res.data.sessions);
        this.loading.set(false);
      },
      error: (err) => {
        this.snackBar.open('Failed to load sessions list', 'Error', { duration: 3000 });
        this.loading.set(false);
      }
    });
  }

  selectSession(sessionId: number) {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { id: sessionId },
      queryParamsHandling: 'merge'
    });
  }

  loadTeamsForSelection(sessionId: number) {
    this.loading.set(true);
    this.auctionService.getSessionTeams(sessionId).subscribe({
      next: (res: any) => {
        this.availableTeams.set(res.data.teams);
        this.loading.set(false);
      },
      error: (err) => {
        this.snackBar.open('Failed to load teams list', 'Error', { duration: 3000 });
        this.loading.set(false);
      }
    });
  }

  selectTeam(teamId: number) {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { teamId: teamId },
      queryParamsHandling: 'merge'
    });
  }

  loadDashboardData(sessionId: number, teamId: number) {
    this.loading.set(true);
    this.auctionService.getTeamDashboard(sessionId, teamId).subscribe({
      next: (res: any) => {
        const dashboard = res.data;
        this.team.set({
          id: teamId,
          name: dashboard.team.Name,
          budget: dashboard.remainingBudget,
          players: dashboard.boughtPlayers
        });

        this.setupSocket(sessionId, teamId);
      },
      error: (err) => {
        this.snackBar.open('Failed to load team dashboard data', 'Error', { duration: 3000 });
        this.loading.set(false);
      }
    });
  }

  setupSocket(sessionId: number, teamId: number) {
    this.socketService.connect('/auction-team');
    this.socketService.emit('/auction-team', 'join-session', sessionId);
    this.socketService.emit('/auction-team', 'join-team-room', teamId);

    this.socketService.on<any>('/auction-team', 'currentPlayer').subscribe((player: any) => {
      this.currentPlayer.set(player);
      if (player) {
        this.highestBid.set(player.currentBid || player.basePrice);
        this.highestBidTeamId.set(player.highestBidTeam);
        this.highestBidTeamName.set(player.highestBidTeamName || 'No bids yet');
      } else {
        this.highestBid.set(0);
        this.highestBidTeamId.set(null);
        this.highestBidTeamName.set('No bids yet');
      }
      this.bidHistory.set([]); // Clear history for new player
    });

    this.socketService.on<any>('/auction-team', 'bidUpdate').subscribe((data: any) => {
      this.highestBid.set(data.amount);
      this.highestBidTeamId.set(data.teamId);
      this.highestBidTeamName.set(data.teamName);

      this.bidHistory.update(history => [
        { amount: data.amount, team: data.teamName, time: new Date() },
        ...history
      ]);
    });

    this.socketService.on<any>('/auction-team', 'timerUpdate').subscribe((data: any) => {
      this.timer.set(data.timeLeft);
      this.progress.set((data.timeLeft / 30) * 100);
    });

    this.socketService.on<any>('/auction-team', 'playerUpdate').subscribe((player: any) => {
      // If the sold player belongs to this team, update bought list
      if (player.status === 'sold' && player.highestBidTeam === teamId) {
        const boughtPlayer = {
          playerId: player.dbPlayerId,
          playerName: player.name,
          playerRole: player.role,
          playerPhoto: player.photo,
          soldPrice: player.currentBid,
          basePrice: player.basePrice
        };
        this.team.update(t => ({
          ...t,
          players: [...t.players, boughtPlayer]
        }));
        this.snackBar.open(`Congratulations! You bought ${player.name}!`, 'Hooray', { duration: 4000 });
      }
    });

    this.socketService.on<any>('/auction-team', 'teamUpdate').subscribe((updatedTeam: any) => {
      if (updatedTeam.id === teamId) {
        this.team.update(t => ({
          ...t,
          budget: updatedTeam.budget
        }));
      }
    });

    this.socketService.on<any>('/auction-team', 'auctionEnd').subscribe(() => {
      this.currentPlayer.set(null);
      this.snackBar.open('Auction Session finished!', 'Finished', { duration: 5000 });
    });

    this.socketService.on<any>('/auction-team', 'bidRejected').subscribe((data: any) => {
      this.snackBar.open(data.reason || 'Bid rejected', 'Error', { duration: 3000 });
    });

    this.loading.set(false);
  }

  get nextBid(): number {
    const currentPrice = this.highestBid();
    const player = this.currentPlayer();
    if (!player) return 0;
    
    // Increment bid by 100
    return currentPrice ? currentPrice + 100 : player.basePrice;
  }

  canBid(): boolean {
    const player = this.currentPlayer();
    const myBudget = this.team().budget;
    return (
      player &&
      player.status === 'live' &&
      myBudget >= this.nextBid &&
      this.highestBidTeamId() !== this.team().id // Can't bid against yourself
    );
  }

  placeBid() {
    if (this.canBid()) {
      this.socketService.emit('/auction-team', 'place-bid', {
        teamId: this.team().id,
        playerId: this.currentPlayer().dbPlayerId,
        bidAmount: this.nextBid
      });
    }
  }

  getPlayerImageUrl(photo: string): string {
    return photo ? `${this.apiUrl}${photo}` : 'assets/images/default-player.png';
  }
}
