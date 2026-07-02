import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterModule } from '@angular/router';
import { AuthService } from '@core/services/auth.service';
import { SettingsService } from '@core/services/settings.service';
import { environment } from '@environments/environment';

@Component({
  selector: 'app-sidebar',
  imports: [CommonModule, MatListModule, FormsModule, RouterModule, MatIconModule, MatTooltipModule],

  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent implements OnInit {
  @Input() visible = true;
  private auth = inject(AuthService);
  private settingsService = inject(SettingsService);
  user$ = this.auth.user$;
  
  appSettings: any = {
    appName: 'Eriyur Champion League',
    logoUrl: null
  };

  menuSections = [
    {
      label: 'Overview',
      items: [
        { label: 'Pending Approvals', route: '/kkk/pending-owners', icon: 'how_to_reg', roles: ['super_admin', 'admin'] },
        { label: 'Players', route: '/kkk/players-list', icon: 'people', roles: ['super_admin', 'admin', 'owner', 'member'] },
        { label: 'Teams', route: '/kkk/teams-list', icon: 'shield', roles: ['super_admin', 'admin', 'owner', 'member'] },
        { label: 'Tournaments', route: '/kkk/tournaments-list', icon: 'sports_cricket', roles: ['super_admin', 'admin'] }
      ]
    },
    {
      label: 'Auction',
      items: [
        { label: 'Auction Session', route: '/kkk/auction-session-list', icon: 'gavel', roles: ['super_admin', 'admin'] },
        { label: 'Register Player', route: '/kkk/auction-player-register', icon: 'person_add', roles: ['super_admin', 'admin'] },
        // { label: 'Live Room (Admin)', route: '/kkk/auction-room', icon: 'live_tv', roles: ['super_admin', 'admin'] },
        { label: 'Team Dashboard (Owner)', route: '/kkk/team-dashboard', icon: 'group_work', roles: ['owner'] }
      ]
    },
    {
      label: 'Settings',
      items: [
        { label: 'Settings', route: '/kkk/settings', icon: 'settings', roles: ['super_admin', 'admin'] }
      ]
    }
  ];

  filteredMenu: any[] = [];

  ngOnInit() {
    this.user$.subscribe(user => {
      this.filteredMenu = this.getFilteredMenu(user?.role);
    });
    this.loadSettings();
  }

  loadSettings(): void {
    this.settingsService.getAppSettings().subscribe((res: any) => {
      if (res.success && res.data?.settings) {
        const s = res.data.settings;
        this.appSettings = {
          appName: s.AppName || 'Eriyur Champion League',
          logoUrl: s.AppLogoURL ? environment.apiUrl + s.AppLogoURL : null
        };
      }
    });
  }

  getFilteredMenu(role: string | undefined) {
    if (!role) return [];
    return this.menuSections.map(section => ({
      ...section,
      items: section.items.filter(item => !item.roles || item.roles.includes(role))
    })).filter(section => section.items.length > 0);
  }
}
