import { Component, OnInit, OnDestroy, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatchService } from '../services/match.service';
import { interval, Subscription, switchMap, startWith } from 'rxjs';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

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
   private sanitizer = inject(DomSanitizer);

   matchId = signal<number | null>(null);
   match = signal<any>(null);
   innings = signal<any[]>([]);
   activeTab = signal<number>(0); // 0 for Summary, 1 for Innings 1, 2 for Innings 2
   loading = signal(true);

   // Extract YouTube ID and create Safe URL
   youtubeUrl = computed<SafeResourceUrl | null>(() => {
      const url = this.match()?.StreamURL;
      if (!url) return null;

      let videoId = '';
      if (url.includes('youtu.be/')) {
         videoId = url.split('youtu.be/')[1].split('?')[0];
      } else if (url.includes('youtube.com/watch?v=')) {
         videoId = url.split('v=')[1].split('&')[0];
      } else if (url.includes('youtube.com/embed/')) {
         videoId = url.split('embed/')[1].split('?')[0];
      } else if (url.includes('youtube.com/live/')) {
         videoId = url.split('live/')[1].split('?')[0];
      }

      if (videoId) {
         return this.sanitizer.bypassSecurityTrustResourceUrl(`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1`);
      }
      return null;
   });

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
         switchMap(() => this.matchService.generateScorecard(this.matchId()!))
      ).subscribe({
         next: (res: any) => {
            const data = res.data || res;
            this.match.set(data.match);
            this.innings.set(data.scorecards || []);

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


