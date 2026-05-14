import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';

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
  // Mock wholesale products data
  private wholesaleProducts: WholesaleProduct[] = [
    {
      id: 'wp-1',
      name: 'Premium Teak Wood Dining Table',
      description: 'Handcrafted 6-seater dining table with smooth finish',
      category: 'dining-room',
      subcategory: 'tables',
      wholesalePrice: 22000,
      availableQuantity: 8,
      material: 'Teak Wood',
      dimensions: '180cm x 90cm x 75cm',
      weight: '45kg',
      imageUrl: 'https://images.unsplash.com/photo-1617806118233-18e1de247200?w=500',
      status: ProductStatus.ACTIVE,
      craftsmanId: 'craft-1',
      createdAt: new Date('2025-12-01')
    },
    {
      id: 'wp-2',
      name: 'Handcrafted Oak Bed Frame',
      description: 'King size bed with headboard storage',
      category: 'bedroom',
      subcategory: 'beds',
      wholesalePrice: 28000,
      availableQuantity: 5,
      material: 'Oak Wood',
      dimensions: '200cm x 180cm x 120cm',
      weight: '80kg',
      imageUrl: 'https://images.unsplash.com/photo-1505693314120-0d443867891c?w=500',
      status: ProductStatus.ACTIVE,
      craftsmanId: 'craft-1',
      createdAt: new Date('2025-11-15')
    },
    {
      id: 'wp-3',
      name: 'Mahogany Coffee Table',
      description: 'Modern coffee table with storage',
      category: 'living-room',
      subcategory: 'tables',
      wholesalePrice: 15000,
      availableQuantity: 12,
      material: 'Mahogany',
      dimensions: '120cm x 60cm x 45cm',
      weight: '30kg',
      imageUrl: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=500',
      status: ProductStatus.ACTIVE,
      craftsmanId: 'craft-1',
      createdAt: new Date('2025-10-20')
    },
    {
      id: 'wp-4',
      name: 'Executive Office Desk',
      description: 'Professional desk with drawers',
      category: 'office',
      subcategory: 'desks',
      wholesalePrice: 25000,
      availableQuantity: 3,
      material: 'Walnut',
      dimensions: '160cm x 80cm x 75cm',
      weight: '55kg',
      imageUrl: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=500',
      status: ProductStatus.ACTIVE,
      craftsmanId: 'craft-1',
      createdAt: new Date('2025-09-10')
    },
    {
      id: 'wp-5',
      name: 'Pine Wood Bookshelf',
      description: '5-tier bookshelf with adjustable shelves',
      category: 'living-room',
      subcategory: 'storage',
      wholesalePrice: 12000,
      availableQuantity: 2,
      material: 'Pine Wood',
      dimensions: '180cm x 80cm x 30cm',
      weight: '35kg',
      imageUrl: 'https://images.unsplash.com/photo-1594620302200-9a762244a156?w=500',
      status: ProductStatus.ACTIVE,
      craftsmanId: 'craft-1',
      createdAt: new Date('2025-08-05')
    },
    {
      id: 'wp-6',
      name: 'Teak Wood Sofa Set',
      description: '3-seater sofa with cushions',
      category: 'living-room',
      subcategory: 'sofas',
      wholesalePrice: 35000,
      availableQuantity: 0,
      material: 'Teak Wood',
      dimensions: '200cm x 90cm x 85cm',
      weight: '65kg',
      imageUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=500',
      status: ProductStatus.OUT_OF_STOCK,
      craftsmanId: 'craft-1',
      createdAt: new Date('2025-07-15')
    }
  ];

  // Mock vendor orders data
  private vendorOrders: VendorOrder[] = [
    {
      id: 'vo-1',
      orderNumber: 'VO-2026-001',
      vendorName: 'WoodCraft Emporium',
      vendorEmail: 'vendor@woodcraft.com',
      productName: 'Premium Teak Wood Dining Table',
      quantity: 3,
      wholesalePrice: 22000,
      totalAmount: 66000,
      orderDate: new Date('2026-01-15'),
      expectedDeliveryDate: new Date('2026-02-15'),
      status: OrderStatus.PENDING,
      notes: 'Urgent delivery required'
    },
    {
      id: 'vo-2',
      orderNumber: 'VO-2026-002',
      vendorName: 'Furniture Plus',
      vendorEmail: 'contact@furnitureplus.com',
      productName: 'Handcrafted Oak Bed Frame',
      quantity: 2,
      wholesalePrice: 28000,
      totalAmount: 56000,
      orderDate: new Date('2026-01-16'),
      expectedDeliveryDate: new Date('2026-02-20'),
      status: OrderStatus.ACCEPTED,
      notes: ''
    },
    {
      id: 'vo-3',
      orderNumber: 'VO-2026-003',
      vendorName: 'Modern Living Store',
      vendorEmail: 'info@modernliving.com',
      productName: 'Executive Office Desk',
      quantity: 4,
      wholesalePrice: 25000,
      totalAmount: 100000,
      orderDate: new Date('2026-01-17'),
      expectedDeliveryDate: new Date('2026-02-25'),
      status: OrderStatus.IN_PRODUCTION,
      notes: 'Custom finish requested'
    },
    {
      id: 'vo-4',
      orderNumber: 'VO-2026-004',
      vendorName: 'Elite Furniture Hub',
      vendorEmail: 'sales@elitefurniture.com',
      productName: 'Premium Teak Wood Dining Table',
      quantity: 2,
      wholesalePrice: 22000,
      totalAmount: 44000,
      orderDate: new Date('2026-01-18'),
      expectedDeliveryDate: new Date('2026-03-01'),
      status: OrderStatus.IN_PRODUCTION,
      notes: ''
    },
    {
      id: 'vo-5',
      orderNumber: 'VO-2026-005',
      vendorName: 'Home Decor Mart',
      vendorEmail: 'orders@homedecormart.com',
      productName: 'Mahogany Coffee Table',
      quantity: 6,
      wholesalePrice: 15000,
      totalAmount: 90000,
      orderDate: new Date('2026-01-19'),
      expectedDeliveryDate: new Date('2026-02-10'),
      status: OrderStatus.READY_FOR_DISPATCH,
      notes: 'Quality check completed'
    }
  ];

  constructor() { }

  // Dashboard Stats
  getDashboardStats(): Observable<DashboardStats> {
    const activeOrders = this.vendorOrders.filter(o => 
      o.status !== OrderStatus.DISPATCHED
    ).length;
    const inProduction = this.vendorOrders.filter(o => 
      o.status === OrderStatus.IN_PRODUCTION
    ).length;
    const lowStock = this.wholesaleProducts.filter(p => 
      p.availableQuantity < 5 && p.status === ProductStatus.ACTIVE
    ).length;

    const stats: DashboardStats = {
      totalProducts: this.wholesaleProducts.filter(p => p.status === ProductStatus.ACTIVE).length,
      activeVendorOrders: activeOrders,
      ordersInProduction: inProduction,
      lowStockProducts: lowStock
    };

    return of(stats).pipe(delay(300));
  }

  // Wholesale Products
  getWholesaleProducts(): Observable<WholesaleProduct[]> {
    return of([...this.wholesaleProducts]).pipe(delay(300));
  }

  addWholesaleProduct(product: Omit<WholesaleProduct, 'id' | 'createdAt'>): Observable<WholesaleProduct> {
    const newProduct: WholesaleProduct = {
      ...product,
      id: 'wp-' + (this.wholesaleProducts.length + 1),
      createdAt: new Date()
    };
    this.wholesaleProducts.push(newProduct);
    return of(newProduct).pipe(delay(300));
  }

  updateWholesaleProduct(id: string, updates: Partial<WholesaleProduct>): Observable<boolean> {
    const index = this.wholesaleProducts.findIndex(p => p.id === id);
    if (index !== -1) {
      this.wholesaleProducts[index] = { ...this.wholesaleProducts[index], ...updates };
      return of(true).pipe(delay(300));
    }
    return of(false).pipe(delay(300));
  }

  deleteWholesaleProduct(id: string): Observable<boolean> {
    const index = this.wholesaleProducts.findIndex(p => p.id === id);
    if (index !== -1) {
      this.wholesaleProducts.splice(index, 1);
      return of(true).pipe(delay(300));
    }
    return of(false).pipe(delay(300));
  }

  // Vendor Orders
  getVendorOrders(): Observable<VendorOrder[]> {
    return of([...this.vendorOrders]).pipe(delay(300));
  }

  updateOrderStatus(orderId: string, status: OrderStatus, expectedDeliveryDate?: Date): Observable<boolean> {
    const order = this.vendorOrders.find(o => o.id === orderId);
    if (order) {
      order.status = status;
      if (expectedDeliveryDate) {
        order.expectedDeliveryDate = expectedDeliveryDate;
      }
      return of(true).pipe(delay(300));
    }
    return of(false).pipe(delay(300));
  }

  // Inventory
  getInventory(): Observable<InventoryItem[]> {
    const inventory: InventoryItem[] = this.wholesaleProducts.map(p => {
      // Calculate reserved quantity from pending/in-production orders
      const reserved = this.vendorOrders
        .filter(o => o.productName === p.name && 
                     (o.status === OrderStatus.PENDING || 
                      o.status === OrderStatus.ACCEPTED || 
                      o.status === OrderStatus.IN_PRODUCTION))
        .reduce((sum, o) => sum + o.quantity, 0);
      
      // Calculate in-production quantity
      const inProduction = this.vendorOrders
        .filter(o => o.productName === p.name && o.status === OrderStatus.IN_PRODUCTION)
        .reduce((sum, o) => sum + o.quantity, 0);

      return {
        id: p.id,
        productId: p.id,
        productName: p.name,
        category: p.category,
        availableQuantity: p.availableQuantity,
        inProduction: inProduction,
        reserved: reserved,
        material: p.material,
        wholesalePrice: p.wholesalePrice,
        status: p.status,
        lastUpdated: new Date()
      };
    });
    return of(inventory).pipe(delay(300));
  }

  updateInventoryQuantity(productId: string, quantity: number): Observable<boolean> {
    const product = this.wholesaleProducts.find(p => p.id === productId);
    if (product) {
      product.availableQuantity = quantity;
      if (quantity === 0) {
        product.status = ProductStatus.OUT_OF_STOCK;
      } else if (product.status === ProductStatus.OUT_OF_STOCK) {
        product.status = ProductStatus.ACTIVE;
      }
      return of(true).pipe(delay(300));
    }
    return of(false).pipe(delay(300));
  }
}
