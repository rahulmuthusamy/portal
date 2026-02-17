import { Component, OnInit, OnDestroy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatchService } from '../services/match.service';
import { interval, Subscription, switchMap, startWith } from 'rxjs';

@Component({
   selector: 'app-scorecard',
   standalone: true,
   imports: [CommonModule, RouterModule],
   templateUrl: './scorecard.component.html',
   styleUrl: './scorecard.component.scss'
})
export class ScorecardComponent implements OnInit, OnDestroy {
   private route = inject(ActivatedRoute);
   private matchService = inject(MatchService);

   matchId = signal<number | null>(null);
   match = signal<any>(null);
   innings = signal<any[]>([]);
   activeTab = signal<number>(0); // 0 for Summary, 1 for Innings 1, 2 for Innings 2
   loading = signal(true);

   private pollingSub?: Subscription;

   ngOnInit(): void {
      const id = this.route.snapshot.paramMap.get('id');
      if (id) {
         this.matchId.set(Number(id));
         this.startPolling();
      }
   }

   ngOnDestroy(): void {
      this.pollingSub?.unsubscribe();
   }

   startPolling(): void {
      // Poll every 15 seconds if the match is live
      this.pollingSub = interval(15000).pipe(
         startWith(0),
         switchMap(() => this.matchService.getScorecard(this.matchId()!))
      ).subscribe({
         next: (res: any) => {
            const data = res.data || res;
            this.match.set(data.match);
            this.innings.set(data.innings || []);

            // If match is not live and we have data, we can stop polling (optional)
            if (data.match?.Status !== 'Live' && this.innings().length > 0) {
               // this.pollingSub?.unsubscribe();
            }

            // Default active tab to current innings or Innings 1
            if (this.loading()) {
               const currentInn = data.match?.CurrentInnings || (this.innings().length > 0 ? 1 : 0);
               this.activeTab.set(currentInn);
               this.loading.set(false);
            }
         },
         error: () => {
            this.loading.set(false);
         }
      });
   }

   setTab(tab: number): void {
      this.activeTab.set(tab);
   }

   getScoreText(teamId: number): string {
      const m = this.match();
      if (!m) return '0/0 (0.0)';
      if (teamId === m.TeamA_ID) return `${m.TeamA_Runs || 0}/${m.TeamA_Wickets || 0} (${(m.TeamA_Overs || 0).toFixed(1)})`;
      return `${m.TeamB_Runs || 0}/${m.TeamB_Wickets || 0} (${(m.TeamB_Overs || 0).toFixed(1)})`;
   }
}


