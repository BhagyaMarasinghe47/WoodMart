import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, map, catchError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ProductService } from './product.service';
import { Product } from '../models/product.model';
import { slugify } from '../utils/slug.util';

export interface SubCategory {
  id: string;
  name: string;
  slug: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  subCategories: SubCategory[];
}

export interface CategoryProduct {
  id: string;
  name: string;
  price: number;
  image: string;
  stock: number;
  vendorName: string;
  categorySlug: string;
  subCategorySlug: string;
}

interface ApiCategoryDto {
  id: number;
  name: string;
  description?: string;
  productCount: number;
  subcategories?: ApiSubcategoryDto[];
}

interface ApiSubcategoryDto {
  id: number;
  categoryId: number;
  name: string;
}

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private readonly categoriesApi = `${environment.apiUrl}/categories`;
  private categoriesCache: Category[] = [];

  constructor(
    private http: HttpClient,
    private productService: ProductService
  ) {}

  loadCategories(): Observable<Category[]> {
    return this.http.get<ApiCategoryDto[]>(this.categoriesApi).pipe(
      map(categories => {
        this.categoriesCache = categories.map(c => this.mapApiCategory(c));
        return this.categoriesCache;
      }),
      catchError(err => {
        console.error('Error loading categories:', err);
        return of([]);
      })
    );
  }

  getCategories(): Category[] {
    return this.categoriesCache;
  }

  getAllCategories(): Category[] {
    return this.categoriesCache;
  }

  getCategoryBySlug(slug: string): Category | undefined {
    return this.categoriesCache.find(cat => cat.slug === slug);
  }

  getProductsByCategory(categorySlug: string): Observable<CategoryProduct[]> {
    const category = this.getCategoryBySlug(categorySlug);
    if (!category) {
      return of([]);
    }

    return this.productService.getProductsByCategoryId(parseInt(category.id, 10)).pipe(
      map(products => products.map(p => this.mapProductToCategoryProduct(p, category.slug)))
    );
  }

  getProductsBySubCategory(categorySlug: string, subCategorySlug: string): Observable<CategoryProduct[]> {
    const category = this.getCategoryBySlug(categorySlug);
    if (!category) {
      return of([]);
    }

    const subCategory = category.subCategories.find(sc => sc.slug === subCategorySlug);
    if (!subCategory) {
      return of([]);
    }

    return this.productService.getProductsBySubcategoryId(parseInt(subCategory.id, 10)).pipe(
      map(products => products.map(p => this.mapProductToCategoryProduct(p, category.slug, subCategorySlug)))
    );
  }

  private mapApiCategory(dto: ApiCategoryDto): Category {
    return {
      id: String(dto.id),
      name: dto.name,
      slug: slugify(dto.name),
      subCategories: (dto.subcategories || []).map(sc => ({
        id: String(sc.id),
        name: sc.name,
        slug: slugify(sc.name)
      }))
    };
  }

  private mapProductToCategoryProduct(
    product: Product,
    categorySlug: string,
    subCategorySlug = ''
  ): CategoryProduct {
    return {
      id: product.id,
      name: product.name,
      price: product.retailPrice,
      image: product.imageUrl,
      stock: product.stock,
      vendorName: product.vendorName || 'WoodMart Vendor',
      categorySlug,
      subCategorySlug: subCategorySlug || (product.subcategory ? slugify(product.subcategory) : '')
    };
  }
}
