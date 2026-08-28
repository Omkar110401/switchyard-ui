import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export function initializeAuth() {
  const authService = inject(AuthService);

  return () => {
    console.log('[AuthInitializer] Checking for existing token...');

    const token = authService.getToken();
    if (token) {
      console.log('[AuthInitializer] Token found, fetching user info...');
      return new Promise<boolean>((resolve) => {
        authService.getMe().subscribe({
          next: (user) => {
            console.log('[AuthInitializer] User restored:', user.username);
            authService.currentUser$.next(user);
            resolve(true);
          },
          error: (error) => {
            console.log('[AuthInitializer] Token invalid, clearing session');
            authService.logout();
            resolve(false);
          },
        });
      });
    } else {
      console.log('[AuthInitializer] No token found');
      return Promise.resolve(false);
    }
  };
}
