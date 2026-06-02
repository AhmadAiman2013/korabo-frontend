import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  // No token at all — skip the network call entirely
  if (!auth.isAuthenticated()) {
    return router.createUrlTree(['/login']);
  }

  // Token exists — verify with backend, attempt refresh on 401
  return auth.verifyAuth().pipe(
    map(() => true),
    catchError(() => of(router.createUrlTree(['/login']))),
  );
};
