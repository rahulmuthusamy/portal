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
    // ── Broadcast System (All standalone, no layout wrapper, no auth guard) ──
    {
        path: 'auction-board/:sessionId',
        loadComponent: () => import('./features/auction/auction-board/auction-board.component').then(m => m.AuctionBoardComponent),
    },
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
    // ── Public Registration Pages (standalone, no layout wrapper) ──
    {
        path: 'register-player',
        loadComponent: () => import('./features/registration/player-registration-page/player-registration-page.component').then(m => m.PlayerRegistrationPageComponent),
    },
    {
        path: 'register-owner',
        loadComponent: () => import('./features/registration/owner-registration-page/owner-registration-page.component').then(m => m.OwnerRegistrationPageComponent),
    },

    {
        path: 'workspace/:sessionId',
        loadComponent: () => import('./layouts/workspace-layout/workspace-layout.component').then(m => m.WorkspaceLayoutComponent),
        canActivate: [authGuard],
        children: [
            { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
            {
                path: 'dashboard',
                data: { breadcrumb: 'Workspace Dashboard' },
                loadComponent: () => import('@features/auction/auction-session-detail/auction-session-detail.component').then(m => m.AuctionSessionDetailComponent),
            },
            {
                path: 'players',
                data: { breadcrumb: 'Registered Players' },
                loadComponent: () => import('@features/auction/auction-player/auction-player.component').then(m => m.AuctionPlayerComponent),
            },
            {
                path: 'teams',
                data: { breadcrumb: 'Registered Teams' },
                loadComponent: () => import('@features/teams/teams/teams.component').then(m => m.TeamsComponent),
            },
            {
                path: 'live-room',
                data: { breadcrumb: 'Live Auction Room' },
                loadComponent: () => import('@features/auction/auction-room/auction-room.component').then(m => m.AuctionRoomComponent),
            },
            {
                path: 'pending-players',
                data: { breadcrumb: 'Pending Players' },
                loadComponent: () => import('@features/auction/pending-auction-players/pending-auction-players.component').then(m => m.PendingAuctionPlayersComponent),
            },
            {
                path: 'franchise-players',
                data: { breadcrumb: 'Pending Registrations' },
                loadComponent: () => import('@features/teams/pending-owners/pending-owners.component').then(m => m.PendingOwnersComponent),
            }
        ]
    },
    {
        path: 'kkk',
        component: MainLayoutComponent,
        canActivate: [authGuard],
        children: [
            // --- Defaults ---
            { path: '', redirectTo: 'auction-session-list', pathMatch: 'full' }, // Redirect to sessions list first

            // --- Global Players Management ---
            {
                path: 'players-list',
                data: { breadcrumb: 'All Global Players' },
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

            // --- Auction Session Management (Global View) ---
            {
                path: 'auction-session-list',
                data: { breadcrumb: 'Auction Sessions' },
                loadComponent: () => import('@features/auction/auction-session/auction-session.component').then(m => m.AuctionSessionComponent),
            },
            {
                path: 'auction-session-form',
                data: { breadcrumb: 'New Auction Session' },
                loadComponent: () => import('@features/auction/auction-session-form/auction-session-form.component').then(m => m.AuctionSessionFormComponent),
            },
            // Note: Session Details, Room, Players, etc., are now in the Workspace Layout

            // --- Global Teams Management ---
            {
                path: 'teams-list',
                data: { breadcrumb: 'All Global Teams' },
                loadComponent: () => import('@features/teams/teams/teams.component').then(m => m.TeamsComponent),
            }, 
            {
                path: 'teams-form',
                data: { breadcrumb: 'Team Form' },
                loadComponent: () => import('@features/teams/teams-form/teams-form.component').then(m => m.TeamsFormComponent),
            },

            // --- Settings & Gallery ---
            {
                path: 'settings',
                data: { breadcrumb: 'Settings' },
                loadComponent: () => import('@features/settings/settings.component').then(m => m.SettingsComponent),
            },
            {
                path: 'account',
                data: { breadcrumb: 'My Profile' },
                loadComponent: () => import('@features/account/account.component').then(m => m.AccountComponent),
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
