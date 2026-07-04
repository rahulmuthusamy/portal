import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '@core/services/auth.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-account',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, MatButtonModule],
  template: `
    <div class="p-6 max-w-4xl mx-auto">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 class="text-2xl font-bold text-slate-900">My Profile</h1>
          <p class="text-sm text-slate-500">View your account details and quick links.</p>
        </div>
        <a routerLink="/kkk/settings" class="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-slate-200 text-slate-700 hover:bg-slate-50 transition">
          <mat-icon>settings</mat-icon>
          <span>Open Settings</span>
        </a>
      </div>

      <div class="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
        <div class="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div class="w-20 h-20 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center text-3xl font-bold">
            {{ (user$ | async)?.email?.charAt(0)?.toUpperCase() || 'A' }}
          </div>
          <div>
            <p class="text-sm text-slate-500 uppercase tracking-[0.18em] font-semibold">Signed in as</p>
            <h2 class="text-xl font-bold text-slate-900">{{ (user$ | async)?.name || (user$ | async)?.email || 'Admin' }}</h2>
            <p class="text-sm text-slate-500 mt-1">{{ (user$ | async)?.email || 'No email available' }}</p>
          </div>
        </div>

        <div class="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div class="rounded-2xl border border-slate-200 p-4 bg-slate-50">
            <p class="text-xs uppercase text-slate-500 tracking-[0.18em]">Role</p>
            <p class="mt-2 text-lg font-semibold text-slate-900">{{ (user$ | async)?.role || 'Administrator' }}</p>
          </div>
          <div class="rounded-2xl border border-slate-200 p-4 bg-slate-50">
            <p class="text-xs uppercase text-slate-500 tracking-[0.18em]">Status</p>
            <p class="mt-2 text-lg font-semibold text-slate-900">{{ (user$ | async)?.status || 'Active' }}</p>
          </div>
          <div class="rounded-2xl border border-slate-200 p-4 bg-slate-50">
            <p class="text-xs uppercase text-slate-500 tracking-[0.18em]">Member since</p>
            <p class="mt-2 text-lg font-semibold text-slate-900">{{ (user$ | async)?.createdAt ? ((user$ | async)?.createdAt | date:'mediumDate') : 'Unknown' }}</p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `:host { display: block; font-family: 'Inter', sans-serif; }
     a { text-decoration: none; }
    `
  ]
})
export class AccountComponent {
  private auth = inject(AuthService);
  user$: Observable<any> = this.auth.user$;
}
