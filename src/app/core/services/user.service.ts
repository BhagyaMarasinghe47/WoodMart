import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { User, UserRole, ApprovalStatus } from '../models/user.model';

interface ApiUser {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  city?: string;
  address?: string;
  roleId: number;
  userStatusId: number;
  createdAt: string;
  role?: { id: number; name: string };
  userStatus?: { id: number; name: string };
}

export interface AdminStatistics {
  totalProducts: number;
  totalOrders: number;
  revenue: number;
  pendingApprovals: number;
  totalCustomers: number;
  totalVendors: number;
  totalCraftsmen: number;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly apiUrl = `${environment.apiUrl}/users`;

  constructor(private http: HttpClient) {}

  getPendingUsers(): Observable<User[]> {
    return this.http.get<ApiUser[]>(`${this.apiUrl}/pending-approval`).pipe(
      map(users => users.map(u => this.mapApiUser(u))),
      catchError(() => of([]))
    );
  }

  getUsersByRole(roleId: number): Observable<User[]> {
    return this.http.get<ApiUser[]>(`${this.apiUrl}/role/${roleId}`).pipe(
      map(users => users.map(u => this.mapApiUser(u))),
      catchError(() => of([]))
    );
  }

  approveUser(userId: string): Observable<boolean> {
    return this.http.post<{ success: boolean }>(`${this.apiUrl}/${userId}/approve`, {}).pipe(
      map(res => res.success),
      catchError(() => of(false))
    );
  }

  rejectUser(userId: string): Observable<boolean> {
    return this.http.post<{ success: boolean }>(`${this.apiUrl}/${userId}/reject`, {}).pipe(
      map(res => res.success),
      catchError(() => of(false))
    );
  }

  deleteUser(userId: string): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.apiUrl}/${userId}`);
  }

  getStatistics(): Observable<AdminStatistics> {
    return forkJoin({
      roleStats: this.http.get<Record<string, number>>(`${this.apiUrl}/role-stats`).pipe(
        catchError(() => of({} as Record<string, number>))
      ),
      pending: this.getPendingUsers()
    }).pipe(
      map(({ roleStats, pending }) => ({
        totalProducts: 0,
        totalOrders: 0,
        revenue: 0,
        pendingApprovals: pending.length,
        totalCustomers: this.countByRoleName(roleStats, 'Customer'),
        totalVendors: this.countByRoleName(roleStats, 'Vendor'),
        totalCraftsmen: this.countByRoleName(roleStats, 'Craftsman')
      }))
    );
  }

  private countByRoleName(stats: Record<string, number>, roleName: string): number {
    const key = Object.keys(stats).find(k => k.toLowerCase() === roleName.toLowerCase());
    return key ? stats[key] : 0;
  }

  private mapApiUser(apiUser: ApiUser): User {
    const roleKey = this.mapRoleId(apiUser.roleId, apiUser.role?.name);
    const statusKey = this.mapStatusId(apiUser.userStatusId, apiUser.userStatus?.name);

    return {
      id: String(apiUser.id),
      email: apiUser.email,
      firstName: apiUser.firstName,
      lastName: apiUser.lastName,
      role: UserRole[roleKey as keyof typeof UserRole] ?? UserRole.CUSTOMER,
      approvalStatus: ApprovalStatus[statusKey as keyof typeof ApprovalStatus] ?? ApprovalStatus.PENDING,
      createdAt: new Date(apiUser.createdAt),
      phone: apiUser.phoneNumber || '',
      address: apiUser.address || undefined,
      city: apiUser.city || undefined
    };
  }

  private mapRoleId(roleId: number, roleName?: string): string {
    if (roleName) {
      return roleName.toUpperCase();
    }
    const map: Record<number, string> = {
      1: 'ADMIN',
      2: 'CRAFTSMAN',
      3: 'VENDOR',
      4: 'CUSTOMER'
    };
    return map[roleId] ?? 'CUSTOMER';
  }

  private mapStatusId(statusId: number, statusName?: string): string {
    if (statusName) {
      const normalized = statusName.toUpperCase();
      if (normalized === 'DISABLED') return 'REJECTED';
      return normalized;
    }
    const map: Record<number, string> = {
      1: 'APPROVED',
      2: 'PENDING',
      3: 'REJECTED',
      4: 'REJECTED'
    };
    return map[statusId] ?? 'PENDING';
  }
}
