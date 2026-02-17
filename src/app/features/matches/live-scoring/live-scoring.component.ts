import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatchService } from '../services/match.service';
import { ToastService } from '@shared/services/toast.service';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-live-scoring',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule],
    templateUrl: './live-scoring.component.html',
    styleUrl: './live-scoring.component.scss'
})
export class LiveScoringComponent implements OnInit {
    matchId = signal<number | null>(null);
    match = signal<any>(null);
    innings = signal<any[]>([]);
    currentInnings = signal<any>(null);

    loading = signal(true);
    isRecording = signal(false);

    // Scoring State
    striker = signal<any>(null);
    nonStriker = signal<any>(null);
    currentBowler = signal<any>(null);

    showSelectionModal = false;
    showWicketModal = signal(false);
    selectionType: 'striker' | 'nonStriker' | 'bowler' | 'fielder' = 'striker';

    wicketData = signal<any>({
        type: 'Caught',
        dismissedPlayerId: null,
        fielderId: null
    });

    // Restored signals
    battingTeamPlayers = signal<any[]>([]);
    bowlingTeamPlayers = signal<any[]>([]);
    fow = signal<any[]>([]);
    celebration = signal<string | null>(null);
    selectedExtra = signal<string | null>(null);

    // Squad Management
    showSquadModal = signal(false);
    squadTeamId = signal<number | null>(null);
    currentSquadPool = signal<any[]>([]);
    selectedPlayerIds = signal<number[]>([]);
    tempSquadType: 'batting' | 'bowling' = 'batting';

    private route = inject(ActivatedRoute);
    private matchService = inject(MatchService);
    private toast = inject(ToastService);
    private router = inject(Router);

    ngOnInit(): void {
        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
            this.matchId.set(Number(id));
            this.loadMatchData();
        }
    }

    loadMatchData(): void {
        const id = this.matchId();
        if (!id) return;

        this.loading.set(true);
        this.matchService.getLiveScoreDetailed(id).subscribe({
            next: (res: any) => {
                this.match.set(res.data?.match || res.match);
                this.innings.set(res.data?.innings || res.innings || []);

                // Find current active innings
                const active = this.innings().find(i => i.Status === 'InProgress') || this.innings()[this.innings().length - 1];
                this.currentInnings.set(active);
                this.fow.set(res.data?.fow || res.fow || []);

                // Load players for selection
                this.loadPlayers();

                this.loading.set(false);
                this.loadSelections();
            },
            error: (err) => {
                this.toast.error('Failed to load match data');
                this.loading.set(false);
            }
        });
    }

    loadPlayers(): void {
        const id = this.matchId();
        if (!id) return;

        this.matchService.getMatchSquads(id).subscribe({
            next: (res: any) => {
                const squads = res.data || res;
                const isInnings1 = this.currentInnings()?.InningsNumber === 1 || !this.currentInnings();

                const batTeam = isInnings1 ? squads.teamA : squads.teamB;
                const bowlTeam = isInnings1 ? squads.teamB : squads.teamA;

                // Set current squad or full pool if squad not defined
                this.battingTeamPlayers.set(batTeam.isSquadDefined ? batTeam.squad : batTeam.pool);
                this.bowlingTeamPlayers.set(bowlTeam.isSquadDefined ? bowlTeam.squad : bowlTeam.pool);

                if (!batTeam.isSquadDefined || !bowlTeam.isSquadDefined) {
                    this.toast.info('Please select Playing XI for both teams to ensure accurate scoring.');
                }
            }
        });
    }

    openSquadSelection(type: 'batting' | 'bowling'): void {
        const id = this.matchId();
        if (!id) return;
        this.tempSquadType = type;

        this.matchService.getMatchSquads(id).subscribe({
            next: (res: any) => {
                const squads = res.data || res;
                const isInnings1 = this.currentInnings()?.InningsNumber === 1 || !this.currentInnings();

                let targetTeam;
                if (type === 'batting') targetTeam = isInnings1 ? squads.teamA : squads.teamB;
                else targetTeam = isInnings1 ? squads.teamB : squads.teamA;

                this.squadTeamId.set(targetTeam.id);
                this.currentSquadPool.set(targetTeam.pool);
                this.selectedPlayerIds.set(targetTeam.squad.map((p: any) => p.PlayerID));
                this.showSquadModal.set(true);
            }
        });
    }

    toggleSquadPlayer(playerId: number): void {
        const current = this.selectedPlayerIds();
        if (current.includes(playerId)) {
            this.selectedPlayerIds.set(current.filter(id => id !== playerId));
        } else {
            if (current.length >= 11) {
                this.toast.info('Maximum 11 players allowed');
                return;
            }
            this.selectedPlayerIds.set([...current, playerId]);
        }
    }

    saveSquad(): void {
        const matchId = this.matchId();
        const teamId = this.squadTeamId();
        const playerIds = this.selectedPlayerIds();

        if (!matchId || !teamId || playerIds.length === 0) return;

        this.matchService.saveMatchSquad(matchId, teamId, playerIds).subscribe({
            next: () => {
                this.toast.success('Playing XI saved');
                this.showSquadModal.set(false);
                this.loadPlayers();
            }
        });
    }

    saveSelections(): void {
        const id = this.matchId();
        if (!id) return;
        const data = {
            striker: this.striker(),
            nonStriker: this.nonStriker(),
            bowler: this.currentBowler()
        };
        localStorage.setItem(`match_live_${id}`, JSON.stringify(data));
    }

    loadSelections(): void {
        const id = this.matchId();
        if (!id) return;
        const saved = localStorage.getItem(`match_live_${id}`);
        if (saved) {
            const data = JSON.parse(saved);
            if (data.striker) this.striker.set(data.striker);
            if (data.nonStriker) this.nonStriker.set(data.nonStriker);
            if (data.bowler) this.currentBowler.set(data.bowler);
        }
    }

    openSelection(type: 'striker' | 'nonStriker' | 'bowler' | 'fielder'): void {
        this.selectionType = type;
        this.showSelectionModal = true;
    }

    setPlayer(type: 'striker' | 'nonStriker' | 'bowler' | 'fielder', player: any): void {
        if (type === 'striker') this.striker.set(player);
        if (type === 'nonStriker') this.nonStriker.set(player);
        if (type === 'bowler') this.currentBowler.set(player);
        if (type === 'fielder') {
            this.wicketData.update(prev => ({ ...prev, fielderId: player.PlayerID, fielderName: player.Name }));
        }

        this.saveSelections();
        this.showSelectionModal = false;
    }

    openWicketModal(): void {
        const s = this.striker();
        this.wicketData.set({
            type: 'Caught',
            dismissedPlayerId: s?.PlayerID,
            dismissedPlayerName: s?.Name,
            fielderId: null,
            fielderName: null
        });
        this.showWicketModal.set(true);
    }

    updateWicketData(key: string, value: any): void {
        this.wicketData.update(prev => ({ ...prev, [key]: value }));
    }

    confirmWicket(): void {
        const data = this.wicketData();
        this.recordBall(0, '', true, data.type, data.dismissedPlayerId, data.fielderId);
        this.showWicketModal.set(false);
    }

    rotateStriker(): void {
        const s = this.striker();
        const ns = this.nonStriker();
        this.striker.set(ns);
        this.nonStriker.set(s);
        this.saveSelections();
    }

    recordBall(runs: number, extraType: string = '', isWicket: boolean = false, wicketType?: string, dismissedId?: number, fielderId?: number): void {
        const id = this.matchId();
        const striker = this.striker();
        const nonStriker = this.nonStriker();
        const bowler = this.currentBowler();
        const innings = this.currentInnings();

        if (this.isRecording() || !id || !innings || !striker || !bowler) {
            if (!striker || !bowler) this.toast.info('Please select striker and bowler first');
            return;
        }

        // Apply selected extra modifier if exists
        const actualExtraType = extraType || this.selectedExtra();
        const isExtra = !!actualExtraType;

        const payload = {
            matchId: id,
            inningsId: innings.InningsID,
            overNumber: innings.Overs || 0,
            ballNumber: (innings.Balls || 0) + 1,
            batsmanId: striker.PlayerID,
            batsmanEndId: nonStriker?.PlayerID,
            bowlerId: bowler.PlayerID,
            runsScored: runs,
            isWicket: isWicket,
            wicketType: wicketType || (isWicket ? 'Caught' : null),
            dismissedPlayerId: dismissedId || (isWicket ? striker.PlayerID : null),
            fielderId: fielderId,
            isExtra: isExtra,
            extraType: actualExtraType === 'WD' ? 'Wide' : actualExtraType === 'NB' ? 'NoBall' : actualExtraType,
            extraRuns: actualExtraType === 'WD' || actualExtraType === 'NB' ? 1 : (actualExtraType ? runs : 0)
        };

        // If it was just a manual wide/nb button press with 0 runs, extraRuns should be 1
        if (isExtra && runs === 0 && (actualExtraType === 'WD' || actualExtraType === 'NB')) {
            payload.extraRuns = 1;
        }

        this.isRecording.set(true);
        this.matchService.recordBall(payload).subscribe({
            next: () => {
                this.toast.success('Ball recorded');
                this.selectedExtra.set(null); // Reset extra modifier
                this.celebration.set(null); // Hide any previous celebration before new one

                // Boundary Celebration logic
                if (runs === 4) this.showCelebration('FOUR');
                if (runs === 6) this.showCelebration('SIX');

                // Auto-rotate if odd runs
                if (runs % 2 !== 0 && !isWicket && !extraType.includes('WD')) {
                    this.rotateStriker();
                }

                if (isWicket) {
                    this.striker.set(null);
                    this.openSelection('striker');
                }

                this.loadMatchData();
                this.checkOverCompletion(innings);
                this.saveSelections();
                this.isRecording.set(false);
            },
            error: (err) => {
                console.error(err);
                this.toast.error('Failed to record ball');
                this.isRecording.set(false);
            }
        });
    }

    recordToss(winnerId: number, decision: string): void {
        this.matchService.recordToss(this.matchId()!, { tossWinnerId: winnerId, tossDecision: decision }).subscribe(() => {
            this.toast.success('Toss recorded. Starting match...');
            this.startInnings(1);
        });
    }

    startInnings(num: number): void {
        this.matchService.startInnings(this.matchId()!, { inningsNumber: num }).subscribe(() => {
            this.toast.success(`Innings ${num} started`);
            this.loadMatchData();
        });
    }

    undoLastBall(): void {
        const id = this.matchId();
        if (!id) return;

        this.matchService.undoLastBall(id).subscribe({
            next: () => {
                this.toast.success('Last ball undone');
                this.loadMatchData();
            },
            error: (err) => {
                console.error(err);
                this.toast.error('Failed to undo ball');
            }
        });
    }

    showCelebration(type: string): void {
        this.celebration.set(type);
        setTimeout(() => this.celebration.set(null), 3000);
    }

    checkOverCompletion(innings: any): void {
        const legalBalls = (innings.Balls || 0) + 1;
        if (legalBalls % 6 === 0) {
            this.toast.info('Over Completed! Select new bowler.');
            this.currentBowler.set(null);
            this.openSelection('bowler');
            this.rotateStriker(); // Strike rotates at end of over
        }
    }


    openSettings(): void {
        // Modal to change players, match settings etc.
    }
}
