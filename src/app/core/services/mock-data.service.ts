import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { Order, OrderStatus, OrderItem } from '../models/order.model';
import { User, UserRole, ApprovalStatus } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class MockDataService {
  private mockOrders: Order[] = [
    {
      id: 'ord1',
      customerId: '4',
      customerName: 'Bob Customer',
      items: [
        {
          productId: 'p1',
          productName: 'Handcrafted Oak Dining Table',
          productImage: 'https://images.unsplash.com/photo-1617806118233-18e1de247200?w=500',
          quantity: 1,
          price: 699,
          subtotal: 699
        },
        {
          productId: 'p2',
          productName: 'Wooden Picture Frame Set',
          productImage: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=500',
          quantity: 2,
          price: 45,
          subtotal: 90
        }
      ],
      totalAmount: 789,
      status: OrderStatus.DELIVERED,
      shippingAddress: '123 Main St, City, Country',
      paymentMethod: 'Credit Card',
      createdAt: new Date('2024-01-10'),
      updatedAt: new Date('2024-01-15')
    },
    {
      id: 'ord2',
      customerId: '4',
      customerName: 'Bob Customer',
      items: [
        {
          productId: 'p5',
          productName: 'Rustic Coffee Table',
          productImage: 'https://images.unsplash.com/photo-1532372320572-cda25653a26d?w=500',
          quantity: 1,
          price: 199,
          subtotal: 199
        }
      ],
      totalAmount: 199,
      status: OrderStatus.PROCESSING,
      shippingAddress: '123 Main St, City, Country',
      paymentMethod: 'PayPal',
      createdAt: new Date('2024-02-01'),
      updatedAt: new Date('2024-02-02')
    }
  ];

  private mockPendingUsers: User[] = [
    {
      id: '5',
      email: 'newvendor@woodmart.com',
      firstName: 'Sarah',
      lastName: 'NewVendor',
      role: UserRole.VENDOR,
      approvalStatus: ApprovalStatus.PENDING,
      createdAt: new Date('2024-02-15'),
      phone: '+1234567894'
    },
    {
      id: '6',
      email: 'newcraftsman@woodmart.com',
      firstName: 'Mike',
      lastName: 'NewCraftsman',
      role: UserRole.CRAFTSMAN,
      approvalStatus: ApprovalStatus.PENDING,
      createdAt: new Date('2024-02-16'),
      phone: '+1234567895'
    }
  ];

  constructor() { }

  // Order methods
  getOrders(): Observable<Order[]> {
    return of([...this.mockOrders]).pipe(delay(300));
  }

  getOrderById(id: string): Observable<Order | undefined> {
    const order = this.mockOrders.find(o => o.id === id);
    return of(order).pipe(delay(300));
  }

  getOrdersByCustomerId(customerId: string): Observable<Order[]> {
    const orders = this.mockOrders.filter(o => o.customerId === customerId);
    return of(orders).pipe(delay(300));
  }

  createOrder(order: Order): Observable<Order> {
    this.mockOrders.push(order);
    return of(order).pipe(delay(300));
  }

  updateOrderStatus(orderId: string, status: OrderStatus): Observable<Order | undefined> {
    const order = this.mockOrders.find(o => o.id === orderId);
    if (order) {
      order.status = status;
      order.updatedAt = new Date();
      return of(order).pipe(delay(300));
    }
    return of(undefined).pipe(delay(300));
  }

  // User management methods
  getPendingUsers(): Observable<User[]> {
    return of([...this.mockPendingUsers]).pipe(delay(300));
  }

  approveUser(userId: string): Observable<boolean> {
    const user = this.mockPendingUsers.find(u => u.id === userId);
    if (user) {
      user.approvalStatus = ApprovalStatus.APPROVED;
      return of(true).pipe(delay(300));
    }
    return of(false).pipe(delay(300));
  }

  rejectUser(userId: string): Observable<boolean> {
    const user = this.mockPendingUsers.find(u => u.id === userId);
    if (user) {
      user.approvalStatus = ApprovalStatus.REJECTED;
      return of(true).pipe(delay(300));
    }
    return of(false).pipe(delay(300));
  }

  // Statistics for admin dashboard
  getStatistics(): Observable<any> {
    return of({
      totalProducts: 45,
      totalOrders: this.mockOrders.length,
      totalCustomers: 25,
      totalVendors: 8,
      totalCraftsmen: 12,
      pendingApprovals: this.mockPendingUsers.length,
      revenue: this.mockOrders.reduce((sum, order) => sum + order.totalAmount, 0)
    }).pipe(delay(300));
  }
}
