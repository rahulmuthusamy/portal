import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatListModule } from '@angular/material/list';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import { AuctionManagementService } from '../services/auction-management.service';
import { AuctionSessionService } from '../services/auction-session.service';
import { TeamsService } from '../../teams/services/teams.service';
import { PlayerService } from '../../players/services/players.service';

@Component({
  selector: 'app-auction-session-detail',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatCardModule, MatButtonModule,
    MatIconModule, MatSnackBarModule, MatProgressSpinnerModule, MatListModule,
    MatDialogModule, MatSelectModule, MatFormFieldModule, MatInputModule
  ],
  templateUrl: './auction-session-detail.component.html',
  styleUrls: ['./auction-session-detail.component.scss']
})
export class AuctionSessionDetailComponent implements OnInit {
  activeTab: 'teams' | 'players' = 'teams';
  sessionId = signal<number | null>(null);
  sessionData = signal<any>(null);
  loading = signal(true);
  
  sessionTeams = signal<any[]>([]);
  sessionPlayers = signal<any[]>([]);
  
  // For adding
  allTeams = signal<any[]>([]);
  allPlayers = signal<any[]>([]);
  
  selectedTeamId = signal<number | null>(null);
  selectedPlayerId = signal<number | null>(null);
  playerBasePrice = signal<number>(100000);

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private auctionMgt = inject(AuctionManagementService);
  private sessionSvc = inject(AuctionSessionService);
  private teamsSvc = inject(TeamsService);
  private playersSvc = inject(PlayerService);
  private snackBar = inject(MatSnackBar);

  ngOnInit() {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.sessionId.set(+params['id']);
        this.loadAllData();
      }
    });
  }

  loadAllData() {
    this.loading.set(true);
    const id = this.sessionId();
    if (!id) return;

    // Load session details
    this.sessionSvc.getById(id).subscribe({
      next: (res: any) => {
        this.sessionData.set(res.data.sessions);
      }
    });

    // Load registered teams
    this.loadSessionTeams();
    
    // Load player pool
    this.loadSessionPlayers();

    // Pre-load global catalogs for dropdowns
    this.teamsSvc.getAll().subscribe((res: any) => this.allTeams.set(res.data.teams || []));
    this.playersSvc.getAll().subscribe((res: any) => this.allPlayers.set(res.data.players || []));

    this.loading.set(false);
  }

  loadSessionTeams() {
    this.auctionMgt.getSessionTeams(this.sessionId()!).subscribe((res: any) => {
      this.sessionTeams.set(res.data.teams || []);
    });
  }

  loadSessionPlayers() {
    this.auctionMgt.getSessionPlayers(this.sessionId()!).subscribe((res: any) => {
      const players = (res.data.players || []).map((entry: any) => ({
        ...entry,
        PlayerID: entry.PlayerID || entry.PlayerMaster?.PlayerID,
        Name: entry.PlayerMaster?.Name || entry.Name,
        Role: entry.PlayerMaster?.Role || entry.Role,
        PhotoURL: entry.PlayerMaster?.PhotoURL || entry.PhotoURL,
        BattingStyle: entry.PlayerMaster?.BattingStyle || entry.BattingStyle,
        BowlingStyle: entry.PlayerMaster?.BowlingStyle || entry.BowlingStyle
      }));
      this.sessionPlayers.set(players);
    });
  }

  addTeam() {
    const tId = this.selectedTeamId();
    if (!tId) return;
    this.auctionMgt.registerTeam(this.sessionId()!, tId).subscribe({
      next: () => {
        this.snackBar.open('Team added to session', 'Success', { duration: 3000 });
        this.loadSessionTeams();
        this.selectedTeamId.set(null);
      },
      error: (err: any) => this.snackBar.open(err.error?.message || 'Error adding team', 'Error', { duration: 3000 })
    });
  }

  removeTeam(teamId: number) {
    if (!confirm('Are you sure you want to remove this team?')) return;
    this.auctionMgt.removeTeam(this.sessionId()!, teamId).subscribe({
      next: () => {
        this.snackBar.open('Team removed', 'Success', { duration: 3000 });
        this.loadSessionTeams();
      },
      error: (err: any) => this.snackBar.open(err.error?.message || 'Error removing team', 'Error', { duration: 3000 })
    });
  }

  addPlayer() {
    const pId = this.selectedPlayerId();
    if (!pId) return;
    this.auctionMgt.addPlayerToPool(this.sessionId()!, pId, this.playerBasePrice()).subscribe({
      next: () => {
        this.snackBar.open('Player added to pool', 'Success', { duration: 3000 });
        this.loadSessionPlayers();
        this.selectedPlayerId.set(null);
      },
      error: (err: any) => this.snackBar.open(err.error?.message || 'Error adding player', 'Error', { duration: 3000 })
    });
  }

  removePlayer(playerId: number) {
    if (!confirm('Are you sure you want to remove this player?')) return;
    this.auctionMgt.removePlayerFromPool(this.sessionId()!, playerId).subscribe({
      next: () => {
        this.snackBar.open('Player removed', 'Success', { duration: 3000 });
        this.loadSessionPlayers();
      },
      error: (err: any) => this.snackBar.open(err.error?.message || 'Error removing player', 'Error', { duration: 3000 })
    });
  }

  startAuction() {
    this.auctionMgt.startAuction(this.sessionId()!).subscribe({
      next: () => {
        this.snackBar.open('Auction Started!', 'Success', { duration: 3000 });
        this.router.navigate(['/kkk/auction-room'], { queryParams: { id: this.sessionId() } });
      },
      error: (err: any) => {
        if (err.error?.message === 'Auction is already live') {
          this.router.navigate(['/kkk/auction-room'], { queryParams: { id: this.sessionId() } });
        } else {
          this.snackBar.open(err.error?.message || 'Error starting auction', 'Error', { duration: 3000 });
        }
      }
    });
  }

  get availableTeamsToAdd() {
    const existingIds = this.sessionTeams().map(t => t.teamId);
    return this.allTeams().filter(t => !existingIds.includes(t.TeamID));
  }

  get availablePlayersToAdd() {
    const existingIds = this.sessionPlayers().map(p => p.PlayerID);
    return this.allPlayers().filter(p => !existingIds.includes(p.PlayerID));
  }
}
