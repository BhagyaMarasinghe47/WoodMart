import { Component, OnInit } from '@angular/core';
import { MockDataService } from '../../core/services/mock-data.service';
import { AuthService } from '../../core/services/auth.service';
import { User, ApprovalStatus } from '../../core/models/user.model';

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css']
})
export class AdminDashboardComponent implements OnInit {
  statistics: any = {};
  pendingUsers: User[] = [];
  loading = true;

  constructor(
    private mockDataService: MockDataService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.loadStatistics();
    this.loadPendingUsers();
  }

  loadStatistics(): void {
    this.mockDataService.getStatistics().subscribe({
      next: (stats) => {
        this.statistics = stats;
        this.loading = false;
      }
    });
  }

  loadPendingUsers(): void {
    this.mockDataService.getPendingUsers().subscribe({
      next: (users) => {
        this.pendingUsers = users;
      }
    });
  }

  approveUser(userId: string): void {
    if (confirm('Approve this user?')) {
      this.mockDataService.approveUser(userId).subscribe({
        next: (success) => {
          if (success) {
            alert('User approved successfully!');
            this.loadPendingUsers();
          }
        }
      });
    }
  }

  rejectUser(userId: string): void {
    if (confirm('Reject this user?')) {
      this.mockDataService.rejectUser(userId).subscribe({
        next: (success) => {
          if (success) {
            alert('User rejected!');
            this.loadPendingUsers();
          }
        }
      });
    }
  }

  logout(): void {
    this.authService.logout();
  }
}
