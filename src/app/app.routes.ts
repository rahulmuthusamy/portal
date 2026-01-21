import { Routes } from '@angular/router';
import { MainLayoutComponent } from './layouts/main-layout/main-layout.component';
import { AuthLayoutComponent } from '@features/auth/auth-layout/auth-layout.component';

export const routes: Routes = [
    {
        path: '',
        component: MainLayoutComponent,
        children: [
            {
                path: 'players-list',
                data: { breadcrumb: 'Registration List' },
                loadComponent: () => import('@features/players/player-registration/player-registration.component').then(m => m.PlayerRegistrationComponent),
            },
            {
                path: 'registration-form',
                data: { breadcrumb: 'Registration Form' },
                loadComponent: () => import('@features/players/player-registration-form/player-registration-form.component').then(m => m.PlayerRegistrationFormComponent),

            },
            {
                path: 'registration-form-edit/:id',
                data: { breadcrumb: 'Registration Form Edit' },
                loadComponent: () =>
                    import('@features/players/player-registration-form/player-registration-form.component')
                        .then(m => m.PlayerRegistrationFormComponent),
            }
            ,
            {
                path: 'auction-session-list',
                data: { breadcrumb: 'Auction Session List' },
                loadComponent: () => import('@features/auction/auction-session/auction-session.component').then(m => m.AuctionSessionComponent),
            },
            {
                path: 'auction-session-form',
                data: { breadcrumb: 'Auction Session Form' },
                loadComponent: () => import('@features/auction/auction-session-form/auction-session-form.component').then(m => m.AuctionSessionFormComponent),
            },
            {
                path: 'auction-room',
                data: { breadcrumb: 'Auction Room' },
                loadComponent: () => import('@features/auction/auction-room/auction-room.component').then(m => m.AuctionRoomComponent),
            },
            {
                path: 'team-dashboard',
                data: { breadcrumb: 'Auction Dashboard' },
                loadComponent: () => import('@features/auction/team/team-dashboard/team-dashboard.component').then(m => m.TeamDashboardComponent),
            },
            {
                path: 'teams-list',
                data: { breadcrumb: 'Team List' },
                loadComponent: () => import('@features/teams/teams/teams.component').then(m => m.TeamsComponent),
            },
            {
                path: 'teams-form',
                data: { breadcrumb: 'Team Form' },
                loadComponent: () => import('@features/teams/teams-form/teams-form.component').then(m => m.TeamsFormComponent),
            },
            {
                path: 'sample-page',
                data: { breadcrumb: 'Sample Page' },
                loadComponent: () => import('@features/sample/sample.component').then(m => m.SampleComponent),
            },

        ],
    },
    {
        path: '',
        component: AuthLayoutComponent,
        children: [
            {
                path: 'login',
                loadComponent: () => import('@features/auth/login/login.component').then(m => m.LoginComponent),
            },
        ],
    },
    {
        path: 'register-player-auction',
        loadComponent: () => import('@features/auction/auction-player/auction-player.component').then(m => m.AuctionPlayerComponent)
    },
    {
        path: '**',
        redirectTo: 'login',
    },
];
