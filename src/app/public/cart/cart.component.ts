import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CartService } from '../../core/services/cart.service';
import { AuthService } from '../../core/services/auth.service';
import { Cart, CartItem } from '../../core/models/cart-item.model';
import { UserRole } from '../../core/models/user.model';
import { ToastService } from '../../core/services/toast.service';
import { ConfirmDialogService } from '../../core/services/confirm-dialog.service';

@Component({
  selector: 'app-cart',
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.css']
})
export class CartComponent implements OnInit {
  cart: Cart = { items: [], totalItems: 0, totalPrice: 0 };
  loading = false;
  isGuest = true;
  loginRequired = false;

  constructor(
    private cartService: CartService,
    private authService: AuthService,
    private router: Router,
    private toast: ToastService,
    private confirmDialog: ConfirmDialogService
  ) { }

  ngOnInit(): void {
    this.isGuest = !this.authService.isAuthenticated();
    this.loginRequired = this.isGuest;

    this.cartService.cart.subscribe(cart => {
      this.cart = cart;
    });

    if (this.authService.isAuthenticated() &&
        this.authService.currentUserValue?.role === UserRole.CUSTOMER) {
      this.loading = true;
      this.cartService.loadCart().subscribe({
        next: () => { this.loading = false; },
        error: () => { this.loading = false; }
      });
    }
  }

  updateQuantity(item: CartItem, quantity: number): void {
    if (quantity > item.maxStock) {
      this.toast.warning(`Only ${item.maxStock} item(s) available in stock.`);
      return;
    }

    this.cartService.updateQuantity(item.cartItemId, quantity).subscribe(result => {
      if (result.loginRequired) {
        this.cartService.notifyAddResult(result, undefined, '/cart');
        return;
      }
      if (!result.success && result.message) {
        this.toast.error(result.message);
      }
    });
  }

  removeItem(item: CartItem): void {
    this.confirmDialog.confirm('Remove this item from cart?', 'Remove', 'Cancel').then(confirmed => {
      if (!confirmed) return;
      this.cartService.removeFromCart(item.cartItemId).subscribe(result => {
        if (!result.success && result.message) {
          this.toast.error(result.message);
        }
      });
    });
  }

  clearCart(): void {
    this.confirmDialog.confirm('Clear all items from cart?', 'Clear Cart', 'Cancel').then(confirmed => {
      if (!confirmed) return;
      this.cartService.clearCart().subscribe(result => {
        if (result.loginRequired) {
          this.cartService.notifyAddResult(result, undefined, '/cart');
          return;
        }
        if (!result.success && result.message) {
          this.toast.error(result.message);
        }
      });
    });
  }

  proceedToCheckout(): void {
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/customer/checkout']);
    } else {
      this.router.navigate(['/login'], {
        queryParams: { returnUrl: '/customer/checkout' }
      });
    }
  }

  continueShopping(): void {
    this.router.navigate(['/products']);
  }

  goToLogin(): void {
    this.router.navigate(['/login'], { queryParams: { returnUrl: '/cart' } });
  }
}
