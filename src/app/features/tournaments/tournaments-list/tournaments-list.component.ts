import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TournamentService } from '../services/tournament.service';
import { environment } from '@environments/environment';
import { TeamsBannerComponent } from '@shared/components/teams-banner/teams-banner.component';

@Component({
  selector: 'app-tournaments-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './tournaments-list.component.html',
  styleUrl: './tournaments-list.component.scss'
})
export class TournamentsListComponent implements OnInit {
  tournaments = signal<any[]>([]);
  private tournamentService = inject(TournamentService);

  ngOnInit(): void {
    this.loadTournaments();
  }

  loadTournaments(): void {
    this.tournamentService.getAll().subscribe({
      next: (res: any) => {
        const data = res.data?.tournaments || res || [];
        data.forEach((t: any) => {
          t.FullLogoURL = t.LogoURL ? environment.apiUrl + t.LogoURL : 'assets/logo.jpeg';
          t.FullBannerURL = t.BannerURL ? environment.apiUrl + t.BannerURL : 'assets/MV_4.jpeg';
        });
        this.tournaments.set(data);
      },
      error: (err) => console.error('Error loading tournaments', err)
    });
  }
}
