import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { User, UserRole, ApprovalStatus } from '../models/user.model';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUser: Observable<User | null>;
  private readonly STORAGE_KEY = 'woodmart_current_user';

  constructor(private router: Router) {
    const storedUser = localStorage.getItem(this.STORAGE_KEY);
    this.currentUserSubject = new BehaviorSubject<User | null>(
      storedUser ? JSON.parse(storedUser) : null
    );
    this.currentUser = this.currentUserSubject.asObservable();
  }

  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  // Mock user database
  private mockUsers: User[] = [
    {
      id: '1',
      email: 'admin@woodmart.com',
      password: 'admin123',
      firstName: 'Admin',
      lastName: 'User',
      role: UserRole.ADMIN,
      approvalStatus: ApprovalStatus.APPROVED,
      createdAt: new Date(),
      phone: '+1234567890'
    },
    {
      id: '2',
      email: 'craftsman@woodmart.com',
      password: 'craft123',
      firstName: 'John',
      lastName: 'Carpenter',
      role: UserRole.CRAFTSMAN,
      approvalStatus: ApprovalStatus.APPROVED,
      createdAt: new Date(),
      phone: '+1234567891'
    },
    {
      id: '3',
      email: 'vendor@woodmart.com',
      password: 'vendor123',
      firstName: 'Jane',
      lastName: 'Vendor',
      role: UserRole.VENDOR,
      approvalStatus: ApprovalStatus.APPROVED,
      createdAt: new Date(),
      phone: '+1234567892'
    },
    {
      id: '4',
      email: 'customer@woodmart.com',
      password: 'customer123',
      firstName: 'Bob',
      lastName: 'Customer',
      role: UserRole.CUSTOMER,
      approvalStatus: ApprovalStatus.APPROVED,
      createdAt: new Date(),
      phone: '+1234567893',
      address: '123 Main St, City, Country'
    }
  ];

  // Simulate API login with delay
  login(email: string, password: string): Observable<User | null> {
    const user = this.mockUsers.find(u => u.email === email && u.password === password);
    
    if (user) {
      // Check approval status
      if (user.approvalStatus !== ApprovalStatus.APPROVED && user.role !== UserRole.ADMIN) {
        return of(null).pipe(delay(500));
      }

      // Don't store password in localStorage
      const userToStore = { ...user };
      delete userToStore.password;
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(userToStore));
      this.currentUserSubject.next(userToStore);
      return of(userToStore).pipe(delay(500));
    }
    
    return of(null).pipe(delay(500));
  }

  logout(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  isAuthenticated(): boolean {
    return this.currentUserValue !== null;
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

  // Get dashboard route based on role
  getDashboardRoute(role: UserRole): string {
    switch (role) {
      case UserRole.ADMIN:
        return '/admin/dashboard';
      case UserRole.CRAFTSMAN:
        return '/craftsman/dashboard';
      case UserRole.VENDOR:
        return '/vendor/dashboard';
      case UserRole.CUSTOMER:
        return '/customer/dashboard';
      default:
        return '/';
    }
  }
}
