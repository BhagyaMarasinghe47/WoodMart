import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { UserService } from '../../core/services/user.service';
import { User, UserRole, ApprovalStatus } from '../../core/models/user.model';
import { forkJoin } from 'rxjs';
import { ToastService } from '../../core/services/toast.service';
import { ConfirmDialogService } from '../../core/services/confirm-dialog.service';

interface UserDetails extends User {
  location?: string;
  shopName?: string;
  shopRegNumber?: string;
  businessLicense?: string;
  taxId?: string;
  district?: string;
  postalCode?: string;
  specialization?: string;
  experience?: number;
  certifications?: string[];
  portfolio?: string;
}

@Component({
  selector: 'app-user-management',
  templateUrl: './user-management.component.html',
  styleUrls: ['./user-management.component.css']
})
export class UserManagementComponent implements OnInit {
  allUsers: UserDetails[] = [];
  filteredUsers: UserDetails[] = [];
  selectedTab: UserRole = UserRole.CUSTOMER;
  searchQuery = '';
  selectedUser: UserDetails | null = null;
  showDetailsModal = false;
  loading = true;
  errorMessage = '';

  UserRole = UserRole;

  customers: UserDetails[] = [];
  vendors: UserDetails[] = [];
  craftsmen: UserDetails[] = [];

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private toast: ToastService,
    private confirmDialog: ConfirmDialogService
  ) {}

  ngOnInit(): void {
    this.loadAllUsers();
  }

  loadAllUsers(): void {
    this.loading = true;
    this.errorMessage = '';

    forkJoin({
      customers: this.userService.getUsersByRole(4),
      vendors: this.userService.getUsersByRole(3),
      craftsmen: this.userService.getUsersByRole(2)
    }).subscribe({
      next: ({ customers, vendors, craftsmen }) => {
        this.customers = customers as UserDetails[];
        this.vendors = vendors as UserDetails[];
        this.craftsmen = craftsmen as UserDetails[];
        this.allUsers = [...this.customers, ...this.vendors, ...this.craftsmen];
        this.loading = false;
        this.filterByTab(this.selectedTab);
      },
      error: () => {
        this.errorMessage = 'Failed to load users.';
        this.loading = false;
      }
    });
  }

  filterByTab(role: UserRole): void {
    this.selectedTab = role;

    switch (role) {
      case UserRole.CUSTOMER:
        this.filteredUsers = [...this.customers];
        break;
      case UserRole.VENDOR:
        this.filteredUsers = [...this.vendors];
        break;
      case UserRole.CRAFTSMAN:
        this.filteredUsers = [...this.craftsmen];
        break;
      default:
        this.filteredUsers = [...this.allUsers];
    }

    this.applySearch();
  }

  onSearchChange(): void {
    this.applySearch();
  }

  applySearch(): void {
    let base: UserDetails[];

    switch (this.selectedTab) {
      case UserRole.CUSTOMER:
        base = this.customers;
        break;
      case UserRole.VENDOR:
        base = this.vendors;
        break;
      case UserRole.CRAFTSMAN:
        base = this.craftsmen;
        break;
      default:
        base = this.allUsers;
    }

    if (!this.searchQuery.trim()) {
      this.filteredUsers = [...base];
      return;
    }

    const query = this.searchQuery.toLowerCase();
    this.filteredUsers = base.filter(user =>
      user.firstName.toLowerCase().includes(query) ||
      user.lastName.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query) ||
      (user.phone && user.phone.includes(query)) ||
      (user.city && user.city.toLowerCase().includes(query))
    );
  }

  viewDetails(user: UserDetails): void {
    this.selectedUser = user;
    this.showDetailsModal = true;
  }

  closeDetailsModal(): void {
    this.showDetailsModal = false;
    this.selectedUser = null;
  }

  approveUser(userId: string): void {
    this.userService.approveUser(userId).subscribe({
      next: (success) => {
        if (success) {
          this.toast.success('User approved successfully!');
          this.loadAllUsers();
          this.closeDetailsModal();
        } else {
          this.toast.error('Failed to approve user.');
        }
      }
    });
  }

  rejectUser(userId: string): void {
    const user = this.allUsers.find(u => u.id === userId);
    if (!user) {
      return;
    }

    this.confirmDialog.confirm(`Reject ${user.firstName} ${user.lastName}?`, 'Reject', 'Cancel').then(confirmed => {
      if (!confirmed) return;
      this.userService.rejectUser(userId).subscribe({
        next: (success) => {
          if (success) {
            this.toast.success(`${user.firstName} ${user.lastName} has been rejected.`);
            this.loadAllUsers();
            this.closeDetailsModal();
          } else {
            this.toast.error('Failed to reject user.');
          }
        }
      });
    });
  }

  deleteUser(userId: string): void {
    const user = this.allUsers.find(u => u.id === userId);
    if (!user) return;

    const message = `Permanently delete "${user.firstName} ${user.lastName}" (${user.email})?\n\nThis action cannot be undone.`;
    this.confirmDialog.confirm(message, 'Delete', 'Cancel').then(confirmed => {
      if (!confirmed) return;
      this.userService.deleteUser(userId).subscribe({
        next: (res) => {
          this.toast.success(res.message || 'User deleted successfully.');
          this.closeDetailsModal();
          this.loadAllUsers();
        },
        error: (err) => {
          const msg = err?.error?.message || 'Failed to delete user. Please try again.';
          this.toast.error(msg);
        }
      });
    });
  }

  getStatusClass(status: ApprovalStatus): string {
    switch (status) {
      case ApprovalStatus.APPROVED:
        return 'status-approved';
      case ApprovalStatus.PENDING:
        return 'status-pending';
      case ApprovalStatus.REJECTED:
        return 'status-rejected';
      default:
        return '';
    }
  }

  exportToCSV(): void {
    this.toast.warning('Export to CSV functionality will be implemented soon.');
  }
}
