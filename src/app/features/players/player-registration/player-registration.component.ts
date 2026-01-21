import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonComponent, SHARED_FORM_COMPONENTS } from '@shared/forms/form-controls';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatCardModule } from '@angular/material/card';
import { DataTableComponent, TableConfig } from '@shared/components/data-table/data-table.component';
import { Router } from '@angular/router';
import { PlayerService } from '../services/players.service';
import { BehaviorSubject, map, Observable } from 'rxjs';
import { Player } from '../models/player.model';

@Component({
  selector: 'app-registration',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DataTableComponent,
    ButtonComponent
  ],
  templateUrl: './player-registration.component.html',
  styleUrl: './player-registration.component.scss'
})
export class PlayerRegistrationComponent implements OnInit {
  constructor(
    private router: Router,
    private playerService: PlayerService

  ) { }

  players$!: Observable<Player[]>;

  ngOnInit(): void {
    this.players$ = this.playerService.getAll().pipe(
      map((response: any) => response?.data?.players || [])
    );

  }

  tableColumn = [
    { key: 'PlayerID', label: 'Player ID', searchable: true },
    { key: 'Name', label: 'Player Name', searchable: true },
    { key: 'FatherName', label: 'Father Name', searchable: true },
    { key: 'Mobile', label: 'Mobile Number', searchable: true },
    { key: 'Role', label: 'Role' },
    // {
    //   key: 'ScheduleStatus',
    //   label: 'Status',
    //   searchable: true,
    //   render: (row: any) => {
    //     const status = row['ScheduleStatus'];
    //     const classMap: Record<string, string> = {
    //       'Invitations Sent': 'bg-secondary',
    //       'New': 'bg-primary',
    //       'Inprogress': 'bg-warning text-dark',
    //       'Confirmation sent': 'bg-info',
    //       'Complete': 'bg-success'
    //     };
    //     const badgeClass = classMap[status] || 'bg-light text-dark';
    //     return `<span class="badge ${badgeClass}">${status}</span>`;
    //   }
    // },
    {
      key: 'actions',
      label: 'Actions',
      actions: [
        {
          text: 'Edit', type: 'Edit', class: 'btn-outline-info'
        }
      ]
    }
  ]

  tableConfig: TableConfig = {
    height: '65vh',
    pageSize: 50,
    columns: this.tableColumn
  };


  handleAction(event: { type: string, row: any }) {
    if (event.type === 'View' || event.type === 'Edit') {
      console.log('View/Edit clicked', event.row);

      this.router.navigate([`/registration-form-edit/${event.row.PlayerID}`]);
    }
  }


  addPlayer() {
    this.router.navigate(['/registration-form'])
  }
}
