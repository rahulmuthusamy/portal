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
      title: 'Overview',
      items: [
        { label: 'Dashboard', route: '/dashboard', icon: 'dashboard' },
        { label: 'Players', route: '/players-list', icon: 'group' },
        { label: 'Teams', route: '/teams-list', icon: 'group' },
        { label: 'Auction Session', route: '/auction-session-list', icon: 'person' },
        { label: 'Auction Room', route: '/auction-room', icon: 'settings' },
        { label: 'Auction Dashboard', route: '/team-dashboard', icon: 'settings' },
        { label: 'Sample page', route: '/sample-page', icon: 'settings' },
      ]
    }
  ];
}
