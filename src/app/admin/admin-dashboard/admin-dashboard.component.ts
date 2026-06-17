import { Component, OnInit } from '@angular/core';
import { UserService, AdminStatistics } from '../../core/services/user.service';
import { AuthService } from '../../core/services/auth.service';
import { User } from '../../core/models/user.model';
import { ToastService } from '../../core/services/toast.service';
import { ConfirmDialogService } from '../../core/services/confirm-dialog.service';

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css']
})
export class AdminDashboardComponent implements OnInit {
  statistics: AdminStatistics = {
    totalProducts: 0,
    totalOrders: 0,
    revenue: 0,
    pendingApprovals: 0,
    totalCustomers: 0,
    totalVendors: 0,
    totalCraftsmen: 0
  };
  pendingUsers: User[] = [];
  loading = true;
  errorMessage = '';

  constructor(
    private userService: UserService,
    private authService: AuthService,
    private toast: ToastService,
    private confirmDialog: ConfirmDialogService
  ) { }

  ngOnInit(): void {
    this.loadDashboard();
  }

  loadDashboard(): void {
    this.loading = true;
    this.errorMessage = '';

    this.userService.getStatistics().subscribe({
      next: (stats) => {
        this.statistics = stats;
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'Failed to load dashboard statistics.';
        this.loading = false;
      }
    });

    this.loadPendingUsers();
  }

  loadPendingUsers(): void {
    this.userService.getPendingUsers().subscribe({
      next: (users) => {
        this.pendingUsers = users;
        this.statistics.pendingApprovals = users.length;
      },
      error: () => {
        this.errorMessage = 'Failed to load pending users.';
      }
    });
  }

  approveUser(userId: string): void {
    this.confirmDialog.confirm('Approve this user?', 'Approve', 'Cancel').then(confirmed => {
      if (!confirmed) return;
      this.userService.approveUser(userId).subscribe({
        next: (success) => {
          if (success) {
            this.toast.success('User approved successfully!');
            this.loadDashboard();
          } else {
            this.toast.error('Failed to approve user.');
          }
        }
      });
    });
  }

  rejectUser(userId: string): void {
    this.confirmDialog.confirm('Reject this user?', 'Reject', 'Cancel').then(confirmed => {
      if (!confirmed) return;
      this.userService.rejectUser(userId).subscribe({
        next: (success) => {
          if (success) {
            this.toast.success('User rejected.');
            this.loadDashboard();
          } else {
            this.toast.error('Failed to reject user.');
          }
        }
      });
    });
  }

  logout(): void {
    this.authService.logout();
  }
}
