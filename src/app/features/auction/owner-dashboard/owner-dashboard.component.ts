import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { OnboardingService } from '@core/services/onboarding.service';
import { AuthService } from '@core/services/auth.service';
import { environment } from '@environments/environment';

@Component({
    selector: 'app-owner-dashboard',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './owner-dashboard.component.html',
    styleUrl: './owner-dashboard.component.scss'
})
export class OwnerDashboardComponent implements OnInit {
    private onboarding = inject(OnboardingService);
    private auth = inject(AuthService);

    loading = true;
    error = '';
    ownerData: any = null;
    teamData: any = null;
    auctionSession: any = null;
    squad: any[] = [];
    playerProfile: any = null;

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
                this.squad = d.boughtPlayers || [];
                this.playerProfile = d.playerProfile;
                this.loading = false;
            },
            error: (err) => {
                this.error = err?.error?.message || 'Failed to load dashboard';
                this.loading = false;
            }
        });
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