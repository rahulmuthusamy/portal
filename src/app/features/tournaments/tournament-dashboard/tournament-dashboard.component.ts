import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { TournamentService } from '../services/tournament.service';
import { ToastService } from '../../../core/services/toast.service';
import { Tournament } from '../models/tournament.model';
import { TeamsService } from '../../teams/services/teams.service';
import { environment } from '@environments/environment';

import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
   selector: 'app-tournament-dashboard',
   standalone: true,
   imports: [CommonModule, RouterModule, MatSnackBarModule],
   templateUrl: './tournament-dashboard.component.html',
   styleUrls: ['./tournament-dashboard.component.scss']
})
export class TournamentDashboardComponent implements OnInit {
   private route = inject(ActivatedRoute);
   public router = inject(Router);
   private tournamentService = inject(TournamentService);
   private teamsService = inject(TeamsService);
   private toast = inject(ToastService);
   private snackBar = inject(MatSnackBar);

   protected environment = environment;

   getImageUrl(url: string | undefined): string {
      if (!url) return '';
      if (url.startsWith('http') || url.startsWith('assets')) return url;
      const baseUrl = environment.apiUrl;
      return baseUrl + url;
   }

   tournament = signal<Tournament | null>(null);
   standings = signal<any[]>([]);
   stats = signal<any>(null);
   matches = signal<any[]>([]);
   allTeams = signal<any[]>([]);
   loading = signal(true);
   error = signal<string | null>(null);
   activeTab = signal('overview');

   // Computed properties
   getUpcomingMatches = computed(() => {
      return this.matches()
         .filter(m => m.Status === 'Scheduled')
         .sort((a, b) => new Date(a.MatchDate).getTime() - new Date(b.MatchDate).getTime());
   });

   ngOnInit(): void {
      const id = this.route.snapshot.paramMap.get('id');
      if (id) {
         this.loadTournamentData(id);
      }
   }

   loadTournamentData(id: string): void {
      this.loading.set(true);
      this.error.set(null);

      // Load tournament details
      this.tournamentService.getById(Number(id)).subscribe({
         next: (res: any) => {
            this.tournament.set(res.data?.tournament || res);
            this.loading.set(false);
         },
         error: (err: any) => {
            console.error(err);
            this.error.set('Failed to load tournament data. Please check if the tournament exists and try again.');
            this.toast.showError('Failed to load tournament');
            this.loading.set(false);
         }
      });

      // Load standings
      this.loadStandings(id);

      // Load statistics
      this.loadStats(id);

      // Load matches
      this.loadMatches(id);

      // Load all available teams for registration
      this.loadAllTeams();
   }

   loadAllTeams(): void {
      this.teamsService.getAll().subscribe({
         next: (res: any) => {
            this.allTeams.set(res.data?.teams || res || []);
         },
         error: (err: any) => console.error('Failed to load all teams', err)
      });
   }

   retry(): void {
      const id = this.route.snapshot.paramMap.get('id');
      if (id) {
         this.loadTournamentData(id);
      }
   }

   loadStandings(id: string): void {
      this.tournamentService.getStandingsNew(Number(id)).subscribe({
         next: (res: any) => {
            this.standings.set(res.data || []);
         },
         error: (err: any) => console.error('Failed to load standings', err)
      });
   }

   loadStats(id: string): void {
      this.tournamentService.getStats(Number(id)).subscribe({
         next: (res: any) => {
            this.stats.set(res.data || res);
         },
         error: (err: any) => console.error('Failed to load stats', err)
      });
   }

   loadMatches(id: string): void {
      this.tournamentService.getTournamentMatchesNew(Number(id)).subscribe({
         next: (res: any) => {
            this.matches.set(res.data || []);
         },
         error: (err: any) => console.error('Failed to load matches', err)
      });
   }

   generateFixtures(): void {
      const id = this.tournament()?.TournamentID;
      if (!id) return;

      if (confirm('Generate fixtures for this tournament? This will create all matches based on the tournament format.')) {
         this.tournamentService.generateFixturesNew(id).subscribe({
            next: (res: any) => {
               this.snackBar.open(`${res.message || 'Fixtures generated'}`, 'Success', { duration: 3000 });
               this.loadMatches(id.toString());
            },
            error: (err: any) => {
               this.snackBar.open('Failed to generate fixtures. ' + (err.error?.message || ''), 'Error');
            }
         });
      }
   }

   closeRegistration(): void {
      const id = this.tournament()?.TournamentID;
      if (!id) return;

      if (confirm('Close registration for this tournament? Teams will no longer be able to register.')) {
         this.tournamentService.closeRegistration(id).subscribe({
            next: () => {
               this.snackBar.open('Registration closed successfully', 'Success');
               this.loadTournamentData(id.toString());
            },
            error: (err: any) => {
               this.snackBar.open('Failed to close registration', 'Error');
            }
         });
      }
   }

   registerTeam(teamId: number): void {
      const id = this.tournament()?.TournamentID;
      if (!id) return;

      this.tournamentService.registerTeam(id, teamId).subscribe({
         next: () => {
            this.snackBar.open('Team registered successfully', 'Success');
            this.loadStandings(id.toString());
         },
         error: (err: any) => {
            this.snackBar.open(err.error?.message || 'Failed to register team', 'Error');
         }
      });
   }

   setActiveTab(tab: string): void {
      this.activeTab.set(tab);
   }

   getStatusBadgeClass(status: string | undefined): string {
      switch (status) {
         case 'Upcoming': return 'bg-info text-dark';
         case 'Ongoing': return 'bg-success';
         case 'Completed': return 'bg-secondary';
         default: return 'bg-light text-dark';
      }
   }

   getMatchStatusClass(status: string): string {
      switch (status) {
         case 'Scheduled': return 'badge bg-light text-dark border';
         case 'Live': return 'badge bg-danger animate-pulse';
         case 'Completed': return 'badge bg-success';
         case 'Abandoned': return 'badge bg-warning text-dark';
         default: return 'badge bg-light text-dark';
      }
   }

   getCompletedMatchesCount(): number {
      return this.matches().filter(m => m.Status === 'Completed').length;
   }

   getTotalRuns(): number {
      return this.standings().reduce((sum, team) => sum + (team.RunsScored || 0), 0);
   }

   getTotalWickets(): number {
      return 0; // Placeholder
   }

   getFormArray(formString: string): string[] {
      return formString ? formString.split('') : [];
   }
}
