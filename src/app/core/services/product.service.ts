import { Injectable } from '@angular/core';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import { Product, Category } from '../models/product.model';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private readonly STORAGE_KEY = 'woodmart_products';
  private productsSubject = new BehaviorSubject<Product[]>([]);
  public products$ = this.productsSubject.asObservable();

  private mockProducts: Product[] = [
    {
      id: 'p1',
      name: 'Dining Table Set',
      description: 'Beautiful solid oak dining table with smooth finish. Seats 6-8 people comfortably.',
      category: 'dining-room-furniture',
      wholesalePrice: 450,
      retailPrice: 699,
      stock: 15,
      imageUrl: 'https://images.unsplash.com/photo-1617806118233-18e1de247200?w=500',
      craftsmanId: '2',
      craftsmanName: 'John Carpenter',
      createdAt: new Date('2024-01-15'),
      isActive: true,
      dimensions: '180cm x 90cm x 75cm',
      material: 'Solid Oak',
      weight: '45kg'
    },
    {
      id: 'p2',
      name: 'Coffee Table',
      description: 'Elegant coffee table with storage compartment. Perfect for your living room.',
      category: 'living-room-furniture',
      wholesalePrice: 25,
      retailPrice: 45,
      stock: 50,
      imageUrl: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=500',
      craftsmanId: '2',
      craftsmanName: 'John Carpenter',
      createdAt: new Date('2024-02-01'),
      isActive: true,
      dimensions: '20cm x 25cm',
      material: 'Pine Wood',
      weight: '1kg'
    },
    {
      id: 'p3',
      name: 'Bookshelf',
      description: '5-tier bookshelf made from reclaimed wood. Eco-friendly and stylish.',
      category: 'living-room-furniture',
      wholesalePrice: 180,
      retailPrice: 299,
      stock: 8,
      imageUrl: 'https://images.unsplash.com/photo-1594620302200-9a762244a156?w=500',
      craftsmanId: '2',
      craftsmanName: 'John Carpenter',
      createdAt: new Date('2024-01-20'),
      isActive: true,
      dimensions: '90cm x 180cm x 30cm',
      material: 'Reclaimed Wood',
      weight: '35kg'
    },
    {
      id: 'p4',
      name: 'Wooden Bed (King Size)',
      description: 'Elegant king size wooden bed with solid construction and beautiful finish.',
      category: 'bedroom-furniture',
      wholesalePrice: 30,
      retailPrice: 55,
      stock: 100,
      imageUrl: 'https://images.unsplash.com/photo-1556909212-d5b604d0c90d?w=500',
      craftsmanId: '2',
      craftsmanName: 'John Carpenter',
      createdAt: new Date('2024-02-10'),
      isActive: true,
      dimensions: '30cm (longest)',
      material: 'Bamboo',
      weight: '0.5kg'
    },
    {
      id: 'p5',
      name: 'TV Stand / Console',
      description: 'Modern TV stand with multiple storage compartments for entertainment systems.',
      category: 'living-room-furniture',
      wholesalePrice: 120,
      retailPrice: 199,
      stock: 20,
      imageUrl: 'https://images.unsplash.com/photo-1532372320572-cda25653a26d?w=500',
      craftsmanId: '2',
      craftsmanName: 'John Carpenter',
      createdAt: new Date('2024-01-25'),
      isActive: true,
      dimensions: '120cm x 60cm x 45cm',
      material: 'Oak & Pine',
      weight: '25kg'
    },
    {
      id: 'p6',
      name: 'Dining Chairs (Set of 4)',
      description: 'Set of 4 elegant dining chairs with comfortable seating and solid wood construction.',
      category: 'dining-room-furniture',
      wholesalePrice: 40,
      retailPrice: 75,
      stock: 35,
      imageUrl: 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=500',
      craftsmanId: '2',
      craftsmanName: 'John Carpenter',
      createdAt: new Date('2024-02-05'),
      isActive: true,
      dimensions: '60cm x 20cm x 5cm',
      material: 'MDF Wood',
      weight: '3kg'
    }
  ];

  private mockCategories: Category[] = [
    {
      id: 'cat1',
      name: 'Living Room Furniture',
      description: 'Handcrafted wooden furniture for your living room',
      imageUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=500',
      productCount: 3
    },
    {
      id: 'cat2',
      name: 'Bedroom Furniture',
      description: 'Beautiful wooden furniture for your bedroom',
      imageUrl: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=500',
      productCount: 2
    },
    {
      id: 'cat3',
      name: 'Dining Room Furniture',
      description: 'Elegant wooden dining furniture',
      imageUrl: 'https://images.unsplash.com/photo-1617806118233-18e1de247200?w=500',
      productCount: 1
    }
  ];

  constructor() {
    this.loadProducts();
  }

  private loadProducts(): void {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (stored) {
      try {
        const parsedProducts = JSON.parse(stored);
        this.mockProducts = [...this.mockProducts, ...parsedProducts];
      } catch (e) {
        console.error('Error loading products from localStorage', e);
      }
    }
    this.productsSubject.next([...this.mockProducts]);
  }

  private saveProducts(): void {
    const vendorProducts = this.mockProducts.filter(p => p.vendorId);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(vendorProducts));
    this.productsSubject.next([...this.mockProducts]);
  }

  // Simulate API call with delay
  getAllProducts(): Observable<Product[]> {
    return of([...this.mockProducts]).pipe(delay(300));
  }

  getProductById(id: string): Observable<Product | undefined> {
    const product = this.mockProducts.find(p => p.id === id);
    return of(product).pipe(delay(300));
  }

  getProductsByCategory(category: string): Observable<Product[]> {
    const products = this.mockProducts.filter(p => p.category === category);
    return of(products).pipe(delay(300));
  }

  getAllCategories(): Observable<Category[]> {
    return of([...this.mockCategories]).pipe(delay(300));
  }

  searchProducts(query: string): Observable<Product[]> {
    const lowerQuery = query.toLowerCase();
    const results = this.mockProducts.filter(p =>
      p.name.toLowerCase().includes(lowerQuery) ||
      p.description.toLowerCase().includes(lowerQuery) ||
      p.category.toLowerCase().includes(lowerQuery)
    );
    return of(results).pipe(delay(300));
  }

  // Methods for Craftsman
  addProduct(product: Product): Observable<Product> {
    this.mockProducts.push(product);
    if (product.vendorId) {
      this.saveProducts();
    }
    return of(product).pipe(delay(300));
  }

  updateProduct(id: string, product: Partial<Product>): Observable<Product | undefined> {
    const index = this.mockProducts.findIndex(p => p.id === id);
    if (index !== -1) {
      this.mockProducts[index] = { ...this.mockProducts[index], ...product };
      if (this.mockProducts[index].vendorId) {
        this.saveProducts();
      }
      return of(this.mockProducts[index]).pipe(delay(300));
    }
    return of(undefined).pipe(delay(300));
  }

  deleteProduct(id: string): Observable<boolean> {
    const index = this.mockProducts.findIndex(p => p.id === id);
    if (index !== -1) {
      const product = this.mockProducts[index];
      this.mockProducts.splice(index, 1);
      if (product.vendorId) {
        this.saveProducts();
      }
      return of(true).pipe(delay(300));
    }
    return of(false).pipe(delay(300));
  }

  // Vendor-specific methods
  getVendorProducts(vendorId: string): Observable<Product[]> {
    const products = this.mockProducts.filter(p => p.vendorId === vendorId);
    return of(products).pipe(delay(300));
  }

  addVendorProduct(product: Omit<Product, 'id'>): Observable<Product> {
    const newProduct: Product = {
      ...product,
      id: 'vp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      createdAt: new Date(),
      isActive: true
    };
    this.mockProducts.push(newProduct);
    this.saveProducts();
    return of(newProduct).pipe(delay(300));
  }

  updateVendorProduct(id: string, updates: Partial<Product>): Observable<Product | undefined> {
    return this.updateProduct(id, updates);
  }

  deleteVendorProduct(id: string): Observable<boolean> {
    return this.deleteProduct(id);
  }

  generateProductId(): string {
    return 'vp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }
}
