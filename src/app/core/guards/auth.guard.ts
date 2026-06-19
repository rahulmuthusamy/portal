import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '@core/services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
    const auth = inject(AuthService);
    const router = inject(Router);

    if (auth.isLoggedIn()) {
        const currentUser = auth.getUser();
        // If owner tries to access /kkk routes, kick them to /auction-live
        if (currentUser && currentUser.Role === 'owner' && state.url.startsWith('/kkk')) {
            router.navigate(['/auction-live']);
            return false;
        }
        return true;
    }

    router.navigate(['/login']);
    return false;
};
