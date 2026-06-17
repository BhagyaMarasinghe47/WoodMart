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
  loading = true;
  errorMessage = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private categoryService: CategoryService,
    private cartService: CartService
  ) {}

  ngOnInit(): void {
    this.categoryService.loadCategories().subscribe({
      next: () => {
        this.route.params.subscribe(params => {
          const categorySlug = params['categoryName'];
          this.loadCategory(categorySlug);

          this.route.queryParams.subscribe(queryParams => {
            this.selectedSubCategory = queryParams['sub'] || null;
            this.loadProducts(categorySlug, this.selectedSubCategory);
          });
        });
      },
      error: () => {
        this.errorMessage = 'Failed to load categories.';
        this.loading = false;
      }
    });
  }

  loadCategory(slug: string): void {
    this.category = this.categoryService.getCategoryBySlug(slug);
    if (!this.category) {
      this.router.navigate(['/']);
    }
  }

  loadProducts(categorySlug: string, subCategorySlug: string | null): void {
    this.loading = true;
    this.errorMessage = '';

    const source = subCategorySlug
      ? this.categoryService.getProductsBySubCategory(categorySlug, subCategorySlug)
      : this.categoryService.getProductsByCategory(categorySlug);

    source.subscribe({
      next: (products) => {
        this.products = products;
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'Failed to load products.';
        this.loading = false;
      }
    });
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
    this.cartService.addToCart(
      product.id,
      product.name,
      product.image,
      product.price,
      product.stock ?? 99
    ).subscribe(result => this.cartService.notifyAddResult(result, product.name));
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
