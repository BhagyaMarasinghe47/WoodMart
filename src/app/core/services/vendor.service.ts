import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';

export enum OrderStatus {
  PENDING = 'Pending',
  PROCESSING = 'Processing',
  SHIPPED = 'Shipped',
  DELIVERED = 'Delivered',
  CANCELLED = 'Cancelled'
}

export interface CustomerOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  products: {
    productName: string;
    quantity: number;
    price: number;
  }[];
  totalAmount: number;
  orderDate: Date;
  status: OrderStatus;
}

export interface InventoryItem {
  id: string;
  productName: string;
  category: string;
  craftsmanName: string;
  craftsmanId: string;
  stockQuantity: number;
  retailPrice: number;
  imageUrl: string;
}

export interface Craftsman {
  id: string;
  name: string;
  email: string;
  location: string;
  specialization: string;
  rating: number;
  phone: string;
  productsCount: number;
}

export interface DashboardStats {
  totalOrders: number;
  totalInventoryItems: number;
  totalCraftsmen: number;
  monthlySales: number;
}

@Injectable({
  providedIn: 'root'
})
export class VendorService {
  // Mock customer orders data
  // In a real application, this would come from backend API
  private customerOrders: CustomerOrder[] = [
    {
      id: '1',
      orderNumber: 'ORD-2026-001',
      customerName: 'John Smith',
      customerEmail: 'john@example.com',
      products: [
        { productName: 'Premium Teak Wood Sofa Set', quantity: 1, price: 45000 }
      ],
      totalAmount: 45000,
      orderDate: new Date('2026-01-15'),
      status: OrderStatus.PENDING
    },
    {
      id: '2',
      orderNumber: 'ORD-2026-002',
      customerName: 'Sarah Johnson',
      customerEmail: 'sarah@example.com',
      products: [
        { productName: 'King Size Wooden Bed', quantity: 1, price: 35000 },
        { productName: 'Wooden Bedside Table', quantity: 2, price: 8000 }
      ],
      totalAmount: 51000,
      orderDate: new Date('2026-01-16'),
      status: OrderStatus.PROCESSING
    },
    {
      id: '3',
      orderNumber: 'ORD-2026-003',
      customerName: 'Mike Williams',
      customerEmail: 'mike@example.com',
      products: [
        { productName: '6 Seater Dining Table', quantity: 1, price: 28000 }
      ],
      totalAmount: 28000,
      orderDate: new Date('2026-01-17'),
      status: OrderStatus.SHIPPED
    },
    {
      id: '4',
      orderNumber: 'ORD-2026-004',
      customerName: 'Emily Brown',
      customerEmail: 'emily@example.com',
      products: [
        { productName: 'Executive Office Desk', quantity: 1, price: 32000 }
      ],
      totalAmount: 32000,
      orderDate: new Date('2026-01-18'),
      status: OrderStatus.DELIVERED
    }
  ];

  // Mock inventory data
  private inventoryItems: InventoryItem[] = [
    {
      id: 'inv-1',
      productName: 'Premium Teak Wood Sofa Set',
      category: 'Living Room Furniture',
      craftsmanName: 'John Carpenter',
      craftsmanId: 'craft-1',
      stockQuantity: 5,
      retailPrice: 45000,
      imageUrl: 'assets/images/hero-bg.jpg'
    },
    {
      id: 'inv-2',
      productName: 'King Size Wooden Bed',
      category: 'Bedroom Furniture',
      craftsmanName: 'Robert Wood',
      craftsmanId: 'craft-2',
      stockQuantity: 8,
      retailPrice: 35000,
      imageUrl: 'assets/images/hero-bg.jpg'
    },
    {
      id: 'inv-3',
      productName: '6 Seater Dining Table',
      category: 'Dining Room Furniture',
      craftsmanName: 'John Carpenter',
      craftsmanId: 'craft-1',
      stockQuantity: 3,
      retailPrice: 28000,
      imageUrl: 'assets/images/hero-bg.jpg'
    },
    {
      id: 'inv-4',
      productName: 'Executive Office Desk',
      category: 'Office Furniture',
      craftsmanName: 'Michael Oak',
      craftsmanId: 'craft-3',
      stockQuantity: 12,
      retailPrice: 32000,
      imageUrl: 'assets/images/hero-bg.jpg'
    },
    {
      id: 'inv-5',
      productName: 'Wooden Bedside Table',
      category: 'Bedroom Furniture',
      craftsmanName: 'Robert Wood',
      craftsmanId: 'craft-2',
      stockQuantity: 15,
      retailPrice: 8000,
      imageUrl: 'assets/images/hero-bg.jpg'
    },
    {
      id: 'inv-6',
      productName: 'Kids Study Table with Chair',
      category: 'Kids Furniture',
      craftsmanName: 'Michael Oak',
      craftsmanId: 'craft-3',
      stockQuantity: 10,
      retailPrice: 12000,
      imageUrl: 'assets/images/hero-bg.jpg'
    }
  ];

  // Mock craftsmen data
  private craftsmen: Craftsman[] = [
    {
      id: 'craft-1',
      name: 'John Carpenter',
      email: 'john.carpenter@woodmart.com',
      location: 'Colombo, Sri Lanka',
      specialization: 'Sofas, Tables, Cabinets',
      rating: 4.8,
      phone: '+94 77 123 4567',
      productsCount: 15
    },
    {
      id: 'craft-2',
      name: 'Robert Wood',
      email: 'robert.wood@woodmart.com',
      location: 'Kandy, Sri Lanka',
      specialization: 'Beds, Wardrobes, Bedroom Furniture',
      rating: 4.6,
      phone: '+94 77 234 5678',
      productsCount: 12
    },
    {
      id: 'craft-3',
      name: 'Michael Oak',
      email: 'michael.oak@woodmart.com',
      location: 'Galle, Sri Lanka',
      specialization: 'Office Furniture, Kids Furniture',
      rating: 4.9,
      phone: '+94 77 345 6789',
      productsCount: 18
    },
    {
      id: 'craft-4',
      name: 'David Teak',
      email: 'david.teak@woodmart.com',
      location: 'Negombo, Sri Lanka',
      specialization: 'Outdoor Furniture, Garden Sets',
      rating: 4.5,
      phone: '+94 77 456 7890',
      productsCount: 10
    }
  ];

  constructor() { }

  // Get all customer orders (with mock delay)
  getCustomerOrders(): Observable<CustomerOrder[]> {
    return of(this.customerOrders).pipe(delay(300));
  }

  // Update order status
  updateOrderStatus(orderId: string, newStatus: OrderStatus): Observable<boolean> {
    const order = this.customerOrders.find(o => o.id === orderId);
    if (order) {
      order.status = newStatus;
      return of(true).pipe(delay(300));
    }
    return of(false).pipe(delay(300));
  }

  // Get inventory items
  getInventoryItems(): Observable<InventoryItem[]> {
    return of(this.inventoryItems).pipe(delay(300));
  }

  // Update inventory stock
  updateInventoryStock(itemId: string, newStock: number): Observable<boolean> {
    const item = this.inventoryItems.find(i => i.id === itemId);
    if (item) {
      item.stockQuantity = newStock;
      return of(true).pipe(delay(300));
    }
    return of(false).pipe(delay(300));
  }

  // Update retail price
  updateRetailPrice(itemId: string, newPrice: number): Observable<boolean> {
    const item = this.inventoryItems.find(i => i.id === itemId);
    if (item) {
      item.retailPrice = newPrice;
      return of(true).pipe(delay(300));
    }
    return of(false).pipe(delay(300));
  }

  // Get craftsmen list
  getCraftsmen(): Observable<Craftsman[]> {
    return of(this.craftsmen).pipe(delay(300));
  }

  // Get dashboard statistics
  getDashboardStats(): Observable<DashboardStats> {
    const stats: DashboardStats = {
      totalOrders: this.customerOrders.length,
      totalInventoryItems: this.inventoryItems.length,
      totalCraftsmen: this.craftsmen.length,
      monthlySales: this.customerOrders.reduce((sum, order) => sum + order.totalAmount, 0)
    };
    return of(stats).pipe(delay(300));
  }
}
