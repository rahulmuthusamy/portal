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
  selector: 'app-pending-owners',
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
  templateUrl: './pending-owners.component.html',
  styleUrls: ['./pending-owners.component.scss']
})
export class PendingOwnersComponent implements OnInit {
  pendingOwners = signal<any[]>([]);
  loading = signal(true);

  @ViewChild('approvalDialog') approvalDialogTemplate!: TemplateRef<any>;

  tableConfig: TableConfig = {
    height: '65vh',
    pageSize: 50,
    columns: [
      { key: 'FullName', label: 'Owner Name', searchable: true },
      { key: 'ContactNumber', label: 'Contact', searchable: true },
      { key: 'TeamName', label: 'Proposed Team Name', searchable: true },
      { key: 'TeamLocation', label: 'Location' },
      {
        key: 'createdAt',
        label: 'Submitted',
        searchable: true,
        render: (row: any) =>
          row.createdAt
            ? new Date(row.createdAt).toLocaleString('en-GB', {
              day: '2-digit',
              month: '2-digit',
              year: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
              hour12: false,
            })
            : '—',
      }, {
        key: 'actions',
        label: 'Actions',
        actions: [
          { text: 'View', type: 'View', class: 'btn-outline-primary', icon: 'bi-eye-fill' }
        ]
      }
    ]
  };

  private onboardingService = inject(OnboardingService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  ngOnInit() {
    this.loadPendingOwners();
  }

  getFileUrl(path: string | undefined): string {
    if (!path) return '';
    return path.startsWith('http') ? path : `${environment.apiUrl}${path}`;
  }

  loadPendingOwners() {
    this.loading.set(true);
    this.onboardingService.getPendingOwners().subscribe({
      next: (res: any) => {
        const mappedData = (res.data || []).map((owner: any) => ({
          ...owner,
          TeamName: owner.Team?.Name || '',
          TeamLocation: owner.Team?.Location || '-',
          createdAt: owner.CreatedAt || owner.createdAt
        }));
        mappedData.sort((a: any, b: any) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA;
        });
        this.pendingOwners.set(mappedData);
        this.loading.set(false);
      },
      error: (err: any) => {
        this.snackBar.open('Failed to load pending registrations', 'Error', { duration: 3000 });
        this.loading.set(false);
      }
    });
  }

  openApprovalDialog(owner: any, templateRef: any) {
    this.dialog.open(templateRef, {
      width: '600px',
      data: owner
    });
  }

  handleAction(event: any) {
    if (event.type === 'View') {
      this.openApprovalDialog(event.row, this.approvalDialogTemplate);
    }
  }

  verifyOwner(ownerId: number, status: 'approved' | 'rejected') {
    const confirmMessage = status === 'approved' ?
      'Are you sure you want to approve this team?' :
      'Are you sure you want to REJECT this team?';

    if (!confirm(confirmMessage)) return;

    this.onboardingService.verifyOwner(ownerId, status).subscribe({
      next: () => {
        this.snackBar.open(`Team registration ${status} successfully`, 'Success', { duration: 3000 });
        this.dialog.closeAll();
        this.loadPendingOwners(); // Refresh list
      },
      error: (err: any) => {
        this.snackBar.open(err.error?.message || `Failed to ${status} owner`, 'Error', { duration: 3000 });
      }
    });
  }
}
