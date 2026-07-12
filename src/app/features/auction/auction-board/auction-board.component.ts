import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, signal, computed } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, Router } from '@angular/router';
import { SocketService } from '@core/services/socket.service';

type BoardTab = 'live' | 'completed' | 'players' | 'teams';

@Component({
  selector: 'app-auction-board',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './auction-board.component.html',
  styleUrl: './auction-board.component.scss'
})
export class AuctionBoardComponent implements OnInit, OnDestroy {
  sessionId = signal<number | null>(null);
  sessionInfo = signal<any>(null);
  allPlayers = signal<any[]>([]);
  allTeams = signal<any[]>([]);
  currentPlayer = signal<any>(null);
  secondsLeft = signal<number>(30);

  error = signal<string>('');
  loading = signal<boolean>(true);

  recentBids = signal<any[]>([]); // For scrolling ticker or notification

  searchQuery = signal<string>('');
  activeTab = signal<BoardTab>('live');

  Math = Math;

  // Auction session is finished — no more "upcoming" players to bid on
  isCompleted = computed(() => this.sessionInfo()?.status === 'completed');

  constructor(
    private route: ActivatedRoute,
    private socketService: SocketService,
    public router: Router
  ) { }

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('sessionId');
      if (id) {
        this.sessionId.set(+id);
        this.setupSocket(+id);
      } else {
        this.error.set('No session ID provided in URL');
        this.loading.set(false);
      }
    });
  }

  ngOnDestroy() {
    this.socketService.disconnect('/auction-board');
  }

  setupSocket(sessionId: number) {
    this.socketService.connect('/auction-board');

    // Request state
    this.socketService.emit('/auction-board', 'watch-session', { sessionId });

    // Initial State
    this.socketService.on('/auction-board', 'board-state').subscribe((state: any) => {
      this.sessionInfo.set(state.session);
      this.allPlayers.set(state.players || []);
      this.allTeams.set(state.teams || []);
      this.currentPlayer.set(state.currentPlayer || null);
      this.secondsLeft.set(state.secondsLeft || 30);
      this.loading.set(false);

      // If the session has already finished, land on the Completed tab
      // instead of the live spotlight (nothing left to bid on).
      if (state.session.status === 'completed') {
        this.activeTab.set('completed');
      }
    });

    // Errors
    this.socketService.on('/auction-board', 'board-error').subscribe((err: any) => {
      this.error.set(err.message);
      this.loading.set(false);
    });

    // Player Started
    this.socketService.on('/auction-board', 'player-started').subscribe((data: any) => {
      this.currentPlayer.set(data.player);
      this.secondsLeft.set(data.secondsLeft);
      this.recentBids.set([]);
    });

    // Timer
    this.socketService.on('/auction-board', 'timer-tick').subscribe((data: any) => {
      this.secondsLeft.set(data.secondsLeft);
    });

    // Bid Placed
    this.socketService.on('/auction-board', 'bid-placed').subscribe((data: any) => {
      const player = this.currentPlayer();
      if (player && player.playerId === data.playerId) {
        this.currentPlayer.set({ ...player, currentBid: data.bidAmount, highestBidTeamId: data.teamId });
      }
      this.recentBids.update(bids => [data, ...bids].slice(0, 5));
    });

    // Player Sold
    this.socketService.on('/auction-board', 'player-sold').subscribe((data: any) => {
      if (data.teams) this.allTeams.set(data.teams);

      this.allPlayers.update(players => {
        return players.map(p => {
          if (p.playerId === data.player.playerId) {
            return { ...p, status: 'sold', highestBidTeamId: data.teamId, currentBid: data.soldPrice, finalPrice: data.soldPrice };
          }
          return p;
        });
      });

      const cp = this.currentPlayer();
      if (cp && cp.playerId === data.player.playerId) {
        this.currentPlayer.set({ ...cp, status: 'sold', highestBidTeamId: data.teamId, currentBid: data.soldPrice });
      }
    });

    // Player Unsold
    this.socketService.on('/auction-board', 'player-unsold').subscribe((data: any) => {
      this.allPlayers.update(players => players.map(p => p.playerId === data.player.playerId ? { ...p, status: 'unsold' } : p));

      const cp = this.currentPlayer();
      if (cp && cp.playerId === data.player.playerId) {
        this.currentPlayer.set({ ...cp, status: 'unsold' });
      }
    });

    // Player Skipped
    this.socketService.on('/auction-board', 'player-skipped').subscribe((data: any) => {
      if (data.skippedPlayerId) {
        this.allPlayers.update(players => players.map(p => p.playerId === data.skippedPlayerId ? { ...p, status: 'skipped' } : p));
      }
      this.currentPlayer.set(data.nextPlayer || null);
    });

    // Session status can also flip to completed via a direct event
    this.socketService.on('/auction-board', 'session-completed').subscribe(() => {
      this.sessionInfo.update(s => ({ ...s, status: 'completed' }));
      this.currentPlayer.set(null);
      this.activeTab.set('completed');
    });
  }

  setTab(tab: BoardTab) {
    this.activeTab.set(tab);
  }

  getTeamName(teamId: number): string {
    return this.allTeams().find(t => t.teamId === teamId)?.name || 'Unknown Team';
  }

  getTeamLogo(teamId: number): string | null {
    return this.allTeams().find(t => t.teamId === teamId)?.logo || null;
  }

  formatPrice(amount: number | null | undefined): string {
    if (amount === null || amount === undefined || isNaN(amount)) return '--';
    if (amount >= 10000000) return (amount / 10000000).toFixed(2) + ' Cr';
    if (amount >= 100000) return (amount / 100000).toFixed(2) + ' L';
    return amount.toLocaleString('en-IN');
  }
 

  statusLabel(status: string): string {
    switch (status) {
      case 'sold': return 'SOLD';
      case 'unsold': return 'UNSOLD';
      case 'traded': return 'TRADED';
      case 'skipped': return 'SKIPPED';
      default: return status?.toUpperCase() || '--';
    }
  }

  // --- Live tab (only relevant while the auction is still running) ---
  get availablePlayers() {
    const list = this.allPlayers().filter(p => p.status === 'available' || p.status === 'live');
    const q = this.searchQuery().trim().toLowerCase();
    if (!q) return list;
    return list.filter(p => (p.name || '').toLowerCase().includes(q));
  }

  get soldPlayers() {
    return this.allPlayers().filter(p => p.status === 'sold').reverse();
  }

  get unsoldPlayers() {
    return this.allPlayers().filter(p => p.status === 'unsold' || p.status === 'skipped');
  }

  // --- Completed tab: every player that has a final outcome ---
  get completedPlayers() {
    const list = this.allPlayers().filter(p =>
      p.status === 'sold' || p.status === 'unsold' || p.status === 'traded' || p.status === 'skipped'
    );
    const q = this.searchQuery().trim().toLowerCase();
    if (!q) return list;
    return list.filter(p => (p.name || '').toLowerCase().includes(q));
  }

  // --- Players tab: full player pool, base price only ---
  get playersList() {
    const q = this.searchQuery().trim().toLowerCase();
    if (!q) return this.allPlayers();
    return this.allPlayers().filter(p => (p.name || '').toLowerCase().includes(q));
  }

  onSearchInput(value: string) {
    this.searchQuery.set(value);
  }
}