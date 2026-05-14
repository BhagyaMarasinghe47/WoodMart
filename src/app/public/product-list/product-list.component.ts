import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductService } from '../../core/services/product.service';
import { CartService } from '../../core/services/cart.service';
import { AuthService } from '../../core/services/auth.service';
import { Product } from '../../core/models/product.model';
import { UserRole } from '../../core/models/user.model';

@Component({
  selector: 'app-product-list',
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.css']
})
export class ProductListComponent implements OnInit {
  products: Product[] = [];
  filteredProducts: Product[] = [];
  loading = true;
  searchQuery = '';
  selectedCategory = '';
  showFilters = false;
  sortBy = 'best-selling';
  inStockOnly = false;
  minPrice: number | null = null;
  maxPrice: number | null = null;
  priceExpanded = true;

  constructor(
    private productService: ProductService,
    private cartService: CartService,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.selectedCategory = params['category'] || '';
      this.searchQuery = params['search'] || '';
      this.loadProducts();
    });
  }

  loadProducts(): void {
    this.loading = true;
    this.productService.getAllProducts().subscribe({
      next: (products) => {
        // If vendor is logged in, show only their products
        const currentUser = this.authService.currentUserValue;
        if (currentUser && currentUser.role === UserRole.VENDOR) {
          this.products = products.filter(p => p.vendorId === currentUser.id);
        } else {
          this.products = products;
        }
        this.applyFilters();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading products:', error);
        this.loading = false;
      }
    });
  }

  applyFilters(): void {
    let filtered = [...this.products];

    // Filter by category
    if (this.selectedCategory) {
      filtered = filtered.filter(p => 
        p.category.toLowerCase() === this.selectedCategory.toLowerCase()
      );
    }

    // Filter by search query
    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query)
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

  onSearchChange(): void {
    this.applyFilters();
  }

  onCategoryChange(): void {
    this.applyFilters();
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { category: this.selectedCategory || null },
      queryParamsHandling: 'merge'
    });
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
    this.inStockOnly = false;
    this.minPrice = null;
    this.maxPrice = null;
    this.sortBy = 'best-selling';
    this.router.navigate(['/products']);
    this.applyFilters();
  }

  addToCart(product: Product): void {
    if (product.stock === 0) return;
    
    this.cartService.addToCart(
      product.id,
      product.name,
      product.imageUrl,
      product.retailPrice,
      product.stock
    );
    alert(`${product.name} added to cart!`);
  }

  viewProduct(productId: string): void {
    this.router.navigate(['/product', productId]);
  }
}
