import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ProductService } from '../../core/services/product.service';
import { CartService } from '../../core/services/cart.service';
import { Product, Category } from '../../core/models/product.model';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  featuredProducts: Product[] = [];
  categories: Category[] = [];
  loading = true;

  constructor(
    private productService: ProductService,
    private cartService: CartService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadFeaturedProducts();
    this.loadCategories();
  }

  loadFeaturedProducts(): void {
    this.productService.getAllProducts().subscribe({
      next: (products) => {
        this.featuredProducts = products.slice(0, 6);
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading products:', error);
        this.loading = false;
      }
    });
  }

  loadCategories(): void {
    this.productService.getAllCategories().subscribe({
      next: (categories) => {
        this.categories = categories;
      },
      error: (error) => {
        console.error('Error loading categories:', error);
      }
    });
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

  viewCategory(categoryName: string): void {
    this.router.navigate(['/products'], { queryParams: { category: categoryName } });
  }

  viewAllProducts(): void {
    this.router.navigate(['/products']);
  }
}
