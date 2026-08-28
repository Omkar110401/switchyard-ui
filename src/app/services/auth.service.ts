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
    return this.http.post<any>(`${this.apiUrl}/auth/login`, { username, password }).pipe(
      switchMap((response: any) => {
        const token = response?.access_token || response?.token;
        if (token) {
          this.setToken(token);
          this.isAuthenticatedSubject.next(true);
          return this.getMe();
        }
        throw new Error('No token received');
      }),
      tap((user) => {
        this.currentUser$.next(user);
      })
    );
  }


  getMe(): Observable<any> {
    const token = this.getToken();

    if (token) {
      const headers = new HttpHeaders({
        Authorization: `Bearer ${token}`,
      });
      return this.http.get(`${this.apiUrl}/auth/me`, { headers });
    }

    return this.http.get(`${this.apiUrl}/auth/me`);
  }

  setToken(token: string): void {
    localStorage.setItem('auth_token', token);
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
