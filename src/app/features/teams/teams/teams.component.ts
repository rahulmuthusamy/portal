import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { DataTableComponent, TableConfig } from '@shared/components/data-table/data-table.component';
import { ButtonComponent } from '@shared/forms/form-controls';
import { map, Observable, tap } from 'rxjs';
import { TeamsService } from '../services/teams.service';
import { CommonModule } from '@angular/common';
import { environment } from '@environments/environment';

@Component({
  selector: 'app-teams',
  imports: [CommonModule, DataTableComponent],
  templateUrl: './teams.component.html',
  styleUrl: './teams.component.scss'
})
export class TeamsComponent {

  constructor(
    private router: Router,
    private teamService: TeamsService

  ) { }

  teams$!: Observable<any[]>;

  ngOnInit(): void {
    sessionStorage.removeItem('TeamID');
    this.teams$ = this.teamService.getAll().pipe(
      map((response: any) => response?.data?.teams || []),
      tap((teams: any) => teams.forEach((team: any) => {
        team.LogoURL = team.LogoURL ? environment.apiUrl + team.LogoURL : '';
      }))
    );

  }

  tableColumn = [
    { key: 'LogoURL', label: 'Team Logo', type: 'image' },
    { key: 'Name', label: 'Team Name', searchable: true },
    { key: 'Captain', label: 'Captain', searchable: true },
    { key: 'Founded', label: 'Founded', searchable: true },
    { key: 'Location', label: 'Location', searchable: true },
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
    if (event.type === 'Edit') {
      sessionStorage.setItem('TeamID', event.row.TeamID);
      this.router.navigate(['/kkk/teams-form']);
    }
  }

  addPlayer() {
    this.router.navigate(['/kkk/teams-form'])
  }
}
