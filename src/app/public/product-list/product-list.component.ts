import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductService } from '../../core/services/product.service';
import { CartService } from '../../core/services/cart.service';
import { AuthService } from '../../core/services/auth.service';
import { WishlistService } from '../../core/services/wishlist.service';
import { CategoryService, Category } from '../../core/services/category.service';
import { Product } from '../../core/models/product.model';
import { UserRole } from '../../core/models/user.model';
import { ConfirmDialogService } from '../../core/services/confirm-dialog.service';

@Component({
  selector: 'app-product-list',
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.css']
})
export class ProductListComponent implements OnInit {
  products: Product[] = [];
  filteredProducts: Product[] = [];
  categories: Category[] = [];
  loading = true;
  searchQuery = '';
  searchInput = '';
  selectedCategory = '';
  vendorFilter = '';
  showFilters = false;
  sortBy = 'best-selling';
  inStockOnly = false;
  minPrice: number | null = null;
  maxPrice: number | null = null;
  priceExpanded = true;

  wishlistInProgress = new Set<number>();

  constructor(
    private productService: ProductService,
    private cartService: CartService,
    private authService: AuthService,
    public wishlistService: WishlistService,
    private categoryService: CategoryService,
    private route: ActivatedRoute,
    private router: Router,
    private confirmDialog: ConfirmDialogService
  ) { }

  ngOnInit(): void {
    this.categoryService.loadCategories().subscribe(cats => {
      this.categories = cats;
    });

    this.route.queryParams.subscribe(params => {
      this.selectedCategory = params['category'] || '';
      this.searchQuery = params['search'] || '';
      this.searchInput = this.searchQuery;
      this.vendorFilter = params['vendor'] || '';
      this.loadProducts();
    });
  }

  loadProducts(): void {
    this.loading = true;
    const currentUser = this.authService.currentUserValue;

    let productRequest;
    if (this.vendorFilter) {
      productRequest = this.productService.getVendorProducts(this.vendorFilter, true);
    } else if (this.searchQuery.trim()) {
      productRequest = this.productService.searchProducts(this.searchQuery.trim());
    } else {
      productRequest = this.productService.getAllProducts();
    }

    productRequest.subscribe({
      next: (products) => {
        if (!this.vendorFilter && currentUser && currentUser.role === UserRole.VENDOR) {
          this.products = products.filter(p => p.vendorId === currentUser.id);
        } else {
          this.products = products;
        }
        this.applyFilters();
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  applyFilters(): void {
    let filtered = [...this.products];

    // Filter by category (match by name or slug)
    if (this.selectedCategory) {
      filtered = filtered.filter(p => {
        const cat = this.categories.find(c => c.id === this.selectedCategory);
        if (cat) return p.category.toLowerCase() === cat.name.toLowerCase();
        return p.category.toLowerCase() === this.selectedCategory.toLowerCase();
      });
    }

    // Filter by search query
    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query) ||
        (p.craftsmanName || '').toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query)
      );
    }

    // Filter by in stock only
    if (this.inStockOnly) {
      filtered = filtered.filter(p => p.stock > 0);
    }

    // Filter by price range
    if (this.minPrice !== null && this.minPrice > 0) {
      filtered = filtered.filter(p => p.retailPrice >= this.minPrice!);
    }
    if (this.maxPrice !== null && this.maxPrice > 0) {
      filtered = filtered.filter(p => p.retailPrice <= this.maxPrice!);
    }

    // Apply sorting
    this.sortProducts(filtered);

    this.filteredProducts = filtered;
  }

  sortProducts(products: Product[]): void {
    switch (this.sortBy) {
      case 'price-low':
        products.sort((a, b) => a.retailPrice - b.retailPrice);
        break;
      case 'price-high':
        products.sort((a, b) => b.retailPrice - a.retailPrice);
        break;
      case 'name':
        products.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'best-selling':
      default:
        // Keep original order or implement best-selling logic
        break;
    }
  }

  onSearchInput(event?: KeyboardEvent): void {
    if (event && event.key !== 'Enter') return;
    this.searchQuery = this.searchInput.trim();
    this.applyFilters();
  }

  onCategoryChange(): void {
    this.applyFilters();
  }

  onSortChange(): void {
    this.applyFilters();
  }

  toggleFilters(): void {
    this.showFilters = !this.showFilters;
  }

  togglePriceSection(): void {
    this.priceExpanded = !this.priceExpanded;
  }

  clearFilters(): void {
    this.selectedCategory = '';
    this.searchQuery = '';
    this.searchInput = '';
    this.inStockOnly = false;
    this.minPrice = null;
    this.maxPrice = null;
    this.sortBy = 'best-selling';
    this.applyFilters();
  }

  removeSearchFilter(): void {
    this.searchQuery = '';
    this.searchInput = '';
    this.applyFilters();
  }

  removeCategoryFilter(): void {
    this.selectedCategory = '';
    this.applyFilters();
  }

  getCategoryLabel(id: string): string {
    return this.categories.find(c => c.id === id)?.name || id;
  }

  get activeFilterCount(): number {
    let count = 0;
    if (this.searchQuery) count++;
    if (this.selectedCategory) count++;
    if (this.inStockOnly) count++;
    if (this.minPrice) count++;
    if (this.maxPrice) count++;
    return count;
  }

  addToCart(product: Product): void {
    if (product.stock === 0) return;

    this.cartService.addToCart(
      product.id,
      product.name,
      product.imageUrl,
      product.retailPrice,
      product.stock
    ).subscribe(result => this.cartService.notifyAddResult(result, product.name));
  }

  toggleWishlist(product: Product, event: Event): void {
    event.stopPropagation();
    if (!this.authService.isAuthenticated() || this.authService.currentUserValue?.role !== UserRole.CUSTOMER) {
      this.confirmDialog.confirm('Please log in as a customer to save items to your wishlist.', 'Go to Login', 'Cancel')
        .then(go => { if (go) this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } }); });
      return;
    }
    const id = Number(product.id);
    if (this.wishlistInProgress.has(id)) return;
    this.wishlistInProgress.add(id);
    this.wishlistService.toggle(id).subscribe({
      next: () => this.wishlistInProgress.delete(id),
      error: () => this.wishlistInProgress.delete(id)
    });
  }

  isWishlisted(productId: string): boolean {
    return this.wishlistService.isWishlisted(Number(productId));
  }

  viewProduct(productId: string): void {
    this.router.navigate(['/product', productId]);
  }
}
