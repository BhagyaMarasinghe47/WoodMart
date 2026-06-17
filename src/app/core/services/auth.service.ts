import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { User, UserRole, ApprovalStatus } from '../models/user.model';
import { Router } from '@angular/router';

interface ApiUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  approvalStatus: string;
  phone?: string;
  profileImageUrl?: string;
}

interface LoginResponse {
  success: boolean;
  message: string;
  accessToken?: string;
  refreshToken?: string;
  user?: ApiUser;
}

interface RegisterResponse {
  success: boolean;
  message: string;
  user?: ApiUser;
}

interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  roleId: number;
  phoneNumber?: string;
  city?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUser: Observable<User | null>;
  private readonly STORAGE_KEY = 'woodmart_current_user';
  private readonly TOKEN_KEY = 'woodmart_token';
  private readonly REFRESH_TOKEN_KEY = 'woodmart_refresh_token';

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    const storedUser = localStorage.getItem(this.STORAGE_KEY);
    this.currentUserSubject = new BehaviorSubject<User | null>(
      storedUser ? JSON.parse(storedUser) : null
    );
    this.currentUser = this.currentUserSubject.asObservable();
  }

  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  public getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  public getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  login(email: string, password: string): Observable<User | null> {
    return this.http.post<LoginResponse>(
      `${environment.apiUrl}/auth/login`,
      { email, password }
    ).pipe(
      tap(response => {
        if (response.success && response.accessToken) {
          this.persistSession(response.accessToken, response.refreshToken, response.user, email);
        }
      }),
      map(response => {
        if (response.success && response.accessToken) {
          return this.mapApiUser(response.user, email);
        }
        throw new Error(response.message || 'Login failed.');
      }),
      catchError(error => {
        console.error('Login error:', error);
        const message =
          error?.error?.message ||
          error?.message ||
          'Login failed. Please check your email and password.';
        return throwError(() => new Error(message));
      })
    );
  }

  logout(): void {
    const refreshToken = this.getRefreshToken();
    if (refreshToken) {
      this.http.post(
        `${environment.apiUrl}/auth/logout`,
        { refreshToken }
      ).pipe(
        catchError(() => of(null))
      ).subscribe();
    }

    localStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  isAuthenticated(): boolean {
    return this.currentUserValue !== null && this.getToken() !== null;
  }

  hasRole(roles: UserRole[]): boolean {
    const user = this.currentUserValue;
    if (!user) return false;
    return roles.includes(user.role);
  }

  isApproved(): boolean {
    const user = this.currentUserValue;
    if (!user) return false;
    return user.approvalStatus === ApprovalStatus.APPROVED || user.role === UserRole.ADMIN;
  }

  getDashboardRoute(role: UserRole): string {
    switch (role) {
      case UserRole.ADMIN:
        return '/admin/dashboard';
      case UserRole.CRAFTSMAN:
        return '/craftsman/dashboard';
      case UserRole.VENDOR:
        return '/vendor/dashboard';
      case UserRole.CUSTOMER:
        return '/';
      default:
        return '/';
    }
  }

  refreshToken(): Observable<any> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      return of(null);
    }

    return this.http.post<{ accessToken: string; refreshToken?: string }>(
      `${environment.apiUrl}/auth/refresh-token`,
      { refreshToken }
    ).pipe(
      tap(response => {
        localStorage.setItem(this.TOKEN_KEY, response.accessToken);
        if (response.refreshToken) {
          localStorage.setItem(this.REFRESH_TOKEN_KEY, response.refreshToken);
        }
      }),
      catchError(() => {
        this.logout();
        return of(null);
      })
    );
  }

  uploadProfileImage(file: File): Observable<{ imageUrl: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ imageUrl: string }>(
      `${environment.apiUrl}/users/upload-profile-image`,
      formData
    );
  }

  updateProfile(userId: string, data: { firstName?: string; lastName?: string; phone?: string; city?: string; profileImageUrl?: string }): Observable<any> {
    return this.http.put<any>(
      `${environment.apiUrl}/users/${userId}/profile`,
      { firstName: data.firstName, lastName: data.lastName, phone: data.phone, city: data.city, profileImageUrl: data.profileImageUrl }
    ).pipe(
      tap(() => {
        const current = this.currentUserValue;
        if (current) {
          const updated: User = { ...current, ...data };
          localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updated));
          this.currentUserSubject.next(updated);
        }
      })
    );
  }

  register(userData: {
    firstName: string;
    lastName: string;
    email: string;
    contactNumber: string;
    password: string;
    cityArea?: string;
    role: 'CUSTOMER' | 'VENDOR' | 'CRAFTSMAN';
  }): Observable<{ success: boolean; message: string }> {
    const roleMap: { [key: string]: number } = {
      'CUSTOMER': 4,
      'VENDOR': 3,
      'CRAFTSMAN': 2,
      'ADMIN': 1
    };

    const registerRequest: RegisterRequest = {
      email: userData.email,
      password: userData.password,
      firstName: userData.firstName.trim(),
      lastName: userData.lastName.trim(),
      roleId: roleMap[userData.role] || 4,
      phoneNumber: userData.contactNumber,
      city: userData.cityArea
    };

    return this.http.post<RegisterResponse>(
      `${environment.apiUrl}/auth/register`,
      registerRequest
    ).pipe(
      map(response => ({
        success: response.success ?? true,
        message: response.message || 'Registration successful.'
      })),
      catchError(error => {
        console.error('Registration error:', error);
        const message = error.error?.message
          || (typeof error.error === 'string' ? error.error : null)
          || 'Registration failed. Please try again.';
        return of({ success: false, message });
      })
    );
  }

  private persistSession(
    accessToken: string,
    refreshToken: string | undefined,
    apiUser: ApiUser | undefined,
    fallbackEmail: string
  ): void {
    localStorage.setItem(this.TOKEN_KEY, accessToken);
    if (refreshToken) {
      localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
    }

    const user = this.mapApiUser(apiUser, fallbackEmail);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(user));
    this.currentUserSubject.next(user);
  }

  private mapApiUser(apiUser: ApiUser | undefined, fallbackEmail: string): User {
    const roleKey = (apiUser?.role || 'CUSTOMER').toUpperCase() as keyof typeof UserRole;
    const statusKey = (apiUser?.approvalStatus || 'APPROVED').toUpperCase() as keyof typeof ApprovalStatus;

    return {
      id: apiUser?.id ?? '',
      email: apiUser?.email ?? fallbackEmail,
      firstName: apiUser?.firstName || '',
      lastName: apiUser?.lastName || '',
      role: UserRole[roleKey] ?? UserRole.CUSTOMER,
      approvalStatus: ApprovalStatus[statusKey] ?? ApprovalStatus.APPROVED,
      createdAt: new Date(),
      phone: apiUser?.phone || '',
      profileImageUrl: apiUser?.profileImageUrl
    };
  }
}
