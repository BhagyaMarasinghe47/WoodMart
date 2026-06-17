import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { AppRoutingModule } from './app-routing.module';

// Core
import { AppComponent } from './app.component';

// Services
import { CraftsmanService } from './core/services/craftsman.service';
import { JwtInterceptor } from './core/services/jwt.interceptor';

// Shared Components
import { NavbarComponent } from './shared/navbar/navbar.component';
import { FooterComponent } from './shared/footer/footer.component';
import { CategoryBarComponent } from './shared/category-bar/category-bar.component';
import { ToastComponent } from './shared/toast/toast.component';
import { ConfirmDialogComponent } from './shared/confirm-dialog/confirm-dialog.component';

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

@NgModule({
  declarations: [
    AppComponent,
    // Shared
    NavbarComponent,
    FooterComponent,
    CategoryBarComponent,
    ToastComponent,
    ConfirmDialogComponent,
    // Public
    HomeComponent,
    ProductListComponent,
    ProductDetailComponent,
    CartComponent,
    ShopsComponent,
    CategoryComponent,
    WishlistComponent,
    // Auth
    LoginComponent,
    AuthSelectionComponent,
    RegisterComponent,
    // Role-based
    AdminDashboardComponent,
    UserManagementComponent,
    CraftsmanDashboardComponent,
    VendorDashboardComponent,
    CustomerDashboardComponent,
    CheckoutComponent,
    ProfileComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpClientModule,
    AppRoutingModule
  ],
  providers: [
    CraftsmanService,
    { provide: HTTP_INTERCEPTORS, useClass: JwtInterceptor, multi: true }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
