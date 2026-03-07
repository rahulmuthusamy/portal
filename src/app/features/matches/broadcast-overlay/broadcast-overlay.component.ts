import { Component, OnInit, OnDestroy, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MatchService } from '../services/match.service';
import { SocketService } from '@core/services/socket.service';
import { environment } from '@environments/environment';

@Component({
    selector: 'app-broadcast-overlay',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './broadcast-overlay.component.html',
    styleUrl: './broadcast-overlay.component.scss'
})
export class BroadcastOverlayComponent implements OnInit, OnDestroy {
    private route = inject(ActivatedRoute);
    private matchService = inject(MatchService);
    private socketService = inject(SocketService);

    matchId = signal<number | null>(null);
    match = signal<any>(null);
    currentInnings = signal<any>(null);
    allInnings = signal<any[]>([]);
    loading = signal(true);

    // Current players on crease
    striker = signal<any>(null);
    nonStriker = signal<any>(null);
    currentBowler = signal<any>(null);

    // Recent balls display
    recentBalls = signal<string[]>([]);

    // Overlay animation triggers
    eventType = signal<'FOUR' | 'SIX' | 'WICKET' | null>(null);
    showEvent = signal(false);

    // Graphic Mode: 'compact' (scorebar) or 'full' (innings scorecard)
    graphicMode = signal<'compact' | 'full'>('compact');

    // Partnership info
    partnership = computed(() => {
        const s = this.striker();
        const ns = this.nonStriker();
        if (!s || !ns) return null;
        return {
            runs: (s.RunsScored || 0) + (ns.RunsScored || 0),
            balls: (s.BallsFaced || 0) + (ns.BallsFaced || 0)
        };
    });

    // Current run rate
    runRate = computed(() => {
        const inn = this.currentInnings();
        if (!inn) return '0.00';
        return inn.RunRate || '0.00';
    });

    // Required run rate (2nd innings only)
    requiredRunRate = computed(() => {
        const inn = this.currentInnings();
        const m = this.match();
        if (!inn || !m || inn.InningsNumber !== 2) return null;

        // Find 1st innings target
        const firstInnings = this.allInnings().find((i: any) => i.InningsNumber === 1);
        if (!firstInnings) return null;

        const target = (firstInnings.TotalRuns || 0) + 1;
        const currentScore = inn.TotalRuns || 0;
        const remaining = target - currentScore;
        if (remaining <= 0) return null;

        const totalOvers = m.OversPerSide || 20;
        const bowled = inn.TotalBalls || 0;
        const ballsRemaining = (totalOvers * 6) - bowled;
        if (ballsRemaining <= 0) return null;

        const oversRemaining = ballsRemaining / 6;
        return (remaining / oversRemaining).toFixed(2);
    });

    // Target info for 2nd innings
    target = computed(() => {
        const inn = this.currentInnings();
        if (!inn || inn.InningsNumber !== 2) return null;
        const firstInnings = this.allInnings().find((i: any) => i.InningsNumber === 1);
        if (!firstInnings) return null;
        const targetRuns = (firstInnings.TotalRuns || 0) + 1;
        const currentScore = inn.TotalRuns || 0;
        const remaining = targetRuns - currentScore;
        return { target: targetRuns, remaining: remaining > 0 ? remaining : 0 };
    });

    // Team logos
    teamALogo = computed(() => {
        const m = this.match();
        if (!m?.TeamA?.LogoURL) return null;
        return `${environment.apiUrl.replace('/api', '')}/${m.TeamA.LogoURL}`;
    });

    teamBLogo = computed(() => {
        const m = this.match();
        if (!m?.TeamB?.LogoURL) return null;
        return `${environment.apiUrl.replace('/api', '')}/${m.TeamB.LogoURL}`;
    });

    // Which team is batting
    battingTeamName = computed(() => {
        const inn = this.currentInnings();
        const m = this.match();
        if (!inn || !m) return '';
        if (inn.BattingTeamID === m.TeamA_ID) return m.TeamA?.ShortName || m.TeamA?.Name || 'Team A';
        return m.TeamB?.ShortName || m.TeamB?.Name || 'Team B';
    });

    bowlingTeamName = computed(() => {
        const inn = this.currentInnings();
        const m = this.match();
        if (!inn || !m) return '';
        if (inn.BowlingTeamID === m.TeamA_ID) return m.TeamA?.ShortName || m.TeamA?.Name || 'Team A';
        return m.TeamB?.ShortName || m.TeamB?.Name || 'Team B';
    });

    score = computed(() => {
        const inn = this.currentInnings();
        if (!inn) return '0/0';
        return `${inn.TotalRuns || 0}/${inn.TotalWickets || 0}`;
    });

    overs = computed(() => {
        const inn = this.currentInnings();
        if (!inn) return '0.0';
        return inn.TotalOvers || '0.0';
    });

    maxOvers = computed(() => {
        return this.match()?.OversPerSide || 20;
    });

    private pollTimer: any;

    ngOnInit(): void {
        this.route.params.subscribe(params => {
            const id = +params['id'];
            this.matchId.set(id);
            this.loadData();
            this.setupSocket(id);
            // Fallback polling every 30s in case socket misses
            this.pollTimer = setInterval(() => this.loadData(), 30000);
        });
    }

    ngOnDestroy(): void {
        this.socketService.disconnect('/live-scoring');
        clearInterval(this.pollTimer);
    }

    setupSocket(id: number): void {
        this.socketService.connect('/live-scoring');
        this.socketService.emit('/live-scoring', 'join-match', id);

        this.socketService.on('/live-scoring', 'ball-scored').subscribe((data: any) => {
            this.loadData();

            const runs = data.ball?.RunsScored || 0;
            const extraType = data.ball?.ExtraType;

            if (data.ball?.IsWicket) {
                this.triggerEvent('WICKET');
            } else if (!extraType) {
                if (runs === 6) this.triggerEvent('SIX');
                else if (runs === 4) this.triggerEvent('FOUR');
            }
        });

        this.socketService.on('/live-scoring', 'wicket').subscribe(() => {
            this.triggerEvent('WICKET');
        });

        this.socketService.on('/live-scoring', 'ball-recorded').subscribe(() => {
            this.loadData();
        });

        // Listen for graphic mode changes from Director
        this.socketService.on('/broadcast', 'update-overlay-mode').subscribe((data: any) => {
            console.log('📡 Graphic mode changed:', data.mode);
            this.graphicMode.set(data.mode);
        });
    }

    loadData(): void {
        const id = this.matchId();
        if (!id) return;

        this.matchService.generateScorecard(id).subscribe({
            next: (res: any) => {
                const data = res.data;
                this.match.set(data.match);

                const scorecards = data.scorecards || [];
                this.allInnings.set(scorecards);

                const activeInnings = scorecards.find((inn: any) => inn.Status === 'InProgress') || scorecards[scorecards.length - 1];
                this.currentInnings.set(activeInnings);

                if (activeInnings) {
                    // Set current batsmen from batting stats
                    const batting = activeInnings.batting || activeInnings.battingStats || [];
                    const strikerData = batting.find((p: any) => p.PlayerID === activeInnings.currentStrikerID);
                    const nonStrikerData = batting.find((p: any) => p.PlayerID === activeInnings.currentNonStrikerID);
                    this.striker.set(strikerData || null);
                    this.nonStriker.set(nonStrikerData || null);

                    // Set current bowler from bowling stats
                    const bowling = activeInnings.bowling || activeInnings.bowlingStats || [];
                    const bowlerData = bowling.find((p: any) => p.PlayerID === activeInnings.currentBowlerID);
                    this.currentBowler.set(bowlerData || null);

                    // Set recent balls
                    this.recentBalls.set(activeInnings.recentBalls || []);
                }

                this.loading.set(false);
            },
            error: () => {
                this.loading.set(false);
            }
        });
    }

    triggerEvent(type: 'FOUR' | 'SIX' | 'WICKET'): void {
        this.eventType.set(type);
        this.showEvent.set(true);
        setTimeout(() => {
            this.showEvent.set(false);
            this.eventType.set(null);
        }, 3500);
    }

    getStrikerName(): string {
        const s = this.striker();
        if (!s) return '-';
        // Try different name fields
        return s.Name || s.PlayerName || `${s.FirstName || ''} ${s.LastName || ''}`.trim() || '-';
    }

    getNonStrikerName(): string {
        const ns = this.nonStriker();
        if (!ns) return '-';
        return ns.Name || ns.PlayerName || `${ns.FirstName || ''} ${ns.LastName || ''}`.trim() || '-';
    }

    getBowlerName(): string {
        const b = this.currentBowler();
        if (!b) return '-';
        return b.Name || b.PlayerName || `${b.FirstName || ''} ${b.LastName || ''}`.trim() || '-';
    }
}
