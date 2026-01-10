import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { CartService } from '../../core/services/cart.service';
import { User } from '../../core/models/user.model';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit {
  currentUser: User | null = null;
  cartItemCount = 0;
  searchQuery = '';

  constructor(
    public authService: AuthService,
    private cartService: CartService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.authService.currentUser.subscribe(user => {
      this.currentUser = user;
    });

    this.cartService.cart.subscribe(cart => {
      this.cartItemCount = cart.totalItems;
    });
  }

  onSearch(): void {
    if (this.searchQuery.trim()) {
      this.router.navigate(['/products'], { 
        queryParams: { search: this.searchQuery } 
      });
    }
  }

  logout(): void {
    this.authService.logout();
  }

  navigateToDashboard(): void {
    if (this.currentUser) {
      const dashboardRoute = this.authService.getDashboardRoute(this.currentUser.role);
      this.router.navigate([dashboardRoute]);
    }
  }
}
