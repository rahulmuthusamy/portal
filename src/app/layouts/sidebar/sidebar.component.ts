import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterModule } from '@angular/router';
@Component({
  selector: 'app-sidebar',
  imports: [CommonModule, MatListModule, FormsModule, RouterModule, MatIconModule, MatTooltipModule],

  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent {
  @Input() visible = true;

  menuSections = [
    {
      label: 'Overview',
      items: [
        { label: 'Dashboard', route: '/kkk/dashboard', icon: 'dashboard' },
        { label: 'Players', route: '/kkk/players-list', icon: 'group' },
        { label: 'Teams', route: '/kkk/teams-list', icon: 'group' },
        // { label: 'Sponsers', route: '/kkk/sponsers-list', icon: 'settings' },
        { label: 'Auction Session', route: '/kkk/auction-session-list', icon: 'person' },
        { label: 'Auction Room', route: '/kkk/auction-room', icon: 'settings' },
        { label: 'Auction Dashboard', route: '/kkk/team-dashboard', icon: 'settings' },
        { label: 'Sample page', route: '/kkk/sample-page', icon: 'settings' },
        { label: 'Settings', route: '/kkk/settings', icon: 'settings' },
      ]
    }
  ];
}
