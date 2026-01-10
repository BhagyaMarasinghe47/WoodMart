import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { AppRoutingModule } from './app-routing.module';

// Core
import { AppComponent } from './app.component';

// Shared Components
import { NavbarComponent } from './shared/navbar/navbar.component';
import { FooterComponent } from './shared/footer/footer.component';

// Public Components
import { HomeComponent } from './public/home/home.component';
import { ProductListComponent } from './public/product-list/product-list.component';
import { ProductDetailComponent } from './public/product-detail/product-detail.component';
import { CartComponent } from './public/cart/cart.component';

// Auth Components
import { LoginComponent } from './auth/login/login.component';

// Role-based Components
import { AdminDashboardComponent } from './admin/admin-dashboard/admin-dashboard.component';
import { CraftsmanDashboardComponent } from './craftsman/craftsman-dashboard/craftsman-dashboard.component';
import { VendorDashboardComponent } from './vendor/vendor-dashboard/vendor-dashboard.component';
import { CustomerDashboardComponent } from './customer/customer-dashboard/customer-dashboard.component';

@NgModule({
  declarations: [
    AppComponent,
    // Shared
    NavbarComponent,
    FooterComponent,
    // Public
    HomeComponent,
    ProductListComponent,
    ProductDetailComponent,
    CartComponent,
    // Auth
    LoginComponent,
    // Role-based
    AdminDashboardComponent,
    CraftsmanDashboardComponent,
    VendorDashboardComponent,
    CustomerDashboardComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
