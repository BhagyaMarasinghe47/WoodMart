import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  firstName = '';
  lastName = '';
  email = '';
  contactNumber = '';
  password = '';
  confirmPassword = '';
  cityArea = '';
  selectedRole: 'CUSTOMER' | 'VENDOR' | 'CRAFTSMAN' = 'CUSTOMER';
  
  // Vendor-specific fields
  shopName = '';
  businessRegistrationNumber = '';
  shopAddress = '';
  deliveryAvailable = false;
  
  errorMessage = '';
  successMessage = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  selectRole(role: 'CUSTOMER' | 'VENDOR' | 'CRAFTSMAN') {
    this.selectedRole = role;
  }

  onRegister() {
    this.errorMessage = '';
    this.successMessage = '';

    // Basic validation
    if (!this.firstName || !this.lastName || !this.email || !this.contactNumber || !this.password || !this.confirmPassword) {
      this.errorMessage = 'All required fields must be filled';
      return;
    }

    // Vendor-specific validation
    if (this.selectedRole === 'VENDOR') {
      if (!this.shopName || !this.businessRegistrationNumber || !this.shopAddress) {
        this.errorMessage = 'All shop details are required for vendor registration';
        return;
      }
    }

    if (this.password !== this.confirmPassword) {
      this.errorMessage = 'Passwords do not match';
      return;
    }

    if (this.password.length < 8) {
      this.errorMessage = 'Password must be at least 8 characters';
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.email)) {
      this.errorMessage = 'Invalid email format';
      return;
    }

    this.authService.register({
      firstName: this.firstName,
      lastName: this.lastName,
      email: this.email,
      contactNumber: this.contactNumber,
      password: this.password,
      cityArea: this.cityArea,
      role: this.selectedRole
    }).subscribe({
      next: (result) => {
        if (result.success) {
          this.successMessage = result.message;
          setTimeout(() => {
            this.router.navigate(['/login']);
          }, this.selectedRole === 'CUSTOMER' ? 1500 : 3000);
        } else {
          this.errorMessage = result.message;
        }
      },
      error: () => {
        this.errorMessage = 'Registration failed. Please try again.';
      }
    });
  }

  navigateToLogin() {
    this.router.navigate(['/login']);
  }
}
