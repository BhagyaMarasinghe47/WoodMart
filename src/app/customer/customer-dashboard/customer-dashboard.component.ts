import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { OrderService } from '../../core/services/order.service';
import { Order, OrderStatus } from '../../core/models/order.model';
import { ToastService } from '../../core/services/toast.service';
import { ConfirmDialogService } from '../../core/services/confirm-dialog.service';

interface TrackStep {
  label: string;
  status: OrderStatus;
  icon: string;
}

@Component({
  selector: 'app-customer-dashboard',
  templateUrl: './customer-dashboard.component.html',
  styleUrls: ['./customer-dashboard.component.css']
})
export class CustomerDashboardComponent implements OnInit {
  orders: Order[] = [];
  loading = true;
  cancellingId: string | null = null;
  expandedOrderId: string | null = null;
  newOrderNumber: string | null = null;
  detailOrder: Order | null = null;

  readonly trackSteps: TrackStep[] = [
    { label: 'Ordered',    status: OrderStatus.PENDING,    icon: '📋' },
    { label: 'Processing', status: OrderStatus.PROCESSING, icon: '⚙️' },
    { label: 'Shipped',    status: OrderStatus.SHIPPED,    icon: '🚚' },
    { label: 'Delivered',  status: OrderStatus.DELIVERED,  icon: '✅' },
  ];

  constructor(
    private authService: AuthService,
    private orderService: OrderService,
    private route: ActivatedRoute,
    private toast: ToastService,
    private confirmDialog: ConfirmDialogService
  ) { }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['newOrder']) {
        this.newOrderNumber = params['newOrder'];
        setTimeout(() => { this.newOrderNumber = null; }, 6000);
      }
    });
    this.loadOrders();
  }

  dismissSuccess(): void {
    this.newOrderNumber = null;
  }

  loadOrders(): void {
    this.loading = true;
    this.orderService.getMyOrders().subscribe({
      next: (orders) => {
        this.orders = orders;
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  canCancel(order: Order): boolean {
    return order.status === OrderStatus.PENDING || order.status === OrderStatus.PROCESSING;
  }

  cancelOrder(order: Order): void {
    this.confirmDialog.confirm(`Cancel order #${order.orderNumber || order.id}?`, 'Cancel Order', 'Keep').then(confirmed => {
      if (!confirmed) return;
      this.cancellingId = order.id;
      this.orderService.cancelOrder(order.id).subscribe(result => {
        this.cancellingId = null;
        if (result.success) { this.loadOrders(); }
        else { this.toast.error(result.message || 'Failed to cancel order.'); }
      });
    });
  }

  toggleItems(orderId: string): void {
    this.expandedOrderId = this.expandedOrderId === orderId ? null : orderId;
  }

  openDetail(order: Order): void {
    this.detailOrder = order;
    document.body.style.overflow = 'hidden';
  }

  closeDetail(): void {
    this.detailOrder = null;
    document.body.style.overflow = '';
  }

  fullDeliveryAddress(order: Order): string {
    const parts = [
      order.shippingAddress,
      order.deliveryCity,
      order.deliveryState,
      order.deliveryPostalCode,
      order.deliveryCountry
    ].filter(Boolean);
    return parts.join(', ');
  }

  isCancelled(order: Order): boolean {
    return order.status === OrderStatus.CANCELLED;
  }

  stepIndex(status: OrderStatus): number {
    return this.trackSteps.findIndex(s => s.status === status);
  }

  currentStepIndex(order: Order): number {
    return this.stepIndex(order.status);
  }

  stepState(order: Order, step: TrackStep): 'done' | 'active' | 'upcoming' {
    const current = this.currentStepIndex(order);
    const idx = this.stepIndex(step.status);
    if (idx < current) return 'done';
    if (idx === current) return 'active';
    return 'upcoming';
  }
}
