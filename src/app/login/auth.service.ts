import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Router } from '@angular/router';
import { catchError, map, Observable, tap, throwError } from 'rxjs';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  code: string;
  expires_in: number;
  status: string;
}

export interface RefreshResponse {
  access_token: string;
  code: string;
  expires_in: number;
  status: string;
}

const TOKEN_KEY = 'korabo_access_token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  readonly token = signal<string | null>(localStorage.getItem(TOKEN_KEY));

  login(payload: LoginRequest) {
    return this.http
      .post<LoginResponse>(`${environment.apiUrl}/auth/login`, payload, { withCredentials: true })
      .pipe(tap((res) => this.setToken(res.access_token)));
  }

  verifyAuth(): Observable<true> {
    return this.http.get(`${environment.apiUrl}/user/user`).pipe(
      map(() => true as const),
      catchError((err) => {
        if (err.status === 401) {
          return this.refresh().pipe(
            map(() => true as const),
            catchError(() => {
              this.clearToken();
              return throwError(() => new Error('Session expired'));
            }),
          );
        }
        return throwError(() => err);
      }),
    );
  }

  refresh(): Observable<void> {
    return this.http
      .post<RefreshResponse>(`${environment.apiUrl}/auth/refresh`, {}, { withCredentials: true })
      .pipe(
        tap((res) => this.setToken(res.access_token)),
        map(() => void 0),
      );
  }

  logout(): Observable<void> {
    return this.http.post(`${environment.apiUrl}/auth/logout`, {}, { withCredentials: true }).pipe(
      tap(() => this.clearToken()),
      map(() => void 0),
      catchError((err) => {
        // Clear locally even if backend call fails
        this.clearToken();
        return throwError(() => err);
      }),
    );
  }

  setToken(token: string) {
    localStorage.setItem(TOKEN_KEY, token);
    this.token.set(token);
  }

  isAuthenticated(): boolean {
    return !!this.token();
  }

  private clearToken(): void {
    localStorage.removeItem(TOKEN_KEY);
    this.token.set(null);
    this.router.navigateByUrl('/login').then(() => {});
  }
}
