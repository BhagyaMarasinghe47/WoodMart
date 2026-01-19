import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { VendorService, DashboardStats, CustomerOrder, InventoryItem, Craftsman, OrderStatus } from '../../core/services/vendor.service';

@Component({
  selector: 'app-vendor-dashboard',
  templateUrl: './vendor-dashboard.component.html',
  styleUrls: ['./vendor-dashboard.component.css']
})
export class VendorDashboardComponent implements OnInit {
  activeTab: 'overview' | 'orders' | 'inventory' | 'craftsmen' = 'overview';
  stats: DashboardStats = {
    totalOrders: 0,
    totalInventoryItems: 0,
    totalCraftsmen: 0,
    monthlySales: 0
  };

  // Orders data
  orders: CustomerOrder[] = [];
  orderStatuses = Object.values(OrderStatus);

  // Inventory data
  inventoryItems: InventoryItem[] = [];
  editingStock: string | null = null;
  editingPrice: string | null = null;
  tempStockValue: number = 0;
  tempPriceValue: number = 0;

  // Craftsmen data
  craftsmen: Craftsman[] = [];

  loading = false;

  constructor(
    private authService: AuthService,
    private vendorService: VendorService
  ) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.loading = true;
    
    // Load dashboard stats
    this.vendorService.getDashboardStats().subscribe(stats => {
      this.stats = stats;
    });

    // Load orders
    this.vendorService.getCustomerOrders().subscribe(orders => {
      this.orders = orders;
    });

    // Load inventory
    this.vendorService.getInventoryItems().subscribe(items => {
      this.inventoryItems = items;
    });

    // Load craftsmen
    this.vendorService.getCraftsmen().subscribe(craftsmen => {
      this.craftsmen = craftsmen;
      this.loading = false;
    });
  }

  switchTab(tab: 'overview' | 'orders' | 'inventory' | 'craftsmen'): void {
    this.activeTab = tab;
  }

  // Order management
  updateOrderStatus(orderId: string, newStatus: OrderStatus): void {
    this.vendorService.updateOrderStatus(orderId, newStatus).subscribe(success => {
      if (success) {
        const order = this.orders.find(o => o.id === orderId);
        if (order) {
          order.status = newStatus;
        }
      }
    });
  }

  // Inventory management
  startEditStock(itemId: string, currentStock: number): void {
    this.editingStock = itemId;
    this.tempStockValue = currentStock;
  }

  saveStock(itemId: string): void {
    this.vendorService.updateInventoryStock(itemId, this.tempStockValue).subscribe(success => {
      if (success) {
        const item = this.inventoryItems.find(i => i.id === itemId);
        if (item) {
          item.stockQuantity = this.tempStockValue;
        }
      }
      this.editingStock = null;
    });
  }

  cancelEditStock(): void {
    this.editingStock = null;
  }

  startEditPrice(itemId: string, currentPrice: number): void {
    this.editingPrice = itemId;
    this.tempPriceValue = currentPrice;
  }

  savePrice(itemId: string): void {
    this.vendorService.updateRetailPrice(itemId, this.tempPriceValue).subscribe(success => {
      if (success) {
        const item = this.inventoryItems.find(i => i.id === itemId);
        if (item) {
          item.retailPrice = this.tempPriceValue;
        }
      }
      this.editingPrice = null;
    });
  }

  cancelEditPrice(): void {
    this.editingPrice = null;
  }

  getStatusClass(status: OrderStatus): string {
    switch (status) {
      case OrderStatus.PENDING: return 'status-pending';
      case OrderStatus.PROCESSING: return 'status-processing';
      case OrderStatus.SHIPPED: return 'status-shipped';
      case OrderStatus.DELIVERED: return 'status-delivered';
      case OrderStatus.CANCELLED: return 'status-cancelled';
      default: return '';
    }
  }

  logout(): void {
    this.authService.logout();
  }
}
