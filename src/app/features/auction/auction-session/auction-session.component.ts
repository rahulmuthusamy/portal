import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { map, Observable } from 'rxjs';
import { AuctionSessionService } from '../services/auction-session.service';
import { DataTableComponent, TableConfig } from '@shared/components/data-table/data-table.component';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';
import { ButtonComponent } from '@shared/forms/form-controls';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-auction-session',
  imports: [CommonModule, FormsModule, DataTableComponent, ButtonComponent],
  templateUrl: './auction-session.component.html',
  styleUrl: './auction-session.component.scss'
})
export class AuctionSessionComponent implements OnInit {

  constructor(
    private router: Router,
    private auctionSessionService: AuctionSessionService

  ) { }

  auctionSession$!: Observable<any[]>;

  ngOnInit(): void {
    sessionStorage.removeItem('SessionID');
    this.auctionSession$ = this.auctionSessionService.getAll().pipe(
      map((response: any) => {
        const sessions = response?.data?.sessions || [];
        return sessions.map((s: any) => ({
          ...s,
          TournamentName: s.Tournament?.Name || 'Not Linked'
        }));
      })
    );

  }

  tableColumn = [
    { key: 'SessionID', label: 'Session ID', searchable: true },
    { key: 'Name', label: 'Session Name', searchable: true },
    { key: 'TournamentName', label: 'Tournament', searchable: true },
    { key: 'StartDate', label: 'Start Date', date: { isDateTime: false } },
    { key: 'EndDate', label: 'End Date', date: { isDateTime: false } },
    {
      key: 'actions',
      label: 'Actions',
      actions: [
        { text: 'Manage', type: 'Manage', class: 'btn-outline-primary' },
        { text: 'Edit', type: 'Edit', class: 'btn-outline-info' },
        { text: 'Report', type: 'Report', class: 'btn-outline-success' },
        { text: 'Delete', type: 'Delete', class: 'btn-outline-danger ms-2' }
      ]
    }
  ]

  tableConfig: TableConfig = {
    height: '65vh',
    pageSize: 50,
    columns: this.tableColumn
  };


  handleAction(event: { type: string, row: any }) {
    if (event.type === 'Edit') {
      sessionStorage.setItem('SessionID', event.row.SessionID);
      this.router.navigate(['/kkk/auction-session-form'])
    } else if (event.type === 'Manage') {
      this.router.navigate(['/kkk/auction-session-detail', event.row.SessionID]);
    } else if (event.type === 'Report') {
      this.router.navigate(['/kkk/auction-report', event.row.SessionID]);
    } else if (event.type === 'Delete') {
      Swal.fire({
        title: 'Are you sure?',
        text: `You want to delete auction session "${event.row.Name}"?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Yes, delete it!'
      }).then((result) => {
        if (result.isConfirmed) {
          this.auctionSessionService.delete(event.row.SessionID).subscribe({
            next: () => {
              Swal.fire('Deleted!', 'The session has been deleted.', 'success');
              this.ngOnInit();
            },
            error: (err: any) => {
              Swal.fire('Error!', err.error?.message || 'Failed to delete session.', 'error');
            }
          });
        }
      });
    }
  }

  addSession() {
    this.router.navigate(['/kkk/auction-session-form'])
  }
}