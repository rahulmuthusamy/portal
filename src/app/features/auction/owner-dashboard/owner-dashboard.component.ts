import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { OnboardingService } from '@core/services/onboarding.service';
import { AuthService } from '@core/services/auth.service';
import { SocketService } from '@core/services/socket.service';
import { environment } from '@environments/environment';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-owner-dashboard',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './owner-dashboard.component.html',
    styleUrl: './owner-dashboard.component.scss'
})
export class OwnerDashboardComponent implements OnInit, OnDestroy {
    private onboarding = inject(OnboardingService);
    private auth = inject(AuthService);
    private socketService = inject(SocketService);

    loading = true;
    error = '';
    ownerData: any = null;
    teamData: any = null;
    auctionSession: any = null;
    auctionTeam: any = null;
    squad: any[] = [];
    playerProfile: any = null;

    // Real-time notification
    notification: string | null = null;
    private notifTimeout: any;

    private socketSubs: Subscription[] = [];

    get apiUrl() { return environment.apiUrl; }

    logout() {
        this.auth.logout();
    }

    ngOnInit() {
        this.onboarding.getOwnerDashboard().subscribe({
            next: (res: any) => {
                const d = res?.data || {};
                this.ownerData = d.owner;
                this.teamData = d.team;
                this.auctionSession = d.auctionSession;
                this.auctionTeam = d.auctionTeam;
                this.squad = d.boughtPlayers || [];
                this.playerProfile = d.playerProfile;
                this.loading = false;

                // Connect to socket AFTER we have the session data
                this.connectSocket();
            },
            error: (err) => {
                this.error = err?.error?.message || 'Failed to load dashboard';
                this.loading = false;
            }
        });
    }

    private connectSocket() {
        // Connect to auction namespace — auth token is sent automatically
        const sessionId = this.auctionSession?.sessionId;

        // Join the session room if we have a session
        if (sessionId) {
            this.socketService.emit('/auction', 'join-session', { sessionId });
        }

        // Listen: auction started (status: live)
        const startedSub = this.socketService.on<any>('/auction', 'auction-started').subscribe((data) => {
            if (this.auctionSession) {
                this.auctionSession = { ...this.auctionSession, status: 'live' };
            }
            this.showNotification('🎉 Auction has started! You can now enter the auction room.');
        });

        // Listen: session-state (handles paused, resumed, general state changes)
        const stateSub = this.socketService.on<any>('/auction', 'session-state').subscribe((state: any) => {
            if (this.auctionSession && state?.session) {
                this.auctionSession = { ...this.auctionSession, status: state.session.status };
            }
        });

        // Listen: auction ended
        const endedSub = this.socketService.on<any>('/auction', 'auction-ended').subscribe(() => {
            if (this.auctionSession) {
                this.auctionSession = { ...this.auctionSession, status: 'completed' };
            }
            this.showNotification('🏁 The auction has ended.');
        });

        // Listen: auction paused → status reverts to upcoming
        const pausedSub = this.socketService.on<any>('/auction', 'auction-paused').subscribe(() => {
            if (this.auctionSession) {
                this.auctionSession = { ...this.auctionSession, status: 'upcoming' };
            }
            this.showNotification('⏸ Auction has been paused by the admin.');
        });

        // Budget / squad update after a player is sold to this team
        const soldSub = this.socketService.on<any>('/auction', 'player-sold').subscribe((data: any) => {
            // Refresh dashboard to get updated squad & budget
            if (data?.teamId && this.auctionTeam) {
                this.onboarding.getOwnerDashboard().subscribe((res: any) => {
                    const d = res?.data || {};
                    this.auctionTeam = d.auctionTeam;
                    this.squad = d.boughtPlayers || [];
                });
            }
        });

        this.socketSubs.push(startedSub, stateSub, endedSub, pausedSub, soldSub);
    }

    private showNotification(message: string) {
        this.notification = message;
        clearTimeout(this.notifTimeout);
        this.notifTimeout = setTimeout(() => {
            this.notification = null;
        }, 6000);
    }

    ngOnDestroy() {
        this.socketSubs.forEach(s => s.unsubscribe());
        this.socketService.disconnect('/auction');
    }

    getTeamLogo(logo: string): string {
        if (!logo) return 'assets/logo.jpeg';
        return logo.startsWith('http') ? logo : `${this.apiUrl}${logo}`;
    }

    getPlayerPhoto(photo: string): string {
        if (!photo) return 'assets/images/default-player.png';
        return photo.startsWith('http') ? photo : `${this.apiUrl}${photo}`;
    }
}