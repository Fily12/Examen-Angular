import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

export const clientGuard: CanActivateFn = () => {
  const auth   = inject(AuthService);
  const router = inject(Router);
  if (auth.isLoggedIn() && auth.getRole() === 'Client') return true;
  router.navigate(['/login']);
  return false;
};
