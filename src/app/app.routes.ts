import { Routes } from '@angular/router';
import { MainLayoutComponent } from './layouts/main-layout/main-layout.component';
import { AuthLayoutComponent } from '@features/auth/auth-layout/auth-layout.component';
import { authGuard } from '@core/guards/auth.guard';

export const routes: Routes = [

    {
        path: '',
        loadComponent: () => import('@features/kkk-website/kkk-website.component').then(m => m.KkkWebsiteComponent),
        pathMatch: 'full'
    },
    // ── Owner Dashboard (standalone, shown after login) ──
    {
        path: 'owner-dashboard',
        loadComponent: () => import('./features/auction/owner-dashboard/owner-dashboard.component').then(m => m.OwnerDashboardComponent),
        canActivate: [authGuard],
    },
    // ── Owner Auction Live View (standalone, no admin layout) ──
    {
        path: 'auction-live',
        loadComponent: () => import('./features/auction/owner-auction-live/owner-auction-live.component').then(m => m.OwnerAuctionLiveComponent),
        canActivate: [authGuard],
    },
    // ── Broadcast System (All standalone, no layout wrapper) ──
    // Scorecard Overlay for OBS: http://localhost:4200/overlay/{matchId}
    {
        path: 'overlay/:id',
        loadComponent: () => import('@features/matches/broadcast-overlay/broadcast-overlay.component').then(m => m.BroadcastOverlayComponent),
    },
    // Camera Source (open on mobile phones): http://localhost:4200/camera/{matchId}?label=Front%20View
    {
        path: 'camera/:id',
        loadComponent: () => import('@features/broadcast/camera-source/camera-source.component').then(m => m.CameraSourceComponent),
    },
    // Broadcast Director (control room on laptop): http://localhost:4200/broadcast/{matchId}
    {
        path: 'broadcast/:id',
        loadComponent: () => import('@features/broadcast/broadcast-director/broadcast-director.component').then(m => m.BroadcastDirectorComponent),
    },
    {
        path: '',
        component: AuthLayoutComponent,
        children: [
            {
                path: 'login',
                loadComponent: () => import('@features/auth/login/login.component').then(m => m.LoginComponent),
            },
            {
                path: 'register',
                loadComponent: () => import('@features/auth/register/register.component').then(m => m.RegisterComponent),
            }
        ]
    },

    {
        path: 'kkk',
        component: MainLayoutComponent,
        canActivate: [authGuard],
        children: [
            // --- Defaults ---
            { path: '', redirectTo: 'players-list', pathMatch: 'full' },

            // --- Players Management ---
            {
                path: 'players-list',
                data: { breadcrumb: 'Players List' },
                loadComponent: () => import('@features/players/player-registration/player-registration.component').then(m => m.PlayerRegistrationComponent),
            },
            {
                path: 'registration-form',
                data: { breadcrumb: 'Registration Form' },
                loadComponent: () => import('@features/players/player-registration-form/player-registration-form.component').then(m => m.PlayerRegistrationFormComponent),
            },
            {
                path: 'registration-form-edit/:id',
                data: { breadcrumb: 'Edit Registration' },
                loadComponent: () => import('@features/players/player-registration-form/player-registration-form.component').then(m => m.PlayerRegistrationFormComponent),
            },

            // --- Auction Management ---
            {
                path: 'auction-session-list',
                data: { breadcrumb: 'Auction Sessions' },
                loadComponent: () => import('@features/auction/auction-session/auction-session.component').then(m => m.AuctionSessionComponent),
            },
            {
                path: 'auction-player-register',
                data: { breadcrumb: 'Register Player for Auction' },
                loadComponent: () => import('@features/auction/auction-player/auction-player.component').then(m => m.AuctionPlayerComponent),
            },
            {
                path: 'auction-session-form',
                data: { breadcrumb: 'New Auction Session' },
                loadComponent: () => import('@features/auction/auction-session-form/auction-session-form.component').then(m => m.AuctionSessionFormComponent),
            },
            {
                path: 'auction-session-detail/:id',
                data: { breadcrumb: 'Manage Session' },
                loadComponent: () => import('@features/auction/auction-session-detail/auction-session-detail.component').then(m => m.AuctionSessionDetailComponent),
            },
            {
                path: 'auction-room',
                data: { breadcrumb: 'Live Auction Room' },
                loadComponent: () => import('@features/auction/auction-room/auction-room.component').then(m => m.AuctionRoomComponent),
            },
            {
                path: 'auction-report/:id',
                data: { breadcrumb: 'Auction Report' },
                loadComponent: () => import('@features/auction/auction-report/auction-report.component').then(m => m.AuctionReportComponent),
            },

            // --- Teams Management ---
            {
                path: 'teams-list',
                data: { breadcrumb: 'Teams' },
                loadComponent: () => import('@features/teams/teams/teams.component').then(m => m.TeamsComponent),
            },
            {
                path: 'pending-owners',
                data: { breadcrumb: 'Pending Registrations' },
                loadComponent: () => import('@features/teams/pending-owners/pending-owners.component').then(m => m.PendingOwnersComponent),
            },
            {
                path: 'teams-form',
                data: { breadcrumb: 'Team Form' },
                loadComponent: () => import('@features/teams/teams-form/teams-form.component').then(m => m.TeamsFormComponent),
            },
            {
                path: 'team-dashboard',
                data: { breadcrumb: 'Team Dashboard' },
                loadComponent: () => import('@features/auction/team/team-dashboard/team-dashboard.component').then(m => m.TeamDashboardComponent),
            },

            // --- Settings & Gallery ---
            {
                path: 'settings',
                data: { breadcrumb: 'Settings' },
                loadComponent: () => import('@features/settings/settings.component').then(m => m.SettingsComponent),
            },
            {
                path: 'gallery',
                data: { breadcrumb: 'Gallery' },
                loadComponent: () => import('@features/gallery/gallery.component').then(m => m.GalleryComponent),
            },

            // --- Tournament Management ---
            {
                path: 'tournaments-list',
                data: { breadcrumb: 'Tournaments' },
                loadComponent: () => import('@features/tournaments/tournaments-list/tournaments-list.component').then(m => m.TournamentsListComponent),
            },
            {
                path: 'tournament-form',
                data: { breadcrumb: 'New Tournament' },
                loadComponent: () => import('@features/tournaments/tournament-form/tournament-form.component').then(m => m.TournamentFormComponent),
            },
            {
                path: 'tournament-details/:id',
                data: { breadcrumb: 'Tournament Dashboard' },
                loadComponent: () => import('@features/tournaments/tournament-dashboard/tournament-dashboard.component').then(m => m.TournamentDashboardComponent),
            },

            // --- Match Management ---
            {
                path: 'match-list',
                data: { breadcrumb: 'Matches' },
                loadComponent: () => import('@features/matches/match-list/match-list.component').then(m => m.MatchListComponent),
            },
            {
                path: 'match-form',
                data: { breadcrumb: 'New Match' },
                loadComponent: () => import('@features/matches/match-form/match-form.component').then(m => m.MatchFormComponent),
            },
            {
                path: 'match-form/:id',
                data: { breadcrumb: 'Edit Match' },
                loadComponent: () => import('@features/matches/match-form/match-form.component').then(m => m.MatchFormComponent),
            },
            {
                path: 'scorecard/:id',
                data: { breadcrumb: 'Live Scorecard' },
                loadComponent: () => import('@features/matches/scorecard/scorecard.component').then(m => m.ScorecardComponent),
            },
            {
                path: 'live-scoring/:id',
                data: { breadcrumb: 'Live Scoring' },
                loadComponent: () => import('@features/matches/live-scoring/live-scoring.component').then(m => m.LiveScoringComponent),
            },
            {
                path: 'match-squad/:matchId/:teamId',
                data: { breadcrumb: 'Match Squad' },
                loadComponent: () => import('@features/matches/match-squad/match-squad.component').then(m => m.MatchSquadComponent),
            },
            // --- Other ---
            {
                path: 'sample-page',
                data: { breadcrumb: 'Sample' },
                loadComponent: () => import('@features/sample/sample.component').then(m => m.SampleComponent),
            },
        ]
    },

    /* =========================================================================
       4. WILDCARD (Redirect to Public Website)
       ========================================================================= */
    {
        path: '**',
        redirectTo: '',
    }
];
