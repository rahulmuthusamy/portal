import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '@core/services/auth.service';
import { catchError, switchMap, throwError } from 'rxjs';

let isRefreshing = false;

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const auth = inject(AuthService);

    const token = auth.getToken();
    const authReq = token
        ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
        : req;

    return next(authReq).pipe(
        catchError(error => {
            if (error.status === 401) {
                if (isRefreshing) {
                    return throwError(() => error);
                }
                isRefreshing = true;
                return auth.restoreSession().pipe(
                    switchMap(() => {
                        isRefreshing = false;
                        const newToken = auth.getToken();
                        const retryReq = newToken
                            ? req.clone({ setHeaders: { Authorization: `Bearer ${newToken}` } })
                            : req;
                        return next(retryReq);
                    }),
                    catchError(err => {
                        isRefreshing = false;
                        auth.logout();
                        return throwError(() => err);
                    })
                );
            }

            return throwError(() => error);
        })
    );
};
