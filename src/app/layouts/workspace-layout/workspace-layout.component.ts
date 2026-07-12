import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { CommonModule } from '@angular/common';
import { Component, HostBinding } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { BreadcrumbComponent } from 'app/layouts/breadcrumb/breadcrumb.component';
import { HeaderComponent } from 'app/layouts/header/header.component';
import { WorkspaceSidebarComponent } from '../workspace-sidebar/workspace-sidebar.component';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-workspace-layout',
  standalone: true,
  imports: [
    MatSidenavModule,
    MatToolbarModule,
    RouterModule,
    FormsModule,
    HeaderComponent,
    WorkspaceSidebarComponent,
    CommonModule,
    BreadcrumbComponent
  ],
  templateUrl: './workspace-layout.component.html',
  styleUrl: './workspace-layout.component.scss'
})
export class WorkspaceLayoutComponent {
  sidebarOpen = true;
  isMobile = false;
  isDarkRoom = false;

  @HostBinding('class.dark-room-mode') get darkRoomClass() { return this.isDarkRoom; }

  constructor(private breakpointObserver: BreakpointObserver, private router: Router) {
    this.breakpointObserver.observe([Breakpoints.Handset]).subscribe(result => {
      this.isMobile = result.matches;
      this.sidebarOpen = !result.matches;
    });

    this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe((e: any) => {
      this.isDarkRoom = e.urlAfterRedirects?.includes('/live-room');
    });

    // Also check on initial load
    this.isDarkRoom = this.router.url?.includes('/live-room');
  }

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
  }

  closeSidebarOnMobile() {
    if (this.isMobile && this.sidebarOpen) {
      this.sidebarOpen = false;
    }
  }
}
