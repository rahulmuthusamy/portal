import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatchService } from '../services/match.service';
import { TeamsService } from '../../teams/services/teams.service';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatRadioModule } from '@angular/material/radio';
import { FormsModule } from '@angular/forms';
import { environment } from '@environments/environment';

@Component({
    selector: 'app-match-squad',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        MatCardModule,
        MatButtonModule,
        MatIconModule,
        MatCheckboxModule,
        MatSnackBarModule,
        MatRadioModule
    ],
    templateUrl: './match-squad.component.html',
    styleUrl: './match-squad.component.scss'
})
export class MatchSquadComponent implements OnInit {
    matchId!: number;
    teamId!: number;
    teamName: string = '';
    players: any[] = [];
    selectedPlayerIds: Set<number> = new Set();
    captainId: number | null = null;
    wicketKeeperId: number | null = null;
    loading = false;
    apiUrl = environment.apiUrl;

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private matchService: MatchService,
        private teamsService: TeamsService,
        private snackBar: MatSnackBar
    ) { }

    ngOnInit(): void {
        this.route.params.subscribe(params => {
            this.matchId = +params['matchId'];
            this.teamId = +params['teamId'];
            this.loadTeamPlayers();
        });
    }

    loadTeamPlayers(): void {
        this.loading = true;
        this.teamsService.getTeamPlayers(this.teamId).subscribe({
            next: (response: any) => {
                this.players = response.data.players;
                this.teamName = response.data.teamName;
                this.loading = false;
                this.loadExistingSquad();
            },
            error: (err: any) => {
                this.snackBar.open('Error loading team players', 'Close', { duration: 3000 });
                this.loading = false;
            }
        });
    }

    loadExistingSquad(): void {
        this.matchService.getMatchSquad(this.matchId).subscribe({
            next: (response: any) => {
                const squad = response.data.teamA.concat(response.data.teamB);
                const teamSquad = squad.filter((p: any) => p.TeamID === this.teamId);

                if (teamSquad.length > 0) {
                    teamSquad.forEach((p: any) => {
                        this.selectedPlayerIds.add(p.PlayerID);
                        if (p.IsCaptain) this.captainId = p.PlayerID;
                        if (p.IsWicketKeeper) this.wicketKeeperId = p.PlayerID;
                    });
                }
            }
        });
    }

    togglePlayer(playerId: number): void {
        if (this.selectedPlayerIds.has(playerId)) {
            this.selectedPlayerIds.delete(playerId);
            if (this.captainId === playerId) this.captainId = null;
            if (this.wicketKeeperId === playerId) this.wicketKeeperId = null;
        } else {
            if (this.selectedPlayerIds.size >= 30) {
                this.snackBar.open('Maximum 30 players allowed', 'Warning', { duration: 3000 });
                return;
            }
            this.selectedPlayerIds.add(playerId);
        }
    }

    saveSquad(): void {
        if (this.selectedPlayerIds.size < 2) {
            this.snackBar.open('Please select at least 2 players', 'Warning', { duration: 3000 });
            return;
        }
        if (!this.captainId) {
            this.snackBar.open('Please select a Captain', 'Warning', { duration: 3000 });
            return;
        }
        if (!this.wicketKeeperId) {
            this.snackBar.open('Please select a Wicket Keeper', 'Warning', { duration: 3000 });
            return;
        }

        const squadData = Array.from(this.selectedPlayerIds).map(pid => ({
            playerId: pid,
            isCaptain: this.captainId === pid,
            isWicketKeeper: this.wicketKeeperId === pid
        }));

        this.matchService.saveMatchSquad(this.matchId, this.teamId, squadData).subscribe({
            next: (response: any) => {
                this.snackBar.open('Squad saved successfully', 'Success', { duration: 3000 });
                this.goBack();
            },
            error: (err: any) => {
                this.snackBar.open(err.error?.message || 'Error saving squad', 'Close', { duration: 3000 });
            }
        });
    }

    goBack(): void {
        this.router.navigate(['/kkk/match-list']);
    }

    getPlayerImageUrl(photo: string | null): string {
        return photo ? `${this.apiUrl}${photo}` : 'assets/images/default-player.png';
    }
}
