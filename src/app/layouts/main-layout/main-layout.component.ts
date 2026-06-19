import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterModule } from '@angular/router';
import { BreadcrumbComponent } from 'app/layouts/breadcrumb/breadcrumb.component';
import { FooterComponent } from 'app/layouts/footer/footer.component';
import { HeaderComponent } from 'app/layouts/header/header.component';
import { SidebarComponent } from 'app/layouts/sidebar/sidebar.component';

@Component({
  selector: 'app-main-layout',
  imports: [
    MatSidenavModule,
    MatToolbarModule,
    RouterModule,
    FormsModule,
    HeaderComponent,
    SidebarComponent,
    CommonModule,
    BreadcrumbComponent],
  
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.scss'
})
export class MainLayoutComponent {
  sidebarOpen = true;
  constructor(private breakpointObserver: BreakpointObserver) {
    this.breakpointObserver.observe([Breakpoints.Handset]).subscribe(result => {
      this.sidebarOpen = !result.matches;
    });
  }

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
  }
}
