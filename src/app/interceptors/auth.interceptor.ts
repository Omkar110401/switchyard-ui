import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class AuthInterceptor implements HttpInterceptor {
  constructor(private authService: AuthService, private router: Router) {
    console.log('[AuthInterceptor] Constructor called - interceptor initialized');
  }

  intercept(
    request: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    console.log(`[AuthInterceptor.intercept] CALLED for ${request.method} ${request.url}`);

    const token = this.authService.getToken();
    console.log(`[AuthInterceptor] Token from storage:`, {
      hasToken: !!token,
      tokenPreview: token ? token.substring(0, 20) + '...' : 'none',
    });

    let modifiedRequest = request;
    if (token) {
      console.log(`[AuthInterceptor] Cloning request and adding Authorization header`);
      modifiedRequest = request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
        },
      });
    } else {
      console.log(`[AuthInterceptor] No token found, request sent without Authorization`);
    }

    return next.handle(modifiedRequest).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error(`[AuthInterceptor] Error response: ${error.status} ${error.statusText}`);
        if (error.status === 401) {
          console.log('[AuthInterceptor] Got 401 - logging out user');
          this.authService.logout();
          this.router.navigate(['/login']);
        }
        return throwError(() => error);
      })
    );
  }
}
