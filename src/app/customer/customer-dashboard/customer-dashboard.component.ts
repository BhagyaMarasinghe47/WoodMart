import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { MockDataService } from '../../core/services/mock-data.service';
import { Order } from '../../core/models/order.model';

@Component({
  selector: 'app-customer-dashboard',
  templateUrl: './customer-dashboard.component.html',
  styleUrls: ['./customer-dashboard.component.css']
})
export class CustomerDashboardComponent implements OnInit {
  orders: Order[] = [];
  loading = true;

  constructor(
    private authService: AuthService,
    private mockDataService: MockDataService
  ) { }

  ngOnInit(): void {
    const user = this.authService.currentUserValue;
    if (user) {
      this.loadOrders(user.id);
    }
  }

  loadOrders(customerId: string): void {
    this.mockDataService.getOrdersByCustomerId(customerId).subscribe({
      next: (orders) => {
        this.orders = orders;
        this.loading = false;
      }
    });
  }

  logout(): void {
    this.authService.logout();
  }
}
