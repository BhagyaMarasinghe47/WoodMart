import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
import { RoleGuard } from './core/guards/role.guard';
import { UserRole } from './core/models/user.model';

// Public Components
import { HomeComponent } from './public/home/home.component';
import { ProductListComponent } from './public/product-list/product-list.component';
import { ProductDetailComponent } from './public/product-detail/product-detail.component';
import { CartComponent } from './public/cart/cart.component';
import { ShopsComponent } from './public/shops/shops.component';
import { CategoryComponent } from './public/category/category.component';
import { WishlistComponent } from './public/wishlist/wishlist.component';

// Auth Components
import { LoginComponent } from './auth/login/login.component';
import { AuthSelectionComponent } from './auth/auth-selection/auth-selection.component';
import { RegisterComponent } from './auth/register/register.component';

// Role-based Components
import { AdminDashboardComponent } from './admin/admin-dashboard/admin-dashboard.component';
import { UserManagementComponent } from './admin/user-management/user-management.component';
import { CraftsmanDashboardComponent } from './craftsman/craftsman-dashboard/craftsman-dashboard.component';
import { VendorDashboardComponent } from './vendor/vendor-dashboard/vendor-dashboard.component';
import { CustomerDashboardComponent } from './customer/customer-dashboard/customer-dashboard.component';
import { CheckoutComponent } from './customer/checkout/checkout.component';
import { ProfileComponent } from './profile/profile.component';

const routes: Routes = [
  // Public Routes (NO AUTH REQUIRED)
  { path: '', component: HomeComponent },
  { path: 'products', component: ProductListComponent },
  { path: 'product/:id', component: ProductDetailComponent },
  { path: 'shops', component: ShopsComponent },
  { path: 'category/:categoryName', component: CategoryComponent },
  { path: 'cart', component: CartComponent },
  { path: 'wishlist', component: WishlistComponent, canActivate: [AuthGuard] },
  
  // Auth Routes
  { path: 'auth', component: AuthSelectionComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },

  // Admin Routes (ADMIN ONLY)
  {
    path: 'admin',
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: [UserRole.ADMIN] },
    children: [
      { path: 'dashboard', component: AdminDashboardComponent },
      { path: 'user-management', component: UserManagementComponent },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },

  // Craftsman Routes (CRAFTSMAN ONLY)
  {
    path: 'craftsman',
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: [UserRole.CRAFTSMAN] },
    children: [
      { path: 'dashboard', component: CraftsmanDashboardComponent },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },

  // Vendor Routes (VENDOR ONLY)
  {
    path: 'vendor',
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: [UserRole.VENDOR] },
    children: [
      { path: 'dashboard', component: VendorDashboardComponent },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },

  // Customer Routes (CUSTOMER ONLY - requires auth)
  {
    path: 'customer',
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: [UserRole.CUSTOMER, UserRole.ADMIN] },
    children: [
      { path: 'dashboard', component: CustomerDashboardComponent },
      { path: 'orders', component: CustomerDashboardComponent },
      { path: 'checkout', component: CheckoutComponent },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },

  // Profile (all authenticated users)
  { path: 'profile', component: ProfileComponent, canActivate: [AuthGuard] },

  // Redirect unknown routes to home
  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
