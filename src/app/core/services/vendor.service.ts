import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ToastService } from './toast.service';

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

export interface CraftsmanProduct {
  id: string;
  name: string;
  description: string;
  category: string;
  subcategory?: string;
  wholesalePrice: number;
  material?: string;
  dimensions?: string;
  weight?: string;
  imageUrl: string;
  craftsmanId: string;
  craftsmanName: string;
  isSelectedByVendor: boolean;
  totalStock: number;
}

export interface VendorCatalogProduct {
  id: string;
  craftsmanProductId: string;
  name: string;
  description: string;
  category: string;
  subcategory?: string;
  wholesalePrice: number;
  retailPrice: number;
  material?: string;
  dimensions?: string;
  weight?: string;
  imageUrl: string;
  craftsmanId: string;
  craftsmanName: string;
  stock: number;
  isPublished: boolean;
}

export interface DashboardStats {
  totalProducts: number;
  productsLowInStock: number;
  totalOrders: number;
  pendingOrders: number;
  totalCraftsmenConnected: number;
  monthlySales: number;
}

export interface VendorBulkOrderItem {
  productName: string;
  quantity: number;
  unitCost: number;
  subtotal: number;
}

export interface VendorBulkOrder {
  id: number;
  orderNumber: string;
  craftsmanId: number;
  craftsmanName: string;
  status: string;
  totalQuantity: number;
  totalCost: number;
  notes: string;
  createdAt: Date;
  items: VendorBulkOrderItem[];
}

export interface VendorShop {
  id: string;
  name: string;
  ownerName: string;
  description: string;
  city?: string;
  publishedProductCount: number;
  image: string;
  rating: number;
  deliveryAvailable: boolean;
}

interface ApiVendorCatalogDto {
  id: number;
  craftsmanProductId: number;
  name: string;
  description: string;
  price: number;
  sellingPrice: number;
  stockQuantity: number;
  status: string;
  categoryName?: string;
  subcategoryName?: string;
  craftsmanId: number;
  craftsmanName?: string;
  vendorId: number;
  vendorName?: string;
  imageUrl?: string;
}

interface ApiVendorOrderDto {
  id: number;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  products: { productName: string; quantity: number; price: number }[];
  totalAmount: number;
  orderDate: string;
  status: string;
}

interface ApiStatsDto {
  totalProducts: number;
  productsLowInStock: number;
  totalOrders: number;
  pendingOrders: number;
  totalCraftsmenConnected: number;
  monthlySales: number;
}

interface ApiCraftsmanDto {
  id: number;
  name: string;
  email: string;
  city?: string;
  productsCount: number;
}

interface ApiCraftsmanProductDto {
  id: number;
  name: string;
  description: string;
  category: string;
  subcategory?: string;
  wholesalePrice: number;
  craftsmanId: number;
  craftsmanName: string;
  inVendorCatalog: boolean;
  imageUrl?: string;
  material?: string;
  totalStock: number;
}

interface ApiBulkOrderDto {
  id: number;
  orderNumber: string;
  craftsmanId: number;
  craftsmanName: string;
  status: string;
  totalQuantity: number;
  totalCost: number;
  notes: string;
  createdAt: string;
  items: { productName: string; quantity: number; unitCost: number; subtotal: number }[];
}

interface ApiShopDto {
  id: number;
  name: string;
  ownerName: string;
  description?: string;
  city?: string;
  publishedProductCount: number;
  imageUrl?: string;
}

const DEFAULT_IMAGE = 'assets/images/hero-bg.jpg';
const API_BASE = environment.apiUrl.replace('/api', '');

function resolveShopImage(url?: string | null): string {
  if (!url) return DEFAULT_IMAGE;
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('assets/')) return url;
  return `${API_BASE}/${url}`;
}

@Injectable({
  providedIn: 'root'
})
export class VendorService {
  private readonly apiUrl = `${environment.apiUrl}/vendor`;

  constructor(private http: HttpClient, private toast: ToastService) {}

  getShops(): Observable<VendorShop[]> {
    return this.http.get<ApiShopDto[]>(`${this.apiUrl}/shops`).pipe(
      map(shops => shops.map(s => ({
        id: String(s.id),
        name: s.name,
        ownerName: s.ownerName,
        description: s.description || 'Quality handcrafted wooden furniture',
        city: s.city,
        publishedProductCount: s.publishedProductCount,
        image: resolveShopImage(s.imageUrl),
        rating: 4.5,
        deliveryAvailable: s.publishedProductCount > 0
      }))),
      catchError(() => of([]))
    );
  }

  getCustomerOrders(): Observable<CustomerOrder[]> {
    return this.http.get<ApiVendorOrderDto[]>(`${this.apiUrl}/orders`).pipe(
      map(orders => orders.map(o => this.mapOrder(o))),
      catchError(err => {
        console.error('Failed to load vendor orders:', err);
        return of([]);
      })
    );
  }

  updateOrderStatus(orderId: string, newStatus: OrderStatus): Observable<boolean> {
    return this.http.put<{ message: string }>(`${this.apiUrl}/orders/${orderId}/status`, {
      status: newStatus
    }).pipe(
      map(() => true),
      catchError(() => of(false))
    );
  }

  getInventoryItems(): Observable<InventoryItem[]> {
    return this.getVendorCatalog().pipe(
      map(catalog => catalog.map(p => ({
        id: p.id,
        productName: p.name,
        category: p.category,
        craftsmanName: p.craftsmanName,
        craftsmanId: p.craftsmanId,
        stockQuantity: p.stock,
        retailPrice: p.retailPrice,
        imageUrl: p.imageUrl
      })))
    );
  }

  updateInventoryStock(itemId: string, newStock: number): Observable<boolean> {
    return this.updateVendorCatalogProduct(itemId, { stock: newStock });
  }

  updateRetailPrice(itemId: string, newPrice: number): Observable<boolean> {
    return this.updateVendorCatalogProduct(itemId, { retailPrice: newPrice });
  }

  getCraftsmen(): Observable<Craftsman[]> {
    return this.http.get<ApiCraftsmanDto[]>(`${this.apiUrl}/craftsmen`).pipe(
      map(list => list.map(c => ({
        id: String(c.id),
        name: c.name,
        email: c.email,
        location: c.city || 'Sri Lanka',
        specialization: 'Woodworking',
        rating: 4.5,
        phone: '',
        productsCount: c.productsCount
      }))),
      catchError(() => of([]))
    );
  }

  getDashboardStats(): Observable<DashboardStats> {
    return this.http.get<ApiStatsDto>(`${this.apiUrl}/stats`).pipe(
      map(s => ({
        totalProducts: s.totalProducts,
        productsLowInStock: s.productsLowInStock,
        totalOrders: s.totalOrders,
        pendingOrders: s.pendingOrders,
        totalCraftsmenConnected: s.totalCraftsmenConnected,
        monthlySales: Number(s.monthlySales)
      })),
      catchError(() => of({
        totalProducts: 0,
        productsLowInStock: 0,
        totalOrders: 0,
        pendingOrders: 0,
        totalCraftsmenConnected: 0,
        monthlySales: 0
      }))
    );
  }

  getCraftsmenProducts(craftsmanId?: string): Observable<CraftsmanProduct[]> {
    let params = new HttpParams();
    if (craftsmanId) {
      params = params.set('craftsmanId', craftsmanId);
    }

    return this.http.get<ApiCraftsmanProductDto[]>(`${this.apiUrl}/craftsman-products`, { params }).pipe(
      map(products => products.map(p => ({
        id: String(p.id),
        name: p.name,
        description: p.description,
        category: p.category,
        subcategory: p.subcategory,
        wholesalePrice: p.wholesalePrice,
        material: p.material,
        imageUrl: resolveShopImage(p.imageUrl),
        craftsmanId: String(p.craftsmanId),
        craftsmanName: p.craftsmanName,
        isSelectedByVendor: p.inVendorCatalog,
        totalStock: p.totalStock ?? 0
      }))),
      catchError(() => of([]))
    );
  }

  getVendorCatalog(): Observable<VendorCatalogProduct[]> {
    return this.http.get<ApiVendorCatalogDto[]>(`${this.apiUrl}/catalog`).pipe(
      map(items => items.map(i => this.mapCatalogItem(i))),
      catchError(err => {
        console.error('Failed to load vendor catalog:', err);
        return of([]);
      })
    );
  }

  addToVendorCatalog(craftsmanProductId: string, retailPrice: number, stock: number): Observable<VendorCatalogProduct | null> {
    return this.http.post<ApiVendorCatalogDto>(`${this.apiUrl}/catalog`, {
      craftsmanProductId: parseInt(craftsmanProductId, 10),
      retailPrice,
      stock
    }).pipe(
      map(i => this.mapCatalogItem(i)),
      catchError(err => {
        this.toast.error(this.extractError(err, 'Could not add product to catalog.'));
        return of(null);
      })
    );
  }

  updateVendorCatalogProduct(
    productId: string,
    updates: Partial<VendorCatalogProduct> & { stock?: number; retailPrice?: number }
  ): Observable<boolean> {
    const body: { retailPrice?: number; stock?: number; isPublished?: boolean } = {};
    if (updates.retailPrice != null) body.retailPrice = updates.retailPrice;
    if (updates.stock != null) body.stock = updates.stock;
    if (updates.isPublished != null) body.isPublished = updates.isPublished;

    return this.http.put<ApiVendorCatalogDto>(`${this.apiUrl}/catalog/${productId}`, body).pipe(
      map(() => true),
      catchError(err => {
        this.toast.error(this.extractError(err, 'Could not update product.'));
        return of(false);
      })
    );
  }

  togglePublishProduct(productId: string): Observable<boolean> {
    return this.http.post<ApiVendorCatalogDto>(`${this.apiUrl}/catalog/${productId}/publish`, {}).pipe(
      map(() => true),
      catchError(err => {
        this.toast.error(this.extractError(err, 'Could not update publish status.'));
        return of(false);
      })
    );
  }

  removeFromVendorCatalog(productId: string): Observable<boolean> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/catalog/${productId}`).pipe(
      map(() => true),
      catchError(err => {
        this.toast.error(this.extractError(err, 'Could not remove product.'));
        return of(false);
      })
    );
  }

  getBulkOrders(): Observable<VendorBulkOrder[]> {
    return this.http.get<ApiBulkOrderDto[]>(`${this.apiUrl}/bulk-orders`).pipe(
      map(orders => orders.map(o => ({
        id: o.id,
        orderNumber: o.orderNumber,
        craftsmanId: o.craftsmanId,
        craftsmanName: o.craftsmanName,
        status: o.status,
        totalQuantity: o.totalQuantity,
        totalCost: Number(o.totalCost),
        notes: o.notes,
        createdAt: new Date(o.createdAt),
        items: o.items || []
      }))),
      catchError(err => {
        console.error('Failed to load bulk orders:', err);
        return of([]);
      })
    );
  }

  submitBulkOrder(craftsmanProductId: string, quantity: number, agreeUnitPrice: number, notes: string): Observable<{ success: boolean; orderNumber?: string; message?: string }> {
    return this.http.post<{ message: string; orderNumber: string; orderId: number }>(`${this.apiUrl}/bulk-orders`, {
      craftsmanProductId: parseInt(craftsmanProductId, 10),
      quantity,
      agreeUnitPrice,
      notes
    }).pipe(
      map(res => ({ success: true, orderNumber: res.orderNumber })),
      catchError(err => {
        const msg = this.extractError(err, 'Failed to submit bulk order.');
        return of({ success: false, message: msg });
      })
    );
  }

  /** Reload all dashboard data in one call */
  loadDashboardBundle(): Observable<{
    stats: DashboardStats;
    orders: CustomerOrder[];
    inventory: InventoryItem[];
    craftsmen: Craftsman[];
    craftsmanProducts: CraftsmanProduct[];
    catalog: VendorCatalogProduct[];
    bulkOrders: VendorBulkOrder[];
  }> {
    return forkJoin({
      stats: this.getDashboardStats(),
      orders: this.getCustomerOrders(),
      inventory: this.getInventoryItems(),
      craftsmen: this.getCraftsmen(),
      craftsmanProducts: this.getCraftsmenProducts(),
      catalog: this.getVendorCatalog(),
      bulkOrders: this.getBulkOrders()
    });
  }

  private mapCatalogItem(dto: ApiVendorCatalogDto): VendorCatalogProduct {
    return {
      id: String(dto.id),
      craftsmanProductId: String(dto.craftsmanProductId),
      name: dto.name,
      description: dto.description,
      category: dto.categoryName || 'Uncategorized',
      subcategory: dto.subcategoryName,
      wholesalePrice: dto.price,
      retailPrice: dto.sellingPrice,
      imageUrl: resolveShopImage(dto.imageUrl),
      craftsmanId: String(dto.craftsmanId),
      craftsmanName: dto.craftsmanName || 'Craftsman',
      stock: dto.stockQuantity,
      isPublished: dto.status === 'Published'
    };
  }

  private mapOrder(dto: ApiVendorOrderDto): CustomerOrder {
    const statusKey = Object.values(OrderStatus).find(
      s => s.toLowerCase() === (dto.status || '').toLowerCase()
    ) || OrderStatus.PENDING;

    return {
      id: String(dto.id),
      orderNumber: dto.orderNumber,
      customerName: dto.customerName,
      customerEmail: dto.customerEmail,
      products: dto.products || [],
      totalAmount: Number(dto.totalAmount),
      orderDate: new Date(dto.orderDate),
      status: statusKey
    };
  }

  private extractError(err: unknown, fallback: string): string {
    const httpErr = err as HttpErrorResponse;
    if (httpErr?.error?.message) return String(httpErr.error.message);
    return fallback;
  }
}
