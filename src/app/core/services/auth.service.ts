import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { ApiService } from './api.service'; 

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private readonly TOKEN_KEY = 'auth_token';
    private readonly USER_KEY = 'auth_user';

    private tokenSubject = new BehaviorSubject<string | null>(null);
    private userSubject = new BehaviorSubject<any | null>(null);

    token$ = this.tokenSubject.asObservable();
    user$ = this.userSubject.asObservable();

    constructor(private api: ApiService, private router: Router) {
        const savedToken = localStorage.getItem(this.TOKEN_KEY);
        const savedUser = localStorage.getItem(this.USER_KEY);

        if (savedToken) {
            this.tokenSubject.next(savedToken);
        }

        if (savedUser) {
            this.userSubject.next(JSON.parse(savedUser));
        }
    }

    login(credentials: any): Observable<any> {
        return this.api.post('/auth/login', credentials).pipe(
            tap((res: any) => {
                const token = res?.data?.accessToken ?? res?.accessToken ?? null;
                const user = res?.data?.user ?? res?.user ?? null;
                this.setSession(token, user);
            })
        );
    }

    register(data: any): Observable<any> {
        return this.api.post('/auth/register', data);
    }

    restoreSession(): Observable<any> {
        return this.api.post('/auth/refresh', {}, { withCredentials: true }).pipe(
            tap((res: any) => {
                const token = res?.data?.accessToken ?? res?.accessToken ?? null;
                const user = res?.data?.user ?? res?.user ?? null;
                this.setSession(token, user);
            })
        );
    }

    logout(): void {
    this.setSession(null, null);
    this.api.post('/auth/logout', {}).subscribe({
      next: () => this.router.navigate(['/login']),
      error: () => this.router.navigate(['/login'])
    });
  }

    setSession(token: string | null, user: any): void {
        this.tokenSubject.next(token);
        this.userSubject.next(user);

        if (token) {
            localStorage.setItem(this.TOKEN_KEY, token);
        } else {
            localStorage.removeItem(this.TOKEN_KEY);
        }

        if (user) {
            localStorage.setItem(this.USER_KEY, JSON.stringify(user));
        } else {
            localStorage.removeItem(this.USER_KEY);
        }
    }

    getToken(): string | null {
        return this.tokenSubject.value;
    }

    getUser(): any | null {
        return this.userSubject.value;
    }

    isLoggedIn(): boolean {
        return !!this.getToken();
    }
}
