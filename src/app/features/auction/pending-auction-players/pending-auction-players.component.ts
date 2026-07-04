import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { OnboardingService } from '@core/services/onboarding.service';
import { environment } from '@environments/environment';

@Component({
  selector: 'app-pending-auction-players',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './pending-auction-players.component.html',
  styleUrls: ['./pending-auction-players.component.scss']
})
export class PendingAuctionPlayersComponent implements OnInit {
  pendingPlayers = signal<any[]>([]);
  loading = signal(true);
  
  displayedColumns: string[] = ['photo', 'playerName', 'roleInfo', 'contact', 'payment', 'actions'];

  private onboardingService = inject(OnboardingService);
  private snackBar = inject(MatSnackBar);

  ngOnInit() {
    this.loadPendingPlayers();
  }

  getFileUrl(path: string | undefined): string {
    if (!path) return '';
    return path.startsWith('http') ? path : `${environment.apiUrl}${path}`;
  }

  loadPendingPlayers() {
    this.loading.set(true);
    this.onboardingService.getPendingAuctionPlayers().subscribe({
      next: (res: any) => {
        this.pendingPlayers.set(res.data || []);
        this.loading.set(false);
      },
      error: (err: any) => {
        this.snackBar.open('Failed to load pending players', 'Error', { duration: 3000 });
        this.loading.set(false);
      }
    });
  }

  verifyPlayer(auctionPlayerId: number, status: 'approved' | 'rejected') {
    const confirmMessage = status === 'approved' ? 
      'Are you sure you want to approve this player for the auction?' : 
      'Are you sure you want to REJECT this player?';
      
    if (!confirm(confirmMessage)) return;

    this.onboardingService.verifyAuctionPlayer(auctionPlayerId, status).subscribe({
      next: () => {
        this.snackBar.open(`Player registration ${status} successfully`, 'Success', { duration: 3000 });
        this.loadPendingPlayers(); // Refresh list
      },
      error: (err: any) => {
        this.snackBar.open(err.error?.message || `Failed to ${status} player`, 'Error', { duration: 3000 });
      }
    });
  }
}
