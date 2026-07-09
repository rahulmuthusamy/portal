import { Component, OnInit, signal, inject, ViewChild, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { DataTableComponent, TableConfig } from '@shared/components/data-table/data-table.component';
import { OnboardingService } from '@core/services/onboarding.service';
import { environment } from '@environments/environment';

@Component({
  selector: 'app-pending-auction-players',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    DataTableComponent
  ],
  templateUrl: './pending-auction-players.component.html',
  styleUrls: ['./pending-auction-players.component.scss']
})
export class PendingAuctionPlayersComponent implements OnInit {
  pendingPlayers = signal<any[]>([]);
  loading = signal(true);

  @ViewChild('approvalDialog') approvalDialogTemplate!: TemplateRef<any>;

  tableConfig: TableConfig = {
    height: '65vh',
    pageSize: 50,
    columns: [
      { key: 'imageUrl', label: 'Photo', type: 'image' },
      { key: 'PlayerName', label: 'Player Name', searchable: true },
      { key: 'age', label: 'Age', searchable: true },
      { key: 'PlayerRole', label: 'Role', searchable: true },
      { key: 'BasePrice', label: 'Base Price (₹)' },
      { key: 'PlayerContact', label: 'Contact', searchable: true },
      {
        key: 'actions',
        label: 'Actions',
        actions: [
          { text: 'View', type: 'View', class: 'btn-outline-primary', icon: 'visibility' }
        ]
      }
    ]
  };

  private onboardingService = inject(OnboardingService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  ngOnInit() {
    this.loadPendingPlayers();
  }


  calculateAge(dob: string | Date): number {
    if (!dob) return 0;

    const birthDate = new Date(dob);
    const today = new Date();

    let age = today.getFullYear() - birthDate.getFullYear();

    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    return age;
  }


  getFileUrl(path: string | undefined): string {
    if (!path) return '';
    return path.startsWith('http') ? path : `${environment.apiUrl}${path}`;
  }

  loadPendingPlayers() {
    this.loading.set(true);
    this.onboardingService.getPendingAuctionPlayers().subscribe({
      next: (res: any) => {
        this.pendingPlayers.set(Array.isArray(res.data) ? res.data.map((item: any) => ({
          ...item,
          imageUrl: (item.PlayerMaster.PhotoURL || item.PlayerMaster.PhotoURL)
            ? ((item.PlayerMaster.PhotoURL || item.PlayerMaster.PhotoURL).startsWith('http') ? (item.PlayerMaster.PhotoURL || item.PlayerMaster.PhotoURL) : environment.apiUrl + (item.PlayerMaster.PhotoURL || item.PlayerMaster.PhotoURL))
            : 'assets/avatars/default.jpg',
          age: this.calculateAge(item.PlayerMaster.DOB),
          PlayerName: item.PlayerMaster.Name,
          PlayerRole: item.PlayerMaster.Role || 'Player',
          PlayerContact: item.PlayerMaster.Mobile,
          AadharURL: item.PlayerMaster.AadharURL ? (item.PlayerMaster.AadharURL.startsWith('http') ? item.PlayerMaster.AadharURL : environment.apiUrl + item.PlayerMaster.AadharURL) : null
        })) : []);
        this.loading.set(false);
      },
      error: (err: any) => {
        this.snackBar.open('Failed to load pending players', 'Error', { duration: 3000 });
        this.loading.set(false);
      }
    });
  }

  openApprovalDialog(player: any, templateRef: any) {
    this.dialog.open(templateRef, {
      width: '600px',
      data: player
    });
  }

  handleAction(event: any) {
    if (event.type === 'View') {
      this.openApprovalDialog(event.row, this.approvalDialogTemplate);
    }
  }

  verifyPlayer(auctionPlayerId: number, status: 'approved' | 'rejected') {
    const confirmMessage = status === 'approved' ?
      'Are you sure you want to approve this player for the auction?' :
      'Are you sure you want to REJECT this player?';

    if (!confirm(confirmMessage)) return;

    this.onboardingService.verifyAuctionPlayer(auctionPlayerId, status).subscribe({
      next: () => {
        this.snackBar.open(`Player registration ${status} successfully`, 'Success', { duration: 3000 });
        this.dialog.closeAll();
        this.loadPendingPlayers(); // Refresh list
      },
      error: (err: any) => {
        this.snackBar.open(err.error?.message || `Failed to ${status} player`, 'Error', { duration: 3000 });
      }
    });
  }
}
