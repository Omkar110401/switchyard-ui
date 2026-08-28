import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap, switchMap } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = 'http://localhost:8000';
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(this.hasToken());
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();
  public currentUser$ = new BehaviorSubject<any>(null);

  constructor(private http: HttpClient) {
    // Token restoration is handled by auth.initializer
  }

  signup(username: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/signup`, { username, password });
  }

  login(username: string, password: string): Observable<any> {
    console.log('[AuthService] Starting login for:', username);
    return this.http.post<any>(`${this.apiUrl}/auth/login`, { username, password }).pipe(
      tap((response: any) => {
        console.log('[AuthService] Login response:', { access_token: response?.access_token ? '***' : 'missing' });
      }),
      switchMap((response: any) => {
        const token = response?.access_token || response?.token;
        console.log('[AuthService] Token extracted:', !!token);
        if (token) {
          this.setToken(token);
          this.isAuthenticatedSubject.next(true);
          console.log('[AuthService] Token saved, fetching user info...');
          return this.getMe();
        }
        throw new Error('No token received');
      }),
      tap((user) => {
        console.log('[AuthService] User info received:', user?.username);
        this.currentUser$.next(user);
      })
    );
  }


  getMe(): Observable<any> {
    const token = this.getToken();
    console.log('[AuthService.getMe] Token present:', !!token);

    if (token) {
      const headers = new HttpHeaders({
        Authorization: `Bearer ${token}`,
      });
      console.log('[AuthService.getMe] Sending request with Authorization header');
      return this.http.get(`${this.apiUrl}/auth/me`, { headers });
    }

    console.log('[AuthService.getMe] No token, sending request without auth');
    return this.http.get(`${this.apiUrl}/auth/me`);
  }

  setToken(token: string): void {
    console.log('[AuthService] Setting token in localStorage');
    localStorage.setItem('auth_token', token);
    console.log('[AuthService] Token verified in localStorage:', !!localStorage.getItem('auth_token'));
  }

  getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  logout(): void {
    localStorage.removeItem('auth_token');
    this.currentUser$.next(null);
    this.isAuthenticatedSubject.next(false);
  }

  hasToken(): boolean {
    return !!this.getToken();
  }

  isAuthenticated(): boolean {
    return this.hasToken();
  }
}
