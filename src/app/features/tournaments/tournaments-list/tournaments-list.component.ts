import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TournamentService } from '../services/tournament.service';
import { environment } from '@environments/environment';
import { TeamsBannerComponent } from '@shared/components/teams-banner/teams-banner.component';
import Swal from 'sweetalert2';

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
          const getImageUrl = (url: string) => {
            if (!url) return null;
            if (url.startsWith('http')) return url;
            if (url.startsWith('/api')) return environment.apiUrl.replace('/api', '') + url;
            return environment.apiUrl + url;
          };
          t.FullLogoURL = getImageUrl(t.LogoURL) || 'assets/logo.jpeg';
          t.FullBannerURL = getImageUrl(t.BannerURL) || 'assets/MV_4.jpeg';
        });
        this.tournaments.set(data);
      },
      error: (err) => console.error('Error loading tournaments', err)
    });
  }

  deleteTournament(tournament: any): void {
    Swal.fire({
      title: 'Are you sure?',
      text: `You want to delete tournament "${tournament.Name}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
      if (result.isConfirmed) {
        this.tournamentService.delete(tournament.TournamentID).subscribe({
          next: () => {
            Swal.fire('Deleted!', 'The tournament has been deleted.', 'success');
            this.loadTournaments();
          },
          error: (err: any) => {
            Swal.fire('Error!', err.error?.message || 'Failed to delete tournament.', 'error');
          }
        });
      }
    });
  }
}
