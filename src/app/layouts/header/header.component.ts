import { Component, Output, EventEmitter } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { CommonModule, DOCUMENT } from '@angular/common';
import { Inject } from '@angular/core';
import { MatMenuModule } from '@angular/material/menu';

@Component({
  selector: 'app-header',
  
  imports: [
    CommonModule,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatMenuModule
  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {
  @Output() toggleSidebar = new EventEmitter<void>();
  currentTheme: 'light-theme' | 'dark-theme' = 'light-theme';

  constructor(@Inject(DOCUMENT) private document: Document) { }

  toggleTheme(theme: 'light-theme' | 'dark-theme') {
    this.document.body.classList.remove('light-theme', 'dark-theme');
    this.document.body.classList.add(theme);
    this.currentTheme = theme;
  }
}
