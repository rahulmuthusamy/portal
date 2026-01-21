import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { DataTableComponent, TableConfig } from '@shared/components/data-table/data-table.component';
import { ButtonComponent } from '@shared/forms/form-controls';
import { map, Observable } from 'rxjs';
import { TeamsService } from '../services/teams.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-teams',
  imports: [CommonModule, ButtonComponent, DataTableComponent],
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
      map((response: any) => response?.data?.teams || [])
    );

  }

  tableColumn = [
    { key: 'TeamID', label: 'Team ID', searchable: true },
    { key: 'Name', label: 'Team Name', searchable: true },
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
      this.router.navigate(['teams-form']);
    }
  }

  addPlayer() {
    this.router.navigate(['/teams-form'])
  }
}
