import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterModule, ActivatedRoute, Router, NavigationEnd } from '@angular/router';
import { AuthService } from '@core/services/auth.service';
import { SettingsService } from '@core/services/settings.service';
import { environment } from '@environments/environment';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-workspace-sidebar',
  imports: [CommonModule, MatListModule, FormsModule, RouterModule, MatIconModule, MatTooltipModule],
  templateUrl: './workspace-sidebar.component.html',
  styleUrl: './workspace-sidebar.component.scss'
})
export class WorkspaceSidebarComponent implements OnInit {
  @Input() visible = true;
  private auth = inject(AuthService);
  private settingsService = inject(SettingsService);
  private router = inject(Router);
  user$ = this.auth.user$;
  
  sessionId: string = '';

  appSettings: any = {
    appName: 'Auction Workspace',
    logoUrl: null
  };

  menuSections: any[] = [];
  filteredMenu: any[] = [];

  ngOnInit() {
    // Extract session ID from the URL path since the sidebar isn't directly in the route tree
    this.extractSessionId(this.router.url);

    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.extractSessionId(event.urlAfterRedirects);
    });

    this.user$.subscribe(user => {
      this.updateMenu();
      this.filteredMenu = this.getFilteredMenu(user?.role);
    });
    this.loadSettings();
  }

  extractSessionId(url: string) {
    const match = url.match(/\/workspace\/([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      this.sessionId = match[1];
      this.updateMenu();
      this.user$.subscribe(user => {
        this.filteredMenu = this.getFilteredMenu(user?.role);
      });
    }
  }

  updateMenu() {
    this.menuSections = [
      {
        label: 'Workspace',
        items: [
          { label: 'Dashboard', route: `/workspace/${this.sessionId}/dashboard`, icon: 'dashboard', roles: ['super_admin', 'owner', 'member'] },
          { label: 'Players', route: `/workspace/${this.sessionId}/players`, icon: 'people', roles: ['super_admin', 'owner', 'member'] },
          { label: 'Teams', route: `/workspace/${this.sessionId}/teams`, icon: 'shield', roles: ['super_admin', 'owner', 'member'] }
        ]
      },
      {
        label: 'Live Operations',
        items: [
          { label: 'Live Control Room', route: `/workspace/${this.sessionId}/live-room`, icon: 'live_tv', roles: ['super_admin', 'owner'] }
        ]
      },
      {
        label: 'Approvals',
        items: [
          { label: 'Pending Players', route: `/workspace/${this.sessionId}/pending-players`, icon: 'person_add', roles: ['super_admin'] },
          { label: 'Franchise Players', route: `/workspace/${this.sessionId}/franchise-players`, icon: 'person_add', roles: ['super_admin'] }

        ]
      }
    ];
  }

  loadSettings(): void {
    this.settingsService.getAppSettings().subscribe((res: any) => {
      if (res.success && res.data?.settings) {
        const s = res.data.settings;
        this.appSettings = {
          appName: 'Auction Workspace',
          logoUrl: s.AppLogoURL ? environment.apiUrl + s.AppLogoURL : null
        };
      }
    });
  }

  getFilteredMenu(role: string | undefined) {
    if (!role) return [];
    return this.menuSections.map(section => ({
      ...section,
      items: section.items.filter((item: any) => !item.roles || item.roles.includes(role))
    })).filter(section => section.items.length > 0);
  }
}
