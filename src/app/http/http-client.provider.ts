import { HttpClient, HttpEvent, HttpHandler, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Injectable({ providedIn: 'root' })
export class AuthHttpHandler implements HttpHandler {
  constructor(private authService: AuthService, private httpHandler: HttpHandler) {}

  handle(req: HttpRequest<any>): Observable<HttpEvent<any>> {
    const token = this.authService.getToken();
    console.log(`[AuthHttpHandler] ${req.method} ${req.url} - Token: ${!!token}`);

    if (token) {
      req = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
        },
      });
      console.log(`[AuthHttpHandler] Token attached`);
    }

    return this.httpHandler.handle(req);
  }
}
