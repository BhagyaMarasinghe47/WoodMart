import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { CartService } from '../../core/services/cart.service';
import { User } from '../../core/models/user.model';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit, OnDestroy {
  currentUser: User | null = null;
  cartItemCount = 0;
  isLoggedIn = false;
  userRole: string = '';
  showProfileDropdown = false;
  
  private subscriptions: Subscription[] = [];

  constructor(
    public authService: AuthService,
    private cartService: CartService,
    private router: Router
  ) { }

  ngOnInit(): void {
    // Subscribe to auth state changes
    const authSub = this.authService.currentUser.subscribe(user => {
      this.currentUser = user;
      this.isLoggedIn = !!user;
      this.userRole = user?.role || '';
    });
    this.subscriptions.push(authSub);

    // Subscribe to cart changes
    const cartSub = this.cartService.cart.subscribe(cart => {
      this.cartItemCount = cart.totalItems;
    });
    this.subscriptions.push(cartSub);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  // Role checking helpers
  isGuest(): boolean {
    return !this.isLoggedIn;
  }

  isCustomer(): boolean {
    return this.isLoggedIn && this.userRole === 'CUSTOMER';
  }

  isVendor(): boolean {
    return this.isLoggedIn && this.userRole === 'VENDOR';
  }

  isCraftsman(): boolean {
    return this.isLoggedIn && this.userRole === 'CRAFTSMAN';
  }

  isAdmin(): boolean {
    return this.isLoggedIn && this.userRole === 'ADMIN';
  }

  // Show cart for guests and customers only
  showCart(): boolean {
    return this.isGuest() || this.isCustomer();
  }

  // Show categories for everyone
  showCategories(): boolean {
    return true;
  }

  // Show search for everyone
  showSearch(): boolean {
    return true;
  }

  // Navigation methods
  navigateToDashboard(): void {
    if (!this.currentUser) return;

    switch (this.userRole) {
      case 'ADMIN':
        this.router.navigate(['/admin/dashboard']);
        break;
      case 'VENDOR':
        this.router.navigate(['/vendor/dashboard']);
        break;
      case 'CRAFTSMAN':
        this.router.navigate(['/craftsman/dashboard']);
        break;
      case 'CUSTOMER':
        this.router.navigate(['/customer/dashboard']);
        break;
      default:
        this.router.navigate(['/']);
    }
    this.showProfileDropdown = false;
  }

  navigateToOrders(): void {
    this.router.navigate(['/customer/orders']);
    this.showProfileDropdown = false;
  }

  navigateToUserManagement(): void {
    this.router.navigate(['/admin/users']);
    this.showProfileDropdown = false;
  }

  toggleProfileDropdown(): void {
    this.showProfileDropdown = !this.showProfileDropdown;
  }

  logout(): void {
    this.showProfileDropdown = false;
    this.authService.logout();
  }

  navigateToLogin(): void {
    this.router.navigate(['/login']);
  }

  navigateToRegister(): void {
    this.router.navigate(['/register']);
  }
}
