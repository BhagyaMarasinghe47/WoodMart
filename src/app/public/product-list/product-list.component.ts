import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductService } from '../../core/services/product.service';
import { CartService } from '../../core/services/cart.service';
import { Product } from '../../core/models/product.model';

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

  constructor(
    private productService: ProductService,
    private cartService: CartService,
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
        this.products = products;
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

    this.filteredProducts = filtered;
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  onCategoryChange(): void {
    this.applyFilters();
    // Update URL
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { category: this.selectedCategory || null },
      queryParamsHandling: 'merge'
    });
  }

  clearFilters(): void {
    this.selectedCategory = '';
    this.searchQuery = '';
    this.router.navigate(['/products']);
    this.applyFilters();
  }

  addToCart(product: Product): void {
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
