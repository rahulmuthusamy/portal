import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatchService } from '../services/match.service';
import { Match } from '../models/match.model';

@Component({
  selector: 'app-match-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="match-list-container animate-fade p-3 p-md-4">
      <div class="header-section mb-4 d-flex justify-content-between align-items-center">
        <div>
          <h2 class="fw-black text-dark mb-1">Match Schedule</h2>
          <p class="text-muted">Manage all tournament and quick matches.</p>
        </div>
        <button class="btn btn-primary btn-lg shadow-sm rounded-3 fw-bold" [routerLink]="['/kkk/match-form']">
          <i class="bi bi-calendar-plus me-2"></i> Schedule Match
        </button>
      </div>

      <div class="filter-bar mb-4 p-3 bg-white rounded-4 border shadow-sm">
        <div class="d-flex gap-3 overflow-auto">
          <button class="btn btn-sm px-4 rounded-pill fw-bold" [class.btn-dark]="filter() === 'all'" (click)="filter.set('all')">All Matches</button>
          <button class="btn btn-sm px-4 rounded-pill fw-bold" [class.btn-dark]="filter() === 'Live'" (click)="filter.set('Live')">🔴 Live</button>
          <button class="btn btn-sm px-4 rounded-pill fw-bold" [class.btn-dark]="filter() === 'Scheduled'" (click)="filter.set('Scheduled')">Upcoming</button>
          <button class="btn btn-sm px-4 rounded-pill fw-bold" [class.btn-dark]="filter() === 'Completed'" (click)="filter.set('Completed')">Finished</button>
        </div>
      </div>

      <div class="row g-4">
        <div class="col-md-6 col-lg-4" *ngFor="let match of filteredMatches()">
          <div class="match-card shadow-sm border-0" [class.live-border]="match.Status === 'Live'">
            <div class="match-header p-3 d-flex justify-content-between align-items-center">
              <span class="tournament-name small fw-bold text-muted text-uppercase">
                {{ match.TournamentID ? 'TOURNEY #' + match.TournamentID : 'QUICK MATCH' }}
              </span>
              <span class="match-status px-3 py-1 rounded-pill small fw-bold" [class]="(match.Status || 'scheduled').toLowerCase()">
                {{ match.Status || 'Scheduled' }}
              </span>
            </div>
            
            <div class="match-body p-4 text-center">
              <div class="d-flex justify-content-between align-items-center gap-3 mb-4">
                <div class="team text-center flex-fill">
                  <div class="team-logo-wrapper mb-2">
                    <img [src]="match.TeamA?.LogoURL || 'assets/logo.jpeg'" class="team-logo">
                  </div>
                  <h6 class="mb-0 fw-bold">{{ match.TeamA?.Name || 'Team A' }}</h6>
                </div>
                
                <div class="vs-badge">VS</div>

                <div class="team text-center flex-fill">
                  <div class="team-logo-wrapper mb-2">
                    <img [src]="match.TeamB?.LogoURL || 'assets/logo.jpeg'" class="team-logo">
                  </div>
                  <h6 class="mb-0 fw-bold">{{ match.TeamB?.Name || 'Team B' }}</h6>
                </div>
              </div>

              <div class="match-details mb-4 py-2 border-top border-bottom bg-light bg-opacity-50 rounded-3">
                <div class="small text-muted mb-1"><i class="bi bi-geo-alt me-1"></i> {{ match.Venue || 'TBD Ground' }}</div>
                <div class="fw-bold text-dark">{{ match.MatchDate | date:'MMM d, y, h:mm a' }}</div>
              </div>

              <div class="match-actions d-grid gap-2">
                <button *ngIf="match.Status === 'Live'" class="btn btn-primary w-100 py-2 fw-black pulse-btn shadow-sm" [routerLink]="['/kkk/live-scoring', match.MatchID]">
                   <span class="live-dot me-2"></span> LIVE SCORING
                </button>
                <button *ngIf="match.Status === 'Scheduled'" class="btn btn-dark w-100 py-2 fw-black shadow-sm" [routerLink]="['/kkk/live-scoring', match.MatchID]">
                  START SCORING
                </button>
                <button *ngIf="match.Status === 'Completed'" class="btn btn-outline-dark w-100 py-2 fw-bold" [routerLink]="['/kkk/scorecard', match.MatchID]">
                  VIEW FULL SCORECARD
                </button>
                <button *ngIf="match.Status !== 'Completed'" class="btn btn-link btn-sm text-muted text-decoration-none" [routerLink]="['/kkk/scorecard', match.MatchID]">
                   Go to scoreboard
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div class="col-12 text-center py-5" *ngIf="filteredMatches().length === 0">
           <div class="empty-icon text-muted opacity-25" style="font-size: 4rem;"><i class="bi bi-calendar-x"></i></div>
           <h4 class="mt-3 fw-bold">No matches found</h4>
           <p class="text-muted">There are no matches scheduled for this category.</p>
           <button class="btn btn-primary mt-2" [routerLink]="['/kkk/match-form']">Schedule One Now</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .fw-black { font-weight: 900; }
    .match-card {
      background: white;
      border-radius: 24px;
      overflow: hidden;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      &:hover { transform: translateY(-8px); box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04) !important; }
    }
    .live-border { border: 2px solid #3b82f6 !important; box-shadow: 0 0 15px rgba(59, 130, 246, 0.2); }
    .match-status {
      &.completed { background: #f1f5f9; color: #64748b; }
    }
    .live-dot {
      display: inline-block;
      width: 8px;
      height: 8px;
      background: #ffffff;
      border-radius: 50%;
      animation: blink 1s infinite;
    }
    @keyframes blink {
      0% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.5; transform: scale(1.2); }
      100% { opacity: 1; transform: scale(1); }
    }
    .team-logo-wrapper {
      width: 60px;
      height: 60px;
      margin: 0 auto;
      background: #f8fafc;
      border-radius: 50%;
      border: 2px solid #f1f5f9;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 8px;
    }
    .team-logo { max-width: 100%; max-height: 100%; object-fit: contain; }
    .vs-badge { 
      font-weight: 900; 
      color: #94a3b8; 
      font-size: 0.7rem;
      padding: 6px 12px;
      background: #f1f5f9;
      border-radius: 12px;
    }
    .pulse-btn {
      background: #3b82f6; border: none;
      animation: pulse-blue 2s infinite;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    @keyframes pulse-blue {
      0% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7); }
      70% { box-shadow: 0 0 0 10px rgba(59, 130, 246, 0); }
      100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); }
    }
  `]
})
export class MatchListComponent implements OnInit {
  matches = signal<Match[]>([]);
  filter = signal<'all' | 'Live' | 'Scheduled' | 'Completed'>('all');

  constructor(private matchService: MatchService) { }

  ngOnInit(): void {
    this.loadMatches();
  }

  loadMatches(): void {
    this.matchService.getAll().subscribe((res: any) => {
      this.matches.set(res.data?.matches || res || []);
    });
  }

  filteredMatches = () => {
    if (this.filter() === 'all') return this.matches();
    return this.matches().filter(m => m.Status === this.filter());
  };
}

