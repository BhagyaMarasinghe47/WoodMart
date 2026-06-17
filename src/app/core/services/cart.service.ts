import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Cart, CartActionResult, CartItem } from '../models/cart-item.model';
import { AuthService } from './auth.service';
import { UserRole } from '../models/user.model';
import { ToastService } from './toast.service';
import { ConfirmDialogService } from './confirm-dialog.service';

interface ApiCartItemDto {
  id: number;
  productId: number;
  productName: string;
  price: number;
  quantity: number;
  totalPrice: number;
  productImageUrl?: string | null;
  availableStock?: number;
  addedAt?: string;
}

interface ApiShoppingCartDto {
  id?: number;
  customerId?: number;
  items: ApiCartItemDto[];
  itemCount: number;
  subtotal: number;
  total: number;
  updatedAt?: string;
}

const DEFAULT_PRODUCT_IMAGE = 'assets/images/hero-bg.jpg';
const API_BASE = environment.apiUrl.replace('/api', '');

function resolveCartImage(url?: string | null): string {
  if (!url) return DEFAULT_PRODUCT_IMAGE;
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('assets/')) return url;
  return `${API_BASE}/${url}`;
}

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private readonly apiUrl = `${environment.apiUrl}/cart`;
  private cartSubject: BehaviorSubject<Cart>;
  public cart: Observable<Cart>;

  constructor(
    private http: HttpClient,
    private auth: AuthService,
    private router: Router,
    private toast: ToastService,
    private confirmDialog: ConfirmDialogService
  ) {
    this.cartSubject = new BehaviorSubject<Cart>(this.emptyCart());
    this.cart = this.cartSubject.asObservable();

    this.auth.currentUser.subscribe(user => {
      if (user?.role === UserRole.CUSTOMER && this.auth.getToken()) {
        this.loadCart().subscribe();
      } else {
        this.setCart(this.emptyCart());
      }
    });

    const user = this.auth.currentUserValue;
    if (user?.role === UserRole.CUSTOMER && this.auth.getToken()) {
      this.loadCart().subscribe();
    }
  }

  public get cartValue(): Cart {
    return this.cartSubject.value;
  }

  loadCart(): Observable<Cart> {
    if (!this.canUseApiCart()) {
      this.setCart(this.emptyCart());
      return of(this.emptyCart());
    }

    return this.http.get<ApiShoppingCartDto>(this.apiUrl).pipe(
      map(dto => this.mapApiCart(dto)),
      tap(cart => this.setCart(cart)),
      catchError(err => {
        console.error('Failed to load cart:', err);
        this.setCart(this.emptyCart());
        return of(this.emptyCart());
      })
    );
  }

  addToCart(
    productId: string,
    productName: string,
    productImage: string,
    price: number,
    maxStock: number,
    quantity = 1
  ): Observable<CartActionResult> {
    if (!this.auth.isAuthenticated()) {
      return of({ success: false, message: 'Please log in to add items to your cart.', loginRequired: true });
    }

    if (this.auth.currentUserValue?.role !== UserRole.CUSTOMER) {
      return of({ success: false, message: 'Only customer accounts can use the shopping cart.' });
    }

    const productIdNum = parseInt(productId, 10);
    if (Number.isNaN(productIdNum)) {
      return of({ success: false, message: 'Invalid product.' });
    }

    return this.http.post<ApiShoppingCartDto>(`${this.apiUrl}/items`, {
      productId: productIdNum,
      quantity
    }).pipe(
      map(dto => {
        this.setCart(this.mapApiCart(dto));
        return { success: true, message: `${productName} added to cart.` };
      }),
      catchError(err => this.handleCartError(err, 'Could not add item to cart.'))
    );
  }

  updateQuantity(cartItemId: string, quantity: number): Observable<CartActionResult> {
    if (!this.canUseApiCart()) {
      return of({ success: false, message: 'Please log in to update your cart.', loginRequired: true });
    }

    const id = parseInt(cartItemId, 10);
    return this.http.put<ApiShoppingCartDto>(`${this.apiUrl}/items/${id}`, { quantity }).pipe(
      map(dto => {
        this.setCart(this.mapApiCart(dto));
        return { success: true, message: 'Cart updated.' };
      }),
      catchError(err => this.handleCartError(err, 'Could not update cart.'))
    );
  }

  removeFromCart(cartItemId: string): Observable<CartActionResult> {
    if (!this.canUseApiCart()) {
      return of({ success: false, message: 'Please log in to update your cart.', loginRequired: true });
    }

    const id = parseInt(cartItemId, 10);
    return this.http.delete<ApiShoppingCartDto>(`${this.apiUrl}/items/${id}`).pipe(
      map(dto => {
        this.setCart(this.mapApiCart(dto));
        return { success: true, message: 'Item removed.' };
      }),
      catchError(err => this.handleCartError(err, 'Could not remove item.'))
    );
  }

  clearCart(): Observable<CartActionResult> {
    if (!this.canUseApiCart()) {
      return of({ success: false, message: 'Please log in to clear your cart.', loginRequired: true });
    }

    return this.http.delete<{ message: string }>(this.apiUrl).pipe(
      map(() => {
        this.setCart(this.emptyCart());
        return { success: true, message: 'Cart cleared.' };
      }),
      catchError(err => this.handleCartError(err, 'Could not clear cart.'))
    );
  }

  notifyAddResult(result: CartActionResult, productName?: string, returnUrl?: string): void {
    if (result.loginRequired) {
      const message = result.message || 'Please log in as a customer to add items to your cart.';
      this.confirmDialog.confirm(message, 'Go to Login', 'Cancel').then(goToLogin => {
        if (goToLogin) {
          this.router.navigate(['/login'], {
            queryParams: { returnUrl: returnUrl || this.router.url }
          });
        }
      });
      return;
    }

    if (result.success) {
      this.toast.success(productName ? `${productName} added to cart!` : 'Added to cart!');
    } else if (result.message) {
      this.toast.error(result.message);
    }
  }

  getItemCount(): number {
    return this.cartValue.totalItems;
  }

  private canUseApiCart(): boolean {
    return (
      this.auth.isAuthenticated() &&
      this.auth.currentUserValue?.role === UserRole.CUSTOMER &&
      !!this.auth.getToken()
    );
  }

  private mapApiCart(dto: ApiShoppingCartDto): Cart {
    const items: CartItem[] = (dto.items || []).map(item => ({
      cartItemId: String(item.id),
      productId: String(item.productId),
      productName: item.productName,
      productImage: resolveCartImage(item.productImageUrl),
      quantity: item.quantity,
      price: Number(item.price),
      maxStock: item.availableStock ?? 99
    }));

    return {
      items,
      totalItems: dto.itemCount ?? items.reduce((sum, i) => sum + i.quantity, 0),
      totalPrice: Number(dto.total ?? dto.subtotal ?? 0)
    };
  }

  private setCart(cart: Cart): void {
    this.cartSubject.next(cart);
  }

  private emptyCart(): Cart {
    return { items: [], totalItems: 0, totalPrice: 0 };
  }

  private handleCartError(err: unknown, fallback: string): Observable<CartActionResult> {
    const httpErr = err as HttpErrorResponse;
    const loginRequired = httpErr?.status === 401;
    const message = this.extractErrorMessage(httpErr, fallback, loginRequired);
    return of({ success: false, message, loginRequired });
  }

  private extractErrorMessage(
    err: HttpErrorResponse | undefined,
    fallback: string,
    loginRequired: boolean
  ): string {
    if (loginRequired) {
      return 'Your session has expired. Please log in again as a customer.';
    }
    if (err?.status === 0) {
      return 'Cannot reach the server. Make sure the API is running on port 5037.';
    }
    const body = err?.error;
    if (typeof body === 'string' && body.trim()) {
      return body;
    }
    if (body && typeof body === 'object' && 'message' in body && body.message) {
      return String(body.message);
    }
    return fallback;
  }
}
