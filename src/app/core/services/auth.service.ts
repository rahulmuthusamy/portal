import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { ApiService } from './api.service'; 

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private tokenSubject = new BehaviorSubject<string | null>(null);
    private userSubject = new BehaviorSubject<any | null>(null);

    token$ = this.tokenSubject.asObservable();
    user$ = this.userSubject.asObservable();

    constructor(private api: ApiService, private router: Router) { }

    login(credentials: any): Observable<any> {
        return this.api.post('/auth/login', credentials).pipe(
            tap((res: any) => {
                this.setSession(res.token, res.user);
            })
        );
    }

    restoreSession(): Observable<any> {
        return this.api.post('/auth/refresh', {}, { withCredentials: true }).pipe(
            tap((res: any) => {
                this.setSession(res?.accessToken, res);
            })
        );
    }

    logout(): void {
        this.tokenSubject.next(null);
        this.userSubject.next(null);
        this.api.post('/auth/logout', {}).subscribe(() => {
            this.router.navigate(['/login']);
        });
    }

    setSession(token: string, user: any): void {
        this.tokenSubject.next(token);
        this.userSubject.next(user);
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
