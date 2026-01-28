import { Routes } from '@angular/router';
import { MainLayoutComponent } from './layouts/main-layout/main-layout.component';
import { AuthLayoutComponent } from '@features/auth/auth-layout/auth-layout.component';

export const routes: Routes = [

    {
        path: '',
        loadComponent: () => import('@features/kkk-website/kkk-website.component').then(m => m.KkkWebsiteComponent),
        pathMatch: 'full'
    },
    {
        path: '',
        component: AuthLayoutComponent,
        children: [
            {
                path: 'login',
                loadComponent: () => import('@features/auth/login/login.component').then(m => m.LoginComponent),
            },
        ]
    },

    {
        path: 'kkk',
        component: MainLayoutComponent,
        // canActivate: [AuthGuard], // TODO: Uncomment when AuthGuard is ready
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
                path: 'auction-session-form',
                data: { breadcrumb: 'New Auction Session' },
                loadComponent: () => import('@features/auction/auction-session-form/auction-session-form.component').then(m => m.AuctionSessionFormComponent),
            },
            {
                path: 'auction-room',
                data: { breadcrumb: 'Live Auction Room' },
                loadComponent: () => import('@features/auction/auction-room/auction-room.component').then(m => m.AuctionRoomComponent),
            },

            // --- Teams Management ---
            {
                path: 'teams-list',
                data: { breadcrumb: 'Teams' },
                loadComponent: () => import('@features/teams/teams/teams.component').then(m => m.TeamsComponent),
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
