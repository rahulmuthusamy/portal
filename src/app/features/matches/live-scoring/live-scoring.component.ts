import { Component, OnInit, signal, inject, OnDestroy, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatchService } from '../services/match.service';
import { SocketService } from '@core/services/socket.service';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { environment } from '@environments/environment';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
    selector: 'app-live-scoring',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        RouterModule,
        MatSnackBarModule,
        MatCardModule,
        MatButtonModule,
        MatIconModule,
        MatDividerModule
    ],
    templateUrl: './live-scoring.component.html',
    styleUrl: './live-scoring.component.scss'
})
export class LiveScoringComponent implements OnInit, OnDestroy {
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private matchService = inject(MatchService);
    private snackBar = inject(MatSnackBar);
    private socketService = inject(SocketService);
    private sanitizer = inject(DomSanitizer);

    matchId = signal<number | null>(null);
    match = signal<any>(null);
    currentInnings = signal<any>(null);
    loading = signal(true);

    // YouTube Integration
    youtubeUrl = computed<SafeResourceUrl | null>(() => {
        const url = this.match()?.StreamURL;
        if (!url) return null;

        let videoId = '';
        if (url.includes('youtu.be/')) videoId = url.split('youtu.be/')[1].split('?')[0];
        else if (url.includes('v=')) videoId = url.split('v=')[1].split('&')[0];
        else if (url.includes('embed/')) videoId = url.split('embed/')[1].split('?')[0];

        if (videoId) {
            return this.sanitizer.bypassSecurityTrustResourceUrl(`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1`);
        }
        return null;
    });
    isRecording = signal(false);

    // Players selection
    striker = signal<any>(null);
    nonStriker = signal<any>(null);
    currentBowler = signal<any>(null);

    battingTeamPlayers = signal<any[]>([]);
    bowlingTeamPlayers = signal<any[]>([]);
    fow = signal<any[]>([]);

    // UI State
    selectedExtra = signal<string | null>(null);
    showWicketModal = signal(false);
    showSquadModal = signal(false);
    showSelectionModal = false;
    selectionType: 'striker' | 'nonStriker' | 'bowler' | 'fielder' = 'striker';
    // Overlay state for major events (4, 6, Wicket)
    showOverlay = signal(false);
    overlayType = signal<'FOUR' | 'SIX' | 'WICKET' | null>(null);
    overlayBall = signal<any>(null);

    wicketData = signal<any>({
        type: 'Caught',
        dismissedPlayerId: null,
        fielderId: null,
        fielderName: null
    });

    currentSquadPool = signal<any[]>([]);
    selectedPlayerIds = signal<number[]>([]);

    // Computed lists for display (ensures active players show even with 0 balls)
    battingDisplay = computed(() => {
        const stats = this.currentInnings()?.batting || [];
        const s = this.striker();
        const ns = this.nonStriker();

        const list = [...stats];

        if (s && !list.some(p => p.PlayerID === s.PlayerID)) {
            list.push({ ...s, RunsScored: 0, BallsFaced: 0, Fours: 0, Sixes: 0, StrikeRate: '0.00' });
        }
        if (ns && !list.some(p => p.PlayerID === ns.PlayerID)) {
            list.push({ ...ns, RunsScored: 0, BallsFaced: 0, Fours: 0, Sixes: 0, StrikeRate: '0.00' });
        }

        return list;
    });

    bowlingDisplay = computed(() => {
        const stats = this.currentInnings()?.bowling || [];
        const b = this.currentBowler();

        const list = [...stats];
        if (b && !list.some(p => p.PlayerID === b.PlayerID)) {
            list.push({ ...b, OversBowled: '0.0', Maidens: 0, RunsConceded: 0, WicketsTaken: 0, Economy: '0.00' });
        }
        return list;
    });
    apiUrl = environment.apiUrl;

    ngOnInit(): void {
        this.route.params.subscribe(params => {
            const id = +params['id'];
            this.matchId.set(id);
            this.loadMatchData();
            this.setupSocket(id);
        });
    }

    ngOnDestroy(): void {
        this.socketService.disconnect('/live-scoring');
    }

    setupSocket(id: number): void {
        this.socketService.connect('/live-scoring');

        this.socketService.emit('/live-scoring', 'join-match', id);

        this.socketService.on('/live-scoring', 'ball-scored').subscribe((data: any) => {
            console.log('socket received ball-scored', data);
            this.loadMatchData();

            const runs = data.ball?.RunsScored || 0;
            const extraType = data.ball?.ExtraType;

            // Trigger Overlays
            if (data.ball?.IsWicket) {
                this.triggerOverlay('WICKET', data.ball);
            } else if (!extraType) {
                if (runs === 6) this.triggerOverlay('SIX', data.ball);
                else if (runs === 4) this.triggerOverlay('FOUR', data.ball);
            }

            const extra = data.ball?.ExtraRuns || 0;
            const total = runs + extra;
            if (total > 0 && runs !== 4 && runs !== 6 && !data.ball?.IsWicket) {
                this.snackBar.open(`Scored: ${total} runs`, 'OK', { duration: 2000 });
            }
        });

        this.socketService.on('/live-scoring', 'wicket').subscribe((data: any) => {
            console.log('socket received wicket', data);
            this.striker.set(null);
            this.triggerOverlay('WICKET', data.ball);
        });

        this.socketService.on('/live-scoring', 'ball-error').subscribe((data: any) => {
            console.error('socket ball info error', data); // Debug log
            this.snackBar.open(`Error: ${data.message}`, 'Close', { duration: 5000, panelClass: ['error-snack'] });
        });

        // Confirmation for the scorer - this event is emitted by the server to the sender socket
        this.socketService.on('/live-scoring', 'ball-recorded').subscribe((data: any) => {
            console.log('socket received ball-recorded', data); // Debug log
            this.loadMatchData(); // Refresh data
        });
    }

    loadMatchData(): void {
        const id = this.matchId();
        if (!id) return;

        this.loading.set(true);
        // 1. First get match data and scorecard
        this.matchService.generateScorecard(id).subscribe({
            next: (res: any) => {
                const data = res.data;
                this.match.set(data.match);
                const activeInnings = data.scorecards.find((inn: any) => inn.Status === 'InProgress') ||
                    data.scorecards[0];
                this.currentInnings.set(activeInnings);

                // 2. Then get squads (needed for player selection and initial sync)
                this.matchService.getMatchSquad(id).subscribe({
                    next: (squadRes: any) => {
                        this.processSquadData(squadRes.data);

                        // 3. Finally sync player state and check completion
                        this.syncPlayerState(activeInnings);
                        this.checkOverCompletion(data.match, activeInnings);

                        if (data.match.Status === 'Live') {
                            setTimeout(() => this.checkOpeningPlayers(), 100);
                        }
                        this.loading.set(false);
                    },
                    error: () => {
                        this.snackBar.open('Failed to load squads', 'Error');
                        this.loading.set(false);
                    }
                });
            },
            error: (err: any) => {
                this.snackBar.open('Failed to load match data', 'Error', { duration: 3000 });
                this.loading.set(false);
            }
        });
    }

    syncPlayerState(innings: any): void {
        if (!innings) return;

        const { currentStrikerID, currentNonStrikerID, currentBowlerID } = innings;

        // 1. Set Striker - Check stats first, then full squad
        if (currentStrikerID) {
            const striker = (innings.batting || []).find((p: any) => p.PlayerID === currentStrikerID) ||
                this.battingTeamPlayers().find(p => p.PlayerID === currentStrikerID);
            if (striker) this.striker.set(striker);
        }

        // 2. Set Non-Striker
        if (currentNonStrikerID) {
            const nonStriker = (innings.batting || []).find((p: any) => p.PlayerID === currentNonStrikerID) ||
                this.battingTeamPlayers().find(p => p.PlayerID === currentNonStrikerID);
            if (nonStriker) this.nonStriker.set(nonStriker);
        }

        // 3. Set Bowler - Check stats first, then full squad
        if (currentBowlerID) {
            const bowler = (innings.bowling || []).find((p: any) => p.PlayerID === currentBowlerID) ||
                this.bowlingTeamPlayers().find(p => p.PlayerID === currentBowlerID);
            if (bowler) this.currentBowler.set(bowler);
        }

        // Handle explicit clearing (Wicket or Over End)
        // Only clear if the backend explicitly says null AND some balls exist in this match/innings.
        // This prevents clearing the manual selection at the very start of game (0 balls).
        const hasStarted = (innings.TotalBalls || 0) > 0;
        if (hasStarted) {
            if (!currentStrikerID) this.striker.set(null);
            if (!currentNonStrikerID) this.nonStriker.set(null);
            if (!currentBowlerID) this.currentBowler.set(null);
        }
    }

    processSquadData(squads: any): void {
        const inn = this.currentInnings();
        if (!inn) return;

        const battingTeamId = inn.battingTeam?.TeamID || inn.BattingTeamID;
        const bowlingTeamId = inn.bowlingTeam?.TeamID || inn.BowlingTeamID;

        const allSquadPlayers = [...(squads.teamA || []), ...(squads.teamB || [])];

        const battingSquad = allSquadPlayers
            .filter((sq: any) => sq.TeamID === battingTeamId)
            .map((sq: any) => ({
                PlayerID: sq.PlayerMaster?.PlayerID,
                Name: sq.PlayerMaster?.Name,
                Role: sq.PlayerMaster?.Role,
                ...sq.PlayerMaster
            }));

        const bowlingSquad = allSquadPlayers
            .filter((sq: any) => sq.TeamID === bowlingTeamId)
            .map((sq: any) => ({
                PlayerID: sq.PlayerMaster?.PlayerID,
                Name: sq.PlayerMaster?.Name,
                Role: sq.PlayerMaster?.Role,
                ...sq.PlayerMaster
            }));

        this.battingTeamPlayers.set(battingSquad);
        this.bowlingTeamPlayers.set(bowlingSquad);
    }

    checkOverCompletion(match: any, innings: any): void {
        if (!innings) return;
        const isOverComplete = innings.TotalBalls > 0 && innings.TotalBalls % 6 === 0;

        if (isOverComplete && !this.currentBowler()) {
            // The backend has already cleared the bowler and rotated strike.
            // We just wait for the user to pick a new bowler via the UI button.
        }
    }

    checkStrikeRotation(runs: number): void {
        // odd runs = rotate
        if (runs % 2 !== 0) {
            this.rotateStriker();
            this.snackBar.open(`Strike Rotated (Runs: ${runs})`, 'Info', { duration: 1500 });
        }
    }

    recordBall(runs: number, extraTypeFromBtn?: string): void {
        const id = this.matchId();
        const s = this.striker();
        const b = this.currentBowler();
        const innId = this.currentInnings()?.InningsID;

        if (!id || !s || !b) {
            this.snackBar.open('Select Striker and Bowler first', 'OK');
            return;
        }

        if (!innId) {
            this.snackBar.open('Error: Innings ID missing. Please refresh the page.', 'Close', { duration: 5000 });
            return;
        }

        const extraType = extraTypeFromBtn || this.selectedExtra();
        const isExtra = !!extraType;

        const ns = this.nonStriker();

        const payload: any = {
            matchId: id,
            inningsId: innId,
            batsmanId: s.PlayerID,
            batsmanEndId: ns ? ns.PlayerID : null,
            bowlerId: b.PlayerID,
            runsScored: isExtra ? 0 : runs,
            isBoundary: !isExtra && runs >= 4,
            boundaryType: !isExtra ? (runs === 4 ? 'Four' : (runs === 6 ? 'Six' : null)) : null,
            isWicket: false,
            isExtra: isExtra,
            extraType: extraType,
            extraRuns: isExtra ? runs : 0
        };

        if (extraType === 'Wide' || extraType === 'NoBall') {
            payload.extraRuns = runs + 1;
            if (extraType === 'NoBall') {
                payload.runsScored = runs;
            }
        } else if (extraType === 'LegBye' || extraType === 'Bye') {
            payload.extraRuns = runs;
            payload.runsScored = 0;
        }

        this.socketService.emit('/live-scoring', 'record-ball', payload);

        if (isExtra) {
            this.selectedExtra.set(null);
        } else {
            // Check rotation immediately for UI feedback, but state will refresh on socket event
            this.checkStrikeRotation(runs);
        }
    }

    openSelection(type: 'striker' | 'nonStriker' | 'bowler' | 'fielder'): void {
        this.selectionType = type;
        this.showSelectionModal = true;
    }

    setPlayer(type: string, player: any): void {
        if (type === 'striker') this.striker.set(player);
        if (type === 'nonStriker') this.nonStriker.set(player);
        if (type === 'bowler') this.currentBowler.set(player);
        if (type === 'fielder') {
            this.wicketData.update(prev => ({ ...prev, fielderId: player.PlayerID, fielderName: player.Name }));
        }
        this.showSelectionModal = false;
    }

    openWicketModal(): void {
        // Default to striker being out
        this.wicketData.update(prev => ({
            ...prev,
            dismissedPlayerId: this.striker()?.PlayerID,
            fielderId: null,
            fielderName: null
        }));
        this.showWicketModal.set(true);
    }

    updateWicketData(key: string, value: any): void {
        this.wicketData.update(prev => ({ ...prev, [key]: value }));
    }

    confirmWicket(): void {
        const data = this.wicketData();
        this.recordWicket(data.type);
        this.showWicketModal.set(false);
    }

    recordWicket(type: string): void {
        const id = this.matchId();
        const s = this.striker();
        const b = this.currentBowler();
        const innId = this.currentInnings()?.InningsID;

        if (!id || !s || !b) return;

        if (!innId) {
            this.snackBar.open('Error: Innings ID missing. Please refresh the page.', 'Close', { duration: 5000 });
            return;
        }

        const ns = this.nonStriker();

        const payload = {
            matchId: id,
            inningsId: innId,
            batsmanId: s.PlayerID,
            batsmanEndId: ns ? ns.PlayerID : null,
            bowlerId: b.PlayerID,
            isWicket: true,
            wicketType: type,
            dismissedPlayerId: this.wicketData().dismissedPlayerId || s.PlayerID,
            fielderId: this.wicketData().fielderId
        };

        this.socketService.emit('/live-scoring', 'record-ball', payload);
        this.snackBar.open('WICKET RECORDED!', 'OK', { duration: 3000 });

        // Optimistic update locally
        if (payload.dismissedPlayerId === s.PlayerID) {
            this.striker.set(null);
        } else if (ns && payload.dismissedPlayerId === ns.PlayerID) {
            this.nonStriker.set(null);
        }

        // Reset wicket data for next time
        this.wicketData.set({
            type: 'Caught',
            dismissedPlayerId: null,
            fielderId: null,
            fielderName: null
        });
    }

    rotateStriker(): void {
        const s = this.striker();
        const ns = this.nonStriker();
        this.striker.set(ns);
        this.nonStriker.set(s);
    }

    undoLastBall(): void {
        const id = this.matchId();
        if (!id) return;

        if (confirm('Are you sure you want to undo the last ball?')) {
            this.matchService.undoLastBall(id).subscribe({
                next: (res: any) => {
                    this.snackBar.open('Last ball undone', 'OK', { duration: 2000 });
                    this.loadMatchData();
                },
                error: (err) => {
                    this.snackBar.open('Undo failed', 'Error', { duration: 3000 });
                }
            });
        }
    }

    openSquadSelection(type: 'batting' | 'bowling'): void {
        const m = this.match();
        if (!m) return;

        const teamId = type === 'batting' ? this.currentInnings()?.BattingTeamID : this.currentInnings()?.BowlingTeamID;
        if (!teamId) return;

        // Fetch squad for the match (returns both teams)
        this.matchService.getMatchSquad(m.MatchID).subscribe((res: any) => {
            if (res.success) {
                // res.data has { teamA: [], teamB: [] }
                const pool = (res.data.teamA && res.data.teamA[0]?.TeamID === teamId) ? res.data.teamA : res.data.teamB;

                this.currentSquadPool.set(pool.map((s: any) => ({
                    PlayerID: s.PlayerID,
                    Name: s.PlayerMaster?.Name || 'Unknown',
                    Role: s.PlayerMaster?.Role || 'Player',
                    TeamID: s.TeamID
                })));

                // Map current active XI (already in memory from loadMatchData)
                const currentXI = type === 'batting' ? this.battingTeamPlayers() : this.bowlingTeamPlayers();
                this.selectedPlayerIds.set(currentXI.map(p => p.PlayerID));
                this.showSquadModal.set(true);
            }
        });
    }

    toggleSquadPlayer(playerId: number): void {
        const current = this.selectedPlayerIds();
        if (current.includes(playerId)) {
            this.selectedPlayerIds.set(current.filter(id => id !== playerId));
        } else {
            this.selectedPlayerIds.set([...current, playerId]);
        }
    }

    saveSquad(): void {
        const matchId = this.matchId();
        const m = this.match();
        if (!matchId || !m) return;

        const pool = this.currentSquadPool();
        if (pool.length === 0) return;

        const teamId = pool[0].TeamID;

        // Backend expects array of { playerId, isCaptain, isWicketKeeper }
        const players = this.selectedPlayerIds().map(id => ({
            playerId: id,
            isCaptain: false,
            isWicketKeeper: false
        }));

        this.matchService.saveMatchSquad(matchId, teamId, players).subscribe({
            next: () => {
                this.snackBar.open('Squad updated successfully', 'OK', { duration: 2000 });
                this.showSquadModal.set(false);
                this.loadMatchData();
            },
            error: () => {
                this.snackBar.open('Failed to update squad', 'Error');
            }
        });
    }

    getFilteredPlayers(): any[] {
        const type = this.selectionType;
        const currentInn = this.currentInnings();
        const striker = this.striker();
        const nonStriker = this.nonStriker();
        const bowler = this.currentBowler();

        if (['striker', 'nonStriker'].includes(type)) {
            const squad = this.battingTeamPlayers();
            // Get IDs of players who are already out
            const outPlayerIds = currentInn?.batting
                ?.filter((p: any) => p.Dismissal)
                .map((p: any) => p.PlayerID) || [];

            return squad.filter(p => {
                // Remove out players
                if (outPlayerIds.includes(p.PlayerID)) return false;

                // Remove the other active batsman
                if (type === 'striker' && nonStriker && p.PlayerID === nonStriker.PlayerID) return false;
                if (type === 'nonStriker' && striker && p.PlayerID === striker.PlayerID) return false;

                return true;
            });
        }

        if (type === 'bowler') {
            const squad = this.bowlingTeamPlayers();
            const lastBowlerId = currentInn?.lastBowlerID;
            // A bowler cannot bowl two overs in a row.

            // Limit check: 
            const maxOvers = this.match()?.OversPerSide ? Math.ceil(this.match().OversPerSide / 5) : 4;

            return squad.filter(p => {
                // Find stats for this bowler
                const stats = currentInn?.bowling?.find((b: any) => b.PlayerID === p.PlayerID);
                if (stats) {
                    const oversBowled = parseFloat(stats.OversBowled || '0');
                    if (oversBowled >= maxOvers) return false;
                }

                // Exclude current active bowler
                if (bowler && p.PlayerID === bowler.PlayerID) return false;

                // Exclude the bowler who bowled the last ball of the previous over
                if (lastBowlerId && p.PlayerID === lastBowlerId) return false;

                return true;
            });
        }

        return this.selectionType === 'fielder' ? this.bowlingTeamPlayers() : [];
    }

    getFilteredOpeningBatsmen(type: 'striker' | 'nonStriker'): any[] {
        const strikerId = this.selectedStrikerId();
        const nonStrikerId = this.selectedNonStrikerId();
        const pool = this.battingTeamPlayers();

        return pool.filter(p => {
            if (type === 'striker' && nonStrikerId === p.PlayerID) return false;
            if (type === 'nonStriker' && strikerId === p.PlayerID) return false;
            return true;
        });
    }

    // Workflow State
    showTossModal = signal(false);
    showOpeningPlayersModal = signal(false);
    tossWinnerId = signal<number | null>(null);
    tossDecision = signal<'Bat' | 'Bowl'>('Bat');

    recordToss(): void {
        this.showTossModal.set(true);
        // Default to Team A
        if (!this.tossWinnerId() && this.match()) {
            this.tossWinnerId.set(Number(this.match().TeamA_ID));
        }
    }

    confirmToss(): void {
        const id = this.matchId();
        const winner = this.tossWinnerId();
        const decision = this.tossDecision();

        if (!id || !winner || !decision) return;

        // Ensure we send numeric ID
        this.matchService.startMatch(id, +winner, decision).subscribe({
            next: () => {
                this.showTossModal.set(false);
                this.loadMatchData(); // Will trigger opening players check
            },
            error: (err) => {
                console.error('Start match error', err);
                this.snackBar.open('Failed to start match', 'Close');
            }
        });
    }

    checkOpeningPlayers(): void {
        const m = this.match();
        const inn = this.currentInnings();

        // ONLY trigger the full Match Setup modal at the start of an innings (0 balls)
        const isStartOfInnings = !inn || (inn.TotalBalls || 0) === 0;

        if (m && m.Status === 'Live' && isStartOfInnings) {
            const hasStriker = !!this.striker();
            const hasNonStriker = !!this.nonStriker();
            const hasBowler = !!this.currentBowler();

            if (!hasStriker || !hasNonStriker || !hasBowler) {
                this.showOpeningPlayersModal.set(true);
            }
        }
    }

    // Opening Players Selection State
    selectedStrikerId = signal<number | null>(null);
    selectedNonStrikerId = signal<number | null>(null);
    selectedBowlerId = signal<number | null>(null);

    saveOpeningPlayers(): void {
        const sId = this.selectedStrikerId();
        const nsId = this.selectedNonStrikerId();
        const bId = this.selectedBowlerId();

        const striker = this.battingTeamPlayers().find(p => p.PlayerID === sId);
        const nonStriker = this.battingTeamPlayers().find(p => p.PlayerID === nsId);
        const bowler = this.bowlingTeamPlayers().find(p => p.PlayerID === bId);

        if (striker) this.striker.set(striker);
        if (nonStriker) this.nonStriker.set(nonStriker);
        if (bowler) this.currentBowler.set(bowler);

        this.showOpeningPlayersModal.set(false);
    }

    openSettings(): void {
        this.snackBar.open('Settings not implemented yet', 'OK');
    }

    completeMatch(): void {
        const id = this.matchId();
        if (!id) return;

        if (confirm('Are you sure you want to complete this match?')) {
            this.matchService.completeMatch(id, this.match().TeamA_ID, 'Match completed by official').subscribe({
                next: () => {
                    this.snackBar.open('Match completed successfully', 'Success');
                    this.router.navigate(['/kkk/match-list']);
                }
            });
        }
    }
    triggerOverlay(type: 'FOUR' | 'SIX' | 'WICKET', ball: any): void {
        this.overlayType.set(type);

        // Try to resolve player name logically if not present
        if (ball && !ball.BatsmanName) {
            if (type === 'WICKET') {
                // If we have a dismissed player name in the ball (enriched by backend)
                if (ball.DismissedPlayerName) {
                    ball.BatsmanName = ball.DismissedPlayerName;
                } else {
                    // Fallback to current striker if we didn't get specific info
                    ball.BatsmanName = this.striker()?.Name || 'Batsman';
                }
            } else {
                ball.BatsmanName = this.striker()?.Name;
            }
        }

        this.overlayBall.set(ball);
        this.showOverlay.set(true);

        // Auto-close after 4 seconds
        setTimeout(() => {
            this.showOverlay.set(false);
            this.overlayType.set(null);
        }, 4000);
    }
}

