import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CartService } from '../../core/services/cart.service';
import { AuthService } from '../../core/services/auth.service';
import { Cart, CartItem } from '../../core/models/cart-item.model';

@Component({
  selector: 'app-cart',
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.css']
})
export class CartComponent implements OnInit {
  cart: Cart = { items: [], totalItems: 0, totalPrice: 0 };

  constructor(
    private cartService: CartService,
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.cartService.cart.subscribe(cart => {
      this.cart = cart;
    });
  }

  updateQuantity(productId: string, quantity: number): void {
    this.cartService.updateQuantity(productId, quantity);
  }

  removeItem(productId: string): void {
    if (confirm('Remove this item from cart?')) {
      this.cartService.removeFromCart(productId);
    }
  }

  clearCart(): void {
    if (confirm('Clear all items from cart?')) {
      this.cartService.clearCart();
    }
  }

  proceedToCheckout(): void {
    if (this.authService.isAuthenticated()) {
      // User is logged in, proceed to checkout
      this.router.navigate(['/customer/checkout']);
    } else {
      // User not logged in, redirect to login with return URL
      this.router.navigate(['/login'], { 
        queryParams: { returnUrl: '/customer/checkout' } 
      });
    }
  }

  continueShopping(): void {
    this.router.navigate(['/products']);
  }
}
