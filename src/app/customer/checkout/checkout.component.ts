import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CartService } from '../../core/services/cart.service';
import { OrderService, PaymentMethodOption } from '../../core/services/order.service';
import { AuthService } from '../../core/services/auth.service';
import { Cart } from '../../core/models/cart-item.model';
import { UserRole } from '../../core/models/user.model';
import { ToastService } from '../../core/services/toast.service';

interface FormErrors {
  fullName?: string;
  phone?: string;
  address?: string;
  city?: string;
}

@Component({
  selector: 'app-checkout',
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.css']
})
export class CheckoutComponent implements OnInit {
  cart: Cart = { items: [], totalItems: 0, totalPrice: 0 };
  paymentMethods: PaymentMethodOption[] = [];
  loading = true;
  submitting = false;
  showConfirmModal = false;
  formErrors: FormErrors = {};

  // Delivery fields
  fullName = '';
  phone = '';
  deliveryAddress = '';
  deliveryCity = '';
  deliveryState = '';
  deliveryPostalCode = '';
  notes = '';
  paymentMethodId = 0;

  constructor(
    private cartService: CartService,
    private orderService: OrderService,
    private authService: AuthService,
    private router: Router,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    const user = this.authService.currentUserValue;
    if (!this.authService.isAuthenticated() || user?.role !== UserRole.CUSTOMER) {
      this.router.navigate(['/login'], { queryParams: { returnUrl: '/customer/checkout' } });
      return;
    }

    if (user) {
      this.fullName = `${user.firstName} ${user.lastName}`.trim();
      this.phone = user.phone ?? '';
      this.deliveryCity = user.city ?? '';
      this.deliveryAddress = user.address ?? '';
    }

    this.cartService.loadCart().subscribe(cart => {
      this.cart = cart;
      this.loading = false;
      if (cart.items.length === 0) {
        this.router.navigate(['/cart']);
      }
    });

    this.orderService.getPaymentMethods().subscribe(methods => {
      this.paymentMethods = methods;
      if (methods.length > 0) this.paymentMethodId = methods[0].id;
    });
  }

  selectPayment(id: number): void {
    this.paymentMethodId = id;
  }

  get selectedPaymentMethod(): PaymentMethodOption | undefined {
    return this.paymentMethods.find(m => m.id === this.paymentMethodId);
  }

  paymentIcon(name: string): string {
    const n = (name ?? '').toLowerCase();
    if (n.includes('cash') || n.includes('delivery')) return 'cod';
    if (n.includes('bank') || n.includes('transfer')) return 'bank';
    return 'card';
  }

  validateForm(): boolean {
    this.formErrors = {};
    let valid = true;
    if (!this.fullName.trim()) {
      this.formErrors.fullName = 'Full name is required';
      valid = false;
    }
    if (!this.deliveryAddress.trim()) {
      this.formErrors.address = 'Street address is required';
      valid = false;
    }
    if (!this.deliveryCity.trim()) {
      this.formErrors.city = 'City is required';
      valid = false;
    }
    return valid;
  }

  reviewOrder(): void {
    if (!this.validateForm()) return;
    this.showConfirmModal = true;
  }

  cancelConfirm(): void {
    this.showConfirmModal = false;
  }

  placeOrder(): void {
    this.submitting = true;
    this.showConfirmModal = false;
    this.orderService.placeOrderFromCart({
      deliveryAddress: [this.deliveryAddress.trim(), this.deliveryState.trim()].filter(Boolean).join(', '),
      deliveryCity: this.deliveryCity.trim() || undefined,
      deliveryPostalCode: this.deliveryPostalCode.trim() || undefined,
      notes: [
        this.phone ? `Phone: ${this.phone.trim()}` : '',
        this.fullName ? `Name: ${this.fullName.trim()}` : '',
        this.notes.trim()
      ].filter(Boolean).join(' | ') || undefined,
      paymentMethodId: this.paymentMethodId
    }).subscribe(result => {
      this.submitting = false;
      if (result.success && result.order) {
        this.cartService.loadCart().subscribe();
        this.router.navigate(['/customer/orders'], {
          queryParams: { newOrder: result.order.orderNumber || result.order.id }
        });
      } else {
        this.toast.error(result.message || 'Failed to place order. Please try again.');
      }
    });
  }

  backToCart(): void {
    this.router.navigate(['/cart']);
  }

  resolveImage(url: string): string {
    if (!url) return '/assets/images/hero-bg.jpg';
    if (url.startsWith('http')) return url;
    return `http://localhost:5037/${url}`;
  }
}
