import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { DataTableComponent, TableConfig } from '@shared/components/data-table/data-table.component';
import { ButtonComponent } from '@shared/forms/form-controls';
import { map, Observable, tap } from 'rxjs';
import { TeamsService } from '../services/teams.service';
import { CommonModule } from '@angular/common';
import { environment } from '@environments/environment';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-teams',
  imports: [CommonModule, DataTableComponent],
  templateUrl: './teams.component.html',
  styleUrl: './teams.component.scss'
})
export class TeamsComponent implements OnInit {

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
        },
        {
          text: 'Delete', type: 'Delete', class: 'btn-outline-danger ms-2'
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
    } else if (event.type === 'Delete') {
      Swal.fire({
        title: 'Are you sure?',
        text: `You want to delete team "${event.row.Name}"?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Yes, delete it!'
      }).then((result) => {
        if (result.isConfirmed) {
          this.teamService.delete(event.row.TeamID).subscribe({
            next: () => {
              Swal.fire('Deleted!', 'The team has been deleted.', 'success');
              this.ngOnInit();
            },
            error: (err: any) => {
              Swal.fire('Error!', err.error?.message || 'Failed to delete team.', 'error');
            }
          });
        }
      });
    }
  }

  addPlayer() {
    this.router.navigate(['/kkk/teams-form'])
  }
}
