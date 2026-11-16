import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { tap } from 'rxjs';
import { API_URL } from './api-url';
import { LoginResponse, Session } from './models';

const storageKey = 'library.session';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly session = signal<Session | null>(this.read());

  readonly user = this.session.asReadonly();
  readonly isLoggedIn = computed(() => this.session() !== null);
  readonly isAdmin = computed(() => this.session()?.role === 'Admin');

  login(username: string, password: string) {
    return this.http.post<LoginResponse>(`${API_URL}/api/auth/login`, { username, password }).pipe(
      tap((response) => {
        const next: Session = {
          token: response.token,
          username: response.username,
          role: response.role,
        };
        localStorage.setItem(storageKey, JSON.stringify(next));
        this.session.set(next);
      }),
    );
  }

  logout() {
    localStorage.removeItem(storageKey);
    this.session.set(null);
  }

  token(): string | null {
    return this.session()?.token ?? null;
  }

  private read(): Session | null {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw) as Session;
      return parsed.token ? parsed : null;
    } catch {
      return null;
    }
  }
}
