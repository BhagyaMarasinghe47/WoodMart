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

  // Mock craftsmen products catalog
  private craftsmenProducts: CraftsmanProduct[] = [
    {
      id: 'cp-1',
      name: 'Handcrafted Teak Sofa',
      description: 'Premium 3-seater sofa made from solid teak wood',
      category: 'living-room',
      subcategory: 'sofas',
      wholesalePrice: 35000,
      material: 'Teak Wood',
      dimensions: '200cm x 90cm x 85cm',
      weight: '65kg',
      imageUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=500',
      craftsmanId: 'craft-1',
      craftsmanName: 'John Carpenter',
      isSelectedByVendor: true
    },
    {
      id: 'cp-2',
      name: 'Mahogany Dining Table',
      description: 'Elegant 6-seater dining table with smooth finish',
      category: 'dining-room',
      subcategory: 'tables',
      wholesalePrice: 22000,
      material: 'Mahogany',
      dimensions: '180cm x 90cm x 75cm',
      weight: '45kg',
      imageUrl: 'https://images.unsplash.com/photo-1617806118233-18e1de247200?w=500',
      craftsmanId: 'craft-1',
      craftsmanName: 'John Carpenter',
      isSelectedByVendor: true
    },
    {
      id: 'cp-3',
      name: 'King Size Oak Bed',
      description: 'Luxury bed frame with headboard storage',
      category: 'bedroom',
      subcategory: 'beds',
      wholesalePrice: 28000,
      material: 'Oak Wood',
      dimensions: '200cm x 180cm x 120cm',
      weight: '80kg',
      imageUrl: 'https://images.unsplash.com/photo-1505693314120-0d443867891c?w=500',
      craftsmanId: 'craft-2',
      craftsmanName: 'Robert Wood',
      isSelectedByVendor: true
    },
    {
      id: 'cp-4',
      name: 'Walnut Wardrobe',
      description: '4-door wardrobe with mirror and drawers',
      category: 'bedroom',
      subcategory: 'wardrobes',
      wholesalePrice: 32000,
      material: 'Walnut',
      dimensions: '240cm x 60cm x 220cm',
      weight: '95kg',
      imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500',
      craftsmanId: 'craft-2',
      craftsmanName: 'Robert Wood',
      isSelectedByVendor: false
    },
    {
      id: 'cp-5',
      name: 'Executive Office Desk',
      description: 'Professional desk with drawers and cable management',
      category: 'office',
      subcategory: 'desks',
      wholesalePrice: 25000,
      material: 'Engineered Wood',
      dimensions: '160cm x 80cm x 75cm',
      weight: '55kg',
      imageUrl: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=500',
      craftsmanId: 'craft-3',
      craftsmanName: 'Michael Oak',
      isSelectedByVendor: true
    },
    {
      id: 'cp-6',
      name: 'Ergonomic Office Chair',
      description: 'Comfortable chair with lumbar support',
      category: 'office',
      subcategory: 'chairs',
      wholesalePrice: 8000,
      material: 'Mesh & Steel',
      dimensions: '60cm x 60cm x 110cm',
      weight: '15kg',
      imageUrl: 'https://images.unsplash.com/photo-1580480055273-228ff5388ef8?w=500',
      craftsmanId: 'craft-3',
      craftsmanName: 'Michael Oak',
      isSelectedByVendor: false
    },
    {
      id: 'cp-7',
      name: 'Kids Study Table',
      description: 'Colorful study table with adjustable height',
      category: 'kids',
      subcategory: 'tables',
      wholesalePrice: 9000,
      material: 'Pine Wood',
      dimensions: '90cm x 60cm x 70cm',
      weight: '12kg',
      imageUrl: 'https://images.unsplash.com/photo-1542744095-291d1f67b221?w=500',
      craftsmanId: 'craft-3',
      craftsmanName: 'Michael Oak',
      isSelectedByVendor: false
    },
    {
      id: 'cp-8',
      name: 'Garden Bench',
      description: 'Weather-resistant outdoor bench',
      category: 'outdoor',
      subcategory: 'seating',
      wholesalePrice: 12000,
      material: 'Treated Pine',
      dimensions: '150cm x 55cm x 85cm',
      weight: '28kg',
      imageUrl: 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?w=500',
      craftsmanId: 'craft-4',
      craftsmanName: 'David Teak',
      isSelectedByVendor: false
    },
    {
      id: 'cp-9',
      name: 'Coffee Table Set',
      description: 'Modern coffee table with 2 side tables',
      category: 'living-room',
      subcategory: 'tables',
      wholesalePrice: 15000,
      material: 'Teak Wood',
      dimensions: '120cm x 60cm x 45cm',
      weight: '35kg',
      imageUrl: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=500',
      craftsmanId: 'craft-1',
      craftsmanName: 'John Carpenter',
      isSelectedByVendor: false
    },
    {
      id: 'cp-10',
      name: 'Bedside Table Pair',
      description: 'Set of 2 matching bedside tables with drawers',
      category: 'bedroom',
      subcategory: 'tables',
      wholesalePrice: 6000,
      material: 'Oak Wood',
      dimensions: '45cm x 40cm x 55cm',
      weight: '8kg each',
      imageUrl: 'https://images.unsplash.com/photo-1565183928294-7d22a3abb60e?w=500',
      craftsmanId: 'craft-2',
      craftsmanName: 'Robert Wood',
      isSelectedByVendor: false
    }
  ];

  // Mock vendor catalog products (selected from craftsmen)
  private vendorCatalog: VendorCatalogProduct[] = [
    {
      id: 'vc-1',
      craftsmanProductId: 'cp-1',
      name: 'Handcrafted Teak Sofa',
      description: 'Premium 3-seater sofa made from solid teak wood',
      category: 'living-room',
      subcategory: 'sofas',
      wholesalePrice: 35000,
      retailPrice: 45000,
      material: 'Teak Wood',
      dimensions: '200cm x 90cm x 85cm',
      weight: '65kg',
      imageUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=500',
      craftsmanId: 'craft-1',
      craftsmanName: 'John Carpenter',
      stock: 5,
      isPublished: true
    },
    {
      id: 'vc-2',
      craftsmanProductId: 'cp-2',
      name: 'Mahogany Dining Table',
      description: 'Elegant 6-seater dining table with smooth finish',
      category: 'dining-room',
      subcategory: 'tables',
      wholesalePrice: 22000,
      retailPrice: 28000,
      material: 'Mahogany',
      dimensions: '180cm x 90cm x 75cm',
      weight: '45kg',
      imageUrl: 'https://images.unsplash.com/photo-1617806118233-18e1de247200?w=500',
      craftsmanId: 'craft-1',
      craftsmanName: 'John Carpenter',
      stock: 3,
      isPublished: true
    },
    {
      id: 'vc-3',
      craftsmanProductId: 'cp-3',
      name: 'King Size Oak Bed',
      description: 'Luxury bed frame with headboard storage',
      category: 'bedroom',
      subcategory: 'beds',
      wholesalePrice: 28000,
      retailPrice: 35000,
      material: 'Oak Wood',
      dimensions: '200cm x 180cm x 120cm',
      weight: '80kg',
      imageUrl: 'https://images.unsplash.com/photo-1505693314120-0d443867891c?w=500',
      craftsmanId: 'craft-2',
      craftsmanName: 'Robert Wood',
      stock: 8,
      isPublished: true
    },
    {
      id: 'vc-4',
      craftsmanProductId: 'cp-5',
      name: 'Executive Office Desk',
      description: 'Professional desk with drawers and cable management',
      category: 'office',
      subcategory: 'desks',
      wholesalePrice: 25000,
      retailPrice: 32000,
      material: 'Engineered Wood',
      dimensions: '160cm x 80cm x 75cm',
      weight: '55kg',
      imageUrl: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=500',
      craftsmanId: 'craft-3',
      craftsmanName: 'Michael Oak',
      stock: 12,
      isPublished: true
    },
    {
      id: 'vc-5',
      craftsmanProductId: 'cp-1',
      name: 'Handcrafted Teak Sofa - Special Edition',
      description: 'Premium 3-seater sofa with custom cushions',
      category: 'living-room',
      subcategory: 'sofas',
      wholesalePrice: 35000,
      retailPrice: 48000,
      material: 'Teak Wood',
      dimensions: '200cm x 90cm x 85cm',
      weight: '65kg',
      imageUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=500',
      craftsmanId: 'craft-1',
      craftsmanName: 'John Carpenter',
      stock: 2,
      isPublished: false
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
    const publishedProducts = this.vendorCatalog.filter(p => p.isPublished).length;
    const lowStockProducts = this.vendorCatalog.filter(p => p.stock < 5).length;
    const pendingOrders = this.customerOrders.filter(o => o.status === OrderStatus.PENDING).length;
    
    const stats: DashboardStats = {
      totalProducts: publishedProducts,
      productsLowInStock: lowStockProducts,
      totalOrders: this.customerOrders.length,
      pendingOrders: pendingOrders,
      totalCraftsmenConnected: this.craftsmen.length,
      monthlySales: this.customerOrders.reduce((sum, order) => sum + order.totalAmount, 0)
    };
    return of(stats).pipe(delay(300));
  }

  // Get craftsmen products catalog
  getCraftsmenProducts(craftsmanId?: string): Observable<CraftsmanProduct[]> {
    if (craftsmanId) {
      return of(this.craftsmenProducts.filter(p => p.craftsmanId === craftsmanId)).pipe(delay(300));
    }
    return of(this.craftsmenProducts).pipe(delay(300));
  }

  // Get vendor catalog products
  getVendorCatalog(): Observable<VendorCatalogProduct[]> {
    return of(this.vendorCatalog).pipe(delay(300));
  }

  // Add product from craftsman to vendor catalog
  addToVendorCatalog(craftsmanProductId: string, retailPrice: number, stock: number): Observable<VendorCatalogProduct | null> {
    const craftsmanProduct = this.craftsmenProducts.find(p => p.id === craftsmanProductId);
    if (!craftsmanProduct) {
      return of(null).pipe(delay(300));
    }

    // Mark as selected
    craftsmanProduct.isSelectedByVendor = true;

    const newProduct: VendorCatalogProduct = {
      id: 'vc-' + (this.vendorCatalog.length + 1),
      craftsmanProductId: craftsmanProduct.id,
      name: craftsmanProduct.name,
      description: craftsmanProduct.description,
      category: craftsmanProduct.category,
      subcategory: craftsmanProduct.subcategory,
      wholesalePrice: craftsmanProduct.wholesalePrice,
      retailPrice: retailPrice,
      material: craftsmanProduct.material,
      dimensions: craftsmanProduct.dimensions,
      weight: craftsmanProduct.weight,
      imageUrl: craftsmanProduct.imageUrl,
      craftsmanId: craftsmanProduct.craftsmanId,
      craftsmanName: craftsmanProduct.craftsmanName,
      stock: stock,
      isPublished: false
    };

    this.vendorCatalog.push(newProduct);
    return of(newProduct).pipe(delay(300));
  }

  // Update vendor catalog product
  updateVendorCatalogProduct(productId: string, updates: Partial<VendorCatalogProduct>): Observable<boolean> {
    const product = this.vendorCatalog.find(p => p.id === productId);
    if (product) {
      Object.assign(product, updates);
      return of(true).pipe(delay(300));
    }
    return of(false).pipe(delay(300));
  }

  // Publish/Unpublish product
  togglePublishProduct(productId: string): Observable<boolean> {
    const product = this.vendorCatalog.find(p => p.id === productId);
    if (product) {
      product.isPublished = !product.isPublished;
      return of(true).pipe(delay(300));
    }
    return of(false).pipe(delay(300));
  }

  // Remove from vendor catalog
  removeFromVendorCatalog(productId: string): Observable<boolean> {
    const index = this.vendorCatalog.findIndex(p => p.id === productId);
    if (index !== -1) {
      const product = this.vendorCatalog[index];
      // Unmark as selected
      const craftsmanProduct = this.craftsmenProducts.find(p => p.id === product.craftsmanProductId);
      if (craftsmanProduct) {
        craftsmanProduct.isSelectedByVendor = false;
      }
      this.vendorCatalog.splice(index, 1);
      return of(true).pipe(delay(300));
    }
    return of(false).pipe(delay(300));
  }
}
