import { Component, inject } from '@angular/core';
import { LoginComponent } from '../login/login.component';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '@core/services/auth.service';

@Component({
  selector: 'app-auth-layout',
  imports: [LoginComponent, CommonModule],
  templateUrl: './auth-layout.component.html',
  styleUrl: './auth-layout.component.scss'
})
export class AuthLayoutComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  constructor() {
    if (this.auth.isLoggedIn()) {
      this.router.navigate(['/kkk/players-list']);
    }
  }
}