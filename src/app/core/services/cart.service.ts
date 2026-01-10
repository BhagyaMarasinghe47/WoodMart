import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { CartItem, Cart } from '../models/cart-item.model';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private readonly STORAGE_KEY = 'woodmart_cart';
  private cartSubject: BehaviorSubject<Cart>;
  public cart: Observable<Cart>;

  constructor() {
    const storedCart = localStorage.getItem(this.STORAGE_KEY);
    const initialCart: Cart = storedCart ? JSON.parse(storedCart) : { items: [], totalItems: 0, totalPrice: 0 };
    this.cartSubject = new BehaviorSubject<Cart>(initialCart);
    this.cart = this.cartSubject.asObservable();
  }

  public get cartValue(): Cart {
    return this.cartSubject.value;
  }

  addToCart(productId: string, productName: string, productImage: string, price: number, maxStock: number): void {
    const cart = this.cartValue;
    const existingItem = cart.items.find(item => item.productId === productId);

    if (existingItem) {
      if (existingItem.quantity < maxStock) {
        existingItem.quantity++;
      } else {
        alert('Maximum stock reached for this product');
        return;
      }
    } else {
      const newItem: CartItem = {
        productId,
        productName,
        productImage,
        quantity: 1,
        price,
        maxStock
      };
      cart.items.push(newItem);
    }

    this.updateCart(cart);
  }

  updateQuantity(productId: string, quantity: number): void {
    const cart = this.cartValue;
    const item = cart.items.find(i => i.productId === productId);
    
    if (item) {
      if (quantity <= 0) {
        this.removeFromCart(productId);
      } else if (quantity <= item.maxStock) {
        item.quantity = quantity;
        this.updateCart(cart);
      } else {
        alert('Quantity exceeds available stock');
      }
    }
  }

  removeFromCart(productId: string): void {
    const cart = this.cartValue;
    cart.items = cart.items.filter(item => item.productId !== productId);
    this.updateCart(cart);
  }

  clearCart(): void {
    const emptyCart: Cart = { items: [], totalItems: 0, totalPrice: 0 };
    this.updateCart(emptyCart);
  }

  private updateCart(cart: Cart): void {
    cart.totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);
    cart.totalPrice = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(cart));
    this.cartSubject.next(cart);
  }

  getItemCount(): number {
    return this.cartValue.totalItems;
  }
}
