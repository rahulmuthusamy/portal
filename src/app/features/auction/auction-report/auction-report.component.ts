import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { AuctionManagementService } from '../services/auction-management.service';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';

@Component({
  selector: 'app-auction-report',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatTabsModule,
    MatProgressSpinnerModule,
    MatChipsModule
  ],
  templateUrl: './auction-report.component.html',
  styleUrl: './auction-report.component.scss'
})
export class AuctionReportComponent implements OnInit {
  sessionId = signal<number | null>(null);
  loading = signal(true);
  reportData = signal<any>(null);

  private route = inject(ActivatedRoute);
  private auctionService = inject(AuctionManagementService);
  public router = inject(Router);

  displayedTeamColumns: string[] = ['teamName', 'playersCount', 'remainingBudget', 'spentAmount'];
  displayedSoldColumns: string[] = ['playerName', 'playerRole', 'teamName', 'basePrice', 'soldPrice'];
  displayedUnsoldColumns: string[] = ['playerName', 'playerRole', 'basePrice', 'status'];
  displayedBidsColumns: string[] = ['time', 'playerName', 'teamName', 'bidAmount'];

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id') || this.route.snapshot.queryParamMap.get('id');
    if (id) {
      this.sessionId.set(+id);
      this.loadReport(+id);
    }
  }

  loadReport(id: number): void {
    this.loading.set(true);
    this.auctionService.getAuctionResults(id).subscribe({
      next: (res: any) => {
        this.reportData.set(res.data);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  exportCSV(): void {
    const data = this.reportData();
    if (!data) return;

    let csv = 'Player Name,Role,Team,Base Price,Sold Price\n';
    data.soldPlayers.forEach((p: any) => {
      csv += `${p.playerName},${p.playerRole},${p.teamName},${p.basePrice},${p.soldPrice}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', `auction_results_session_${this.sessionId()}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
}
