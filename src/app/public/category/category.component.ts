import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CategoryService, Category, CategoryProduct } from '../../core/services/category.service';
import { CartService } from '../../core/services/cart.service';

@Component({
  selector: 'app-category',
  templateUrl: './category.component.html',
  styleUrls: ['./category.component.css']
})
export class CategoryComponent implements OnInit {
  category: Category | undefined;
  products: CategoryProduct[] = [];
  selectedSubCategory: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private categoryService: CategoryService,
    private cartService: CartService
  ) {}

  ngOnInit(): void {
    // Listen to route params and query params
    this.route.params.subscribe(params => {
      const categorySlug = params['categoryName'];
      this.loadCategory(categorySlug);

      // Check if sub-category filter is applied
      this.route.queryParams.subscribe(queryParams => {
        this.selectedSubCategory = queryParams['sub'] || null;
        this.loadProducts(categorySlug, this.selectedSubCategory);
      });
    });
  }

  loadCategory(slug: string): void {
    this.category = this.categoryService.getCategoryBySlug(slug);
    if (!this.category) {
      // Category not found, redirect to home
      this.router.navigate(['/']);
    }
  }

  loadProducts(categorySlug: string, subCategorySlug: string | null): void {
    if (subCategorySlug) {
      // Filter by sub-category
      this.products = this.categoryService.getProductsBySubCategory(categorySlug, subCategorySlug);
    } else {
      // Show all products in category
      this.products = this.categoryService.getProductsByCategory(categorySlug);
    }
  }

  filterBySubCategory(subCategorySlug: string): void {
    if (!this.category) return;
    
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { sub: subCategorySlug },
      queryParamsHandling: 'merge'
    });
  }

  clearFilter(): void {
    if (!this.category) return;
    
    this.router.navigate(['/category', this.category.slug]);
  }

  addToCart(product: CategoryProduct): void {
    // Convert CategoryProduct to CartItem format
    // Using cart service with correct parameters
    this.cartService.addToCart(
      product.id,
      product.name,
      product.image,
      product.price,
      10 // Default max stock for demo
    );
  }

  viewProductDetail(productId: string): void {
    this.router.navigate(['/product', productId]);
  }

  getSubCategoryName(slug: string): string {
    if (!this.category) return '';
    const subCat = this.category.subCategories.find(sc => sc.slug === slug);
    return subCat ? subCat.name : '';
  }
}
