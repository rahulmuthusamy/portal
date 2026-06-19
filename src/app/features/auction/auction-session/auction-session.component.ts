import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { map, Observable } from 'rxjs';
import { AuctionSessionService } from '../services/auction-session.service';
import { DataTableComponent, TableConfig } from '@shared/components/data-table/data-table.component';
import { CommonModule } from '@angular/common';
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
      map((response: any) => response?.data?.sessions || [])
    );

  }

  tableColumn = [
    { key: 'SessionID', label: 'Session ID', searchable: true },
    { key: 'Name', label: 'Session Name', searchable: true },
    { key: 'StartDate', label: 'Start Date', date: { isDateTime: false } },
    { key: 'EndDate', label: 'End Date', date: { isDateTime: false } },
    {
      key: 'actions',
      label: 'Actions',
      actions: [
        { text: 'Manage', type: 'Manage', class: 'btn-outline-primary' },
        { text: 'Edit', type: 'Edit', class: 'btn-outline-info' },
        { text: 'Report', type: 'Report', class: 'btn-outline-success' }
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
    }
  }

  addSession() {
    this.router.navigate(['/kkk/auction-session-form'])
  }
}