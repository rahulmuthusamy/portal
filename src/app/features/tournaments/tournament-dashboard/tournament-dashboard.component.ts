import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { TournamentService } from '../services/tournament.service';
import { ToastService } from '../../../core/services/toast.service';
import { Tournament } from '../models/tournament.model';

@Component({
   selector: 'app-tournament-dashboard',
   standalone: true,
   imports: [CommonModule, RouterModule],
   templateUrl: './tournament-dashboard.component.html',
   styleUrls: ['./tournament-dashboard.component.scss']
})
export class TournamentDashboardComponent implements OnInit {
   private route = inject(ActivatedRoute);
   private router = inject(Router);
   private tournamentService = inject(TournamentService);
   private toast = inject(ToastService);

   tournament = signal<Tournament | null>(null);
   standings = signal<any[]>([]);
   stats = signal<any>(null);
   matches = signal<any[]>([]);
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
   }

   retry(): void {
      const id = this.route.snapshot.paramMap.get('id');
      if (id) {
         this.loadTournamentData(id);
      }
   }

   loadStandings(id: string): void {
      this.tournamentService.getStandings(Number(id)).subscribe({
         next: (res: any) => {
            this.standings.set(res.data?.standings || []);
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
      this.tournamentService.getTournamentMatches(Number(id)).subscribe({
         next: (res: any) => {
            this.matches.set(res.data?.matches || res || []);
         },
         error: (err: any) => console.error('Failed to load matches', err)
      });
   }

   generateFixtures(): void {
      const id = this.tournament()?.TournamentID;
      if (!id) return;

      if (confirm('Generate fixtures for this tournament? This will create all matches based on the tournament format.')) {
         this.tournamentService.generateFixtures(id).subscribe({
            next: (res: any) => {
               this.toast.showSuccess(`${res.data?.count || 0} fixtures generated successfully`);
               this.loadMatches(id.toString());
            },
            error: (err: any) => {
               this.toast.showError('Failed to generate fixtures. ' + (err.error?.message || ''));
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
               this.toast.showSuccess('Registration closed successfully');
               this.loadTournamentData(id.toString());
            },
            error: (err: any) => {
               this.toast.showError('Failed to close registration');
            }
         });
      }
   }

   setActiveTab(tab: string): void {
      this.activeTab.set(tab);
   }

   getStatusBadgeClass(status: string | undefined): string {
      switch (status) {
         case 'Upcoming': return 'badge bg-info';
         case 'Ongoing': return 'badge bg-success';
         case 'Completed': return 'badge bg-secondary';
         default: return 'badge bg-light text-dark';
      }
   }

   getMatchStatusClass(status: string): string {
      switch (status) {
         case 'Scheduled': return 'text-info';
         case 'Live': return 'text-success fw-bold';
         case 'Completed': return 'text-secondary';
         case 'Abandoned': return 'text-danger';
         default: return '';
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
