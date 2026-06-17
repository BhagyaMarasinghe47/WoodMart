import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, catchError, of } from 'rxjs';
import { environment } from '../../../environments/environment';

export enum OrderStatus {
  PENDING = 'Pending',
  ACCEPTED = 'Accepted',
  IN_PRODUCTION = 'In Production',
  READY_FOR_DISPATCH = 'Ready for Dispatch',
  DISPATCHED = 'Dispatched'
}

export enum ProductStatus {
  ACTIVE = 'Active',
  OUT_OF_STOCK = 'Out of Stock',
  DISCONTINUED = 'Discontinued'
}

export interface WholesaleProduct {
  id: string;
  name: string;
  description: string;
  category: string;
  subcategory?: string;
  wholesalePrice: number;
  availableQuantity: number;
  material: string;
  dimensions?: string;
  weight?: string;
  imageUrl: string;
  status: ProductStatus;
  craftsmanId: string;
  createdAt: Date;
}

export interface VendorOrder {
  id: string;
  orderNumber: string;
  vendorName: string;
  vendorEmail: string;
  productName: string;
  quantity: number;
  wholesalePrice: number;
  totalAmount: number;
  orderDate: Date;
  expectedDeliveryDate: Date;
  status: OrderStatus;
  notes?: string;
}

export interface InventoryItem {
  id: string;
  productId: string;
  productName: string;
  category: string;
  availableQuantity: number;
  inProduction: number;
  reserved: number;
  material: string;
  wholesalePrice: number;
  status: ProductStatus;
  lastUpdated: Date;
}

export interface DashboardStats {
  totalProducts: number;
  activeVendorOrders: number;
  ordersInProduction: number;
  lowStockProducts: number;
}

@Injectable({
  providedIn: 'root'
})
export class CraftsmanService {
  private readonly apiUrl = `${environment.apiUrl}/craftsman`;

  constructor(private http: HttpClient) {}

  getDashboardStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${this.apiUrl}/stats`).pipe(
      catchError(() => of({ totalProducts: 0, activeVendorOrders: 0, ordersInProduction: 0, lowStockProducts: 0 }))
    );
  }

  getWholesaleProducts(): Observable<WholesaleProduct[]> {
    return this.http.get<any[]>(`${this.apiUrl}/products`).pipe(
      map(items => items.map(p => this.mapProduct(p))),
      catchError(() => of([]))
    );
  }

  addWholesaleProduct(product: Omit<WholesaleProduct, 'id' | 'createdAt'>): Observable<WholesaleProduct> {
    return this.http.post<any>(`${this.apiUrl}/products`, {
      name: product.name,
      description: product.description,
      category: product.category,
      subcategory: product.subcategory,
      wholesalePrice: product.wholesalePrice,
      availableQuantity: product.availableQuantity,
      material: product.material,
      dimensions: product.dimensions,
      weight: product.weight,
      imageUrl: product.imageUrl,
      status: product.status
    }).pipe(map(p => this.mapProduct(p)));
  }

  updateWholesaleProduct(id: string, updates: Partial<WholesaleProduct>): Observable<boolean> {
    return this.http.put<any>(`${this.apiUrl}/products/${id}`, {
      name: updates.name,
      description: updates.description,
      category: updates.category,
      subcategory: updates.subcategory,
      wholesalePrice: updates.wholesalePrice,
      availableQuantity: updates.availableQuantity,
      material: updates.material,
      dimensions: updates.dimensions,
      weight: updates.weight,
      imageUrl: updates.imageUrl,
      status: updates.status
    }).pipe(map(() => true));
  }

  deleteWholesaleProduct(id: string): Observable<boolean> {
    return this.http.delete<any>(`${this.apiUrl}/products/${id}`).pipe(
      map(() => true)
    );
  }

  getVendorOrders(): Observable<VendorOrder[]> {
    return this.http.get<any[]>(`${this.apiUrl}/orders`).pipe(
      map(items => items.map(o => this.mapOrder(o))),
      catchError(() => of([]))
    );
  }

  updateOrderStatus(orderId: string, status: OrderStatus, expectedDeliveryDate?: Date): Observable<boolean> {
    return this.http.put<any>(`${this.apiUrl}/orders/${orderId}/status`, {
      status,
      expectedDeliveryDate: expectedDeliveryDate?.toISOString().split('T')[0] ?? null
    }).pipe(map(() => true));
  }

  getInventory(): Observable<InventoryItem[]> {
    return this.http.get<any[]>(`${this.apiUrl}/inventory`).pipe(
      map(items => items.map(i => ({
        id: i.id,
        productId: i.productId,
        productName: i.productName,
        category: i.category,
        availableQuantity: i.availableQuantity,
        inProduction: i.inProduction,
        reserved: i.reserved,
        material: i.material,
        wholesalePrice: i.wholesalePrice,
        status: i.status as ProductStatus,
        lastUpdated: new Date(i.lastUpdated)
      }))),
      catchError(() => of([]))
    );
  }

  updateInventoryQuantity(productId: string, quantity: number): Observable<boolean> {
    return this.http.put<any>(`${this.apiUrl}/inventory/${productId}`, { quantity }).pipe(
      map(() => true)
    );
  }

  private resolveImageUrl(url?: string): string {
    if (!url) return 'assets/images/hero-bg.jpg';
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('assets/')) return url;
    const baseUrl = environment.apiUrl.replace('/api', '');
    return `${baseUrl}/${url}`;
  }

  private mapProduct(p: any): WholesaleProduct {
    return {
      id: p.id.toString(),
      name: p.name,
      description: p.description ?? '',
      category: p.category,
      subcategory: p.subcategory || undefined,
      wholesalePrice: p.wholesalePrice,
      availableQuantity: p.availableQuantity,
      material: p.material ?? '',
      dimensions: p.dimensions || undefined,
      weight: p.weight || undefined,
      imageUrl: this.resolveImageUrl(p.imageUrl),
      status: (p.status as ProductStatus) ?? ProductStatus.ACTIVE,
      craftsmanId: p.craftsmanId?.toString() ?? '',
      createdAt: new Date(p.createdAt)
    };
  }

  private mapOrder(o: any): VendorOrder {
    return {
      id: o.id.toString(),
      orderNumber: o.orderNumber,
      vendorName: o.vendorName,
      vendorEmail: o.vendorEmail,
      productName: o.productName,
      quantity: o.quantity,
      wholesalePrice: o.wholesalePrice,
      totalAmount: o.totalAmount,
      orderDate: new Date(o.orderDate),
      expectedDeliveryDate: new Date(o.expectedDeliveryDate),
      status: o.status as OrderStatus,
      notes: o.notes
    };
  }
}
