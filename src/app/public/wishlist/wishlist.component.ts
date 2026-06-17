import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { WishlistService, WishlistProduct } from '../../core/services/wishlist.service';
import { CartService } from '../../core/services/cart.service';
import { AuthService } from '../../core/services/auth.service';
import { UserRole } from '../../core/models/user.model';

@Component({
  selector: 'app-wishlist',
  templateUrl: './wishlist.component.html',
  styleUrls: ['./wishlist.component.css']
})
export class WishlistComponent implements OnInit {
  items: WishlistProduct[] = [];
  loading = true;
  actionInProgress = new Set<number>();

  constructor(
    private wishlistService: WishlistService,
    private cartService: CartService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (!this.authService.isAuthenticated() || this.authService.currentUserValue?.role !== UserRole.CUSTOMER) {
      this.router.navigate(['/login']);
      return;
    }
    this.load();
  }

  load(): void {
    this.loading = true;
    this.wishlistService.getWishlist().subscribe({
      next: items => {
        this.items = items.map(item => ({
          ...item,
          imageUrl: this.wishlistService.resolveImageUrl(item.imageUrl)
        }));
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  removeFromWishlist(item: WishlistProduct): void {
    if (this.actionInProgress.has(item.productId)) return;
    this.actionInProgress.add(item.productId);
    this.wishlistService.remove(item.productId).subscribe({
      next: () => {
        this.items = this.items.filter(i => i.productId !== item.productId);
        this.actionInProgress.delete(item.productId);
      },
      error: () => this.actionInProgress.delete(item.productId)
    });
  }

  addToCart(item: WishlistProduct): void {
    if (item.stock === 0) return;
    this.cartService.addToCart(
      String(item.productId),
      item.name,
      item.imageUrl,
      item.retailPrice,
      item.stock
    ).subscribe(result => this.cartService.notifyAddResult(result, item.name));
  }

  viewProduct(productId: number): void {
    this.router.navigate(['/product', productId]);
  }

  continueShopping(): void {
    this.router.navigate(['/products']);
  }

  isRemoving(productId: number): boolean {
    return this.actionInProgress.has(productId);
  }
}
