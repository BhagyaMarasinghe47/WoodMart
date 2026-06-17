import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Product, Category } from '../models/product.model';
import { slugify } from '../utils/slug.util';

interface ApiProductDto {
  id: number;
  name: string;
  description: string;
  price: number;
  sellingPrice?: number;
  stockQuantity?: number;
  categoryId: number;
  categoryName?: string;
  subcategoryId?: number;
  subcategoryName?: string;
  imageUrl?: string;
  status: string;
  createdAt: string;
  vendorId?: number;
  vendorName?: string;
  craftsmanId?: number;
  craftsmanName?: string;
  material?: string;
  dimensions?: string;
  weight?: string;
}

interface ApiCategoryDto {
  id: number;
  name: string;
  description?: string;
  imageUrl?: string;
  productCount: number;
  subcategories?: ApiSubcategoryDto[];
}

interface ApiSubcategoryDto {
  id: number;
  categoryId: number;
  name: string;
  description?: string;
  productCount: number;
}

const DEFAULT_PRODUCT_IMAGE = 'assets/images/hero-bg.jpg';
const CATEGORY_IMAGES: Record<string, string> = {
  'bedroom furniture': 'assets/images/bedroom-serenity.jpg',
  'living room': 'assets/images/cozy-nook.jpg',
  'dining room': 'assets/images/dining-elegance.jpg',
  'office furniture': 'assets/images/office-space.jpg',
  'outdoor furniture': 'assets/images/hero-bg.jpg',
  'kitchen furniture': 'assets/images/hero-bg.jpg',
  'decorative items': 'assets/images/hero-bg.jpg'
};

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private readonly productsApi = `${environment.apiUrl}/products`;
  private readonly categoriesApi = `${environment.apiUrl}/categories`;
  private readonly STORAGE_KEY = 'woodmart_products';
  private productsSubject = new BehaviorSubject<Product[]>([]);
  public products$ = this.productsSubject.asObservable();

  constructor(private http: HttpClient) {}

  getAllProducts(pageSize = 100): Observable<Product[]> {
    const params = new HttpParams()
      .set('pageNumber', '1')
      .set('pageSize', String(pageSize));

    return this.http.get<ApiProductDto[]>(this.productsApi, { params }).pipe(
      map(products => products.map(p => this.mapApiProduct(p))),
      tap(products => this.productsSubject.next(products)),
      catchError(err => {
        console.error('Error loading products:', err);
        return of([]);
      })
    );
  }

  getProductById(id: string): Observable<Product | undefined> {
    return this.http.get<ApiProductDto>(`${this.productsApi}/${id}`).pipe(
      map(p => this.mapApiProduct(p)),
      catchError(err => {
        console.error('Error loading product:', err);
        return of(undefined);
      })
    );
  }

  getProductsByCategory(category: string): Observable<Product[]> {
    const numericId = parseInt(category, 10);
    if (!isNaN(numericId)) {
      return this.http.get<ApiProductDto[]>(`${this.productsApi}/category/${numericId}`).pipe(
        map(products => products.map(p => this.mapApiProduct(p))),
        catchError(() => of([]))
      );
    }

    return this.getAllProducts().pipe(
      map(products => products.filter(p =>
        p.category.toLowerCase() === category.toLowerCase() ||
        slugify(p.category) === slugify(category)
      ))
    );
  }

  getProductsByCategoryId(categoryId: number): Observable<Product[]> {
    return this.http.get<ApiProductDto[]>(`${this.productsApi}/category/${categoryId}`).pipe(
      map(products => products.map(p => this.mapApiProduct(p))),
      catchError(() => of([]))
    );
  }

  getProductsBySubcategoryId(subcategoryId: number): Observable<Product[]> {
    return this.http.get<ApiProductDto[]>(`${this.productsApi}/subcategory/${subcategoryId}`).pipe(
      map(products => products.map(p => this.mapApiProduct(p))),
      catchError(() => of([]))
    );
  }

  getAllCategories(): Observable<Category[]> {
    return this.http.get<ApiCategoryDto[]>(this.categoriesApi).pipe(
      map(categories => categories.map(c => this.mapApiCategory(c))),
      catchError(err => {
        console.error('Error loading categories:', err);
        return of([]);
      })
    );
  }

  searchProducts(query: string): Observable<Product[]> {
    const params = new HttpParams().set('term', query);
    return this.http.get<ApiProductDto[]>(`${this.productsApi}/search`, { params }).pipe(
      map(products => products.map(p => this.mapApiProduct(p))),
      catchError(() => of([]))
    );
  }

  // Vendor dashboard still uses local mock writes until wired separately
  addProduct(product: Product): Observable<Product> {
    const products = [...this.productsSubject.value, product];
    this.productsSubject.next(products);
    this.saveVendorProductsToStorage(products);
    return of(product);
  }

  updateProduct(id: string, product: Partial<Product>): Observable<Product | undefined> {
    const products = this.productsSubject.value;
    const index = products.findIndex(p => p.id === id);
    if (index === -1) {
      return of(undefined);
    }
    products[index] = { ...products[index], ...product };
    this.productsSubject.next([...products]);
    this.saveVendorProductsToStorage(products);
    return of(products[index]);
  }

  deleteProduct(id: string): Observable<boolean> {
    const products = this.productsSubject.value.filter(p => p.id !== id);
    this.productsSubject.next(products);
    this.saveVendorProductsToStorage(products);
    return of(true);
  }

  getVendorProducts(vendorId: string, publishedOnly = false): Observable<Product[]> {
    let params = new HttpParams();
    if (publishedOnly) {
      params = params.set('publishedOnly', 'true');
    }

    return this.http.get<ApiProductDto[]>(`${this.productsApi}/vendor/${vendorId}`, { params }).pipe(
      map(products => products.map(p => this.mapApiProduct(p))),
      catchError(() => of([]))
    );
  }

  addVendorProduct(product: Omit<Product, 'id'>): Observable<Product> {
    const newProduct: Product = {
      ...product,
      id: 'vp_' + Date.now(),
      createdAt: new Date(),
      isActive: true
    };
    return this.addProduct(newProduct);
  }

  updateVendorProduct(id: string, updates: Partial<Product>): Observable<Product | undefined> {
    return this.updateProduct(id, updates);
  }

  deleteVendorProduct(id: string): Observable<boolean> {
    return this.deleteProduct(id);
  }

  generateProductId(): string {
    return 'vp_' + Date.now();
  }

  private resolveImageUrl(url?: string): string {
    if (!url) return DEFAULT_PRODUCT_IMAGE;
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('assets/')) return url;
    const baseUrl = environment.apiUrl.replace('/api', '');
    return `${baseUrl}/${url}`;
  }

  private mapApiProduct(dto: ApiProductDto): Product {
    const categoryName = dto.categoryName || 'Uncategorized';
    const retailPrice = dto.sellingPrice ?? dto.price;

    return {
      id: String(dto.id),
      name: dto.name,
      description: dto.description,
      category: categoryName,
      categoryId: dto.categoryId,
      subcategory: dto.subcategoryName,
      subcategoryId: dto.subcategoryId,
      wholesalePrice: dto.price,
      retailPrice,
      stock: dto.stockQuantity ?? 0,
      imageUrl: this.resolveImageUrl(dto.imageUrl),
      craftsmanId: dto.craftsmanId ? String(dto.craftsmanId) : undefined,
      craftsmanName: dto.craftsmanName,
      vendorId: dto.vendorId ? String(dto.vendorId) : undefined,
      vendorName: dto.vendorName,
      createdAt: new Date(dto.createdAt),
      isActive: dto.status === 'Published' || dto.status === 'Active',
      material: dto.material,
      dimensions: dto.dimensions,
      weight: dto.weight
    };
  }

  private mapApiCategory(dto: ApiCategoryDto): Category {
    const nameKey = dto.name.toLowerCase();
    const imageUrl =
      dto.imageUrl ||
      CATEGORY_IMAGES[nameKey] ||
      Object.entries(CATEGORY_IMAGES).find(([key]) => nameKey.includes(key))?.[1] ||
      DEFAULT_PRODUCT_IMAGE;

    return {
      id: String(dto.id),
      name: dto.name,
      slug: slugify(dto.name),
      description: dto.description || '',
      imageUrl,
      productCount: dto.productCount
    };
  }

  private saveVendorProductsToStorage(products: Product[]): void {
    const vendorProducts = products.filter(p => p.vendorId);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(vendorProducts));
  }
}
