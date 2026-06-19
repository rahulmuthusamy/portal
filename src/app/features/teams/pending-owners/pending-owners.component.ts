import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { OnboardingService } from '@core/services/onboarding.service';

@Component({
  selector: 'app-pending-owners',
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
  templateUrl: './pending-owners.component.html',
  styleUrls: ['./pending-owners.component.scss']
})
export class PendingOwnersComponent implements OnInit {
  pendingOwners = signal<any[]>([]);
  loading = signal(true);
  
  displayedColumns: string[] = ['ownerName', 'contact', 'teamName', 'location', 'actions'];

  private onboardingService = inject(OnboardingService);
  private snackBar = inject(MatSnackBar);

  ngOnInit() {
    this.loadPendingOwners();
  }

  loadPendingOwners() {
    this.loading.set(true);
    this.onboardingService.getPendingOwners().subscribe({
      next: (res: any) => {
        this.pendingOwners.set(res.data || []);
        this.loading.set(false);
      },
      error: (err: any) => {
        this.snackBar.open('Failed to load pending registrations', 'Error', { duration: 3000 });
        this.loading.set(false);
      }
    });
  }

  verifyOwner(ownerId: number, status: 'approved' | 'rejected') {
    const confirmMessage = status === 'approved' ? 
      'Are you sure you want to approve this team?' : 
      'Are you sure you want to REJECT this team?';
      
    if (!confirm(confirmMessage)) return;

    this.onboardingService.verifyOwner(ownerId, status).subscribe({
      next: () => {
        this.snackBar.open(`Team registration ${status} successfully`, 'Success', { duration: 3000 });
        this.loadPendingOwners(); // Refresh list
      },
      error: (err: any) => {
        this.snackBar.open(err.error?.message || `Failed to ${status} owner`, 'Error', { duration: 3000 });
      }
    });
  }
}
