import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ProductService } from '../../core/services/product.service';
import { CartService } from '../../core/services/cart.service';
import { Product, Category } from '../../core/models/product.model';
import { slugify } from '../../core/utils/slug.util';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  @ViewChild('scrollContainer') scrollContainer!: ElementRef;
  featuredProducts: Product[] = [];
  categories: Category[] = [];
  loading = true;
  isAtStart = true;
  isAtEnd = false;
  shopTheLook = [
    {
      title: 'Bedroom Serenity',
      category: 'Bedroom Furniture',
      imageUrl: '/assets/images/bedroom-serenity.jpg'
    },
    {
      title: 'Modern Office',
      category: 'Office Furniture',
      imageUrl: '/assets/images/office-space.jpg'
    },
    {
      title: 'Dining Elegance',
      category: 'Dining Room',
      imageUrl: '/assets/images/dining-elegance.jpg'
    },
    {
      title: 'Cozy Retreat',
      category: 'Living Room',
      imageUrl: '/assets/images/cozy-nook.jpg'
    },
    {
      title: 'Outdoor Living',
      category: 'Outdoor Furniture',
      imageUrl: '/assets/images/dining-room.jpg'
    }
  ];

  constructor(
    private productService: ProductService,
    private cartService: CartService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    forkJoin({
      products: this.productService.getAllProducts(),
      categories: this.productService.getAllCategories()
    }).subscribe({
      next: ({ products, categories }) => {
        this.featuredProducts = products.slice(0, 6);
        this.loading = false;

        // Build per-category count and first real image from actual product list
        const countMap = new Map<string, number>();
        const imageMap = new Map<string, string>();
        for (const p of products) {
          const key = p.category?.toLowerCase() ?? '';
          countMap.set(key, (countMap.get(key) ?? 0) + 1);
          if (!imageMap.has(key) && p.imageUrl && !p.imageUrl.includes('hero-bg')) {
            imageMap.set(key, p.imageUrl);
          }
        }

        this.categories = categories.map(cat => {
          const key = cat.name.toLowerCase();
          return {
            ...cat,
            productCount: countMap.get(key) ?? 0,
            imageUrl: imageMap.get(key) || cat.imageUrl
          };
        });
      },
      error: () => { this.loading = false; }
    });
  }

  scrollLeft(): void {
    const container = this.scrollContainer.nativeElement;
    container.scrollBy({ left: -240, behavior: 'smooth' });
    setTimeout(() => this.checkScrollPosition(), 300);
  }

  scrollRight(): void {
    const container = this.scrollContainer.nativeElement;
    container.scrollBy({ left: 240, behavior: 'smooth' });
    setTimeout(() => this.checkScrollPosition(), 300);
  }

  checkScrollPosition(): void {
    const container = this.scrollContainer.nativeElement;
    this.isAtStart = container.scrollLeft <= 0;
    this.isAtEnd = container.scrollLeft + container.clientWidth >= container.scrollWidth - 5;
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

  viewProduct(productId: string): void {
    this.router.navigate(['/product', productId]);
  }

  viewCategory(categoryName: string): void {
    this.router.navigate(['/category', slugify(categoryName)]);
  }

  viewAllProducts(): void {
    this.router.navigate(['/products']);
  }
}
