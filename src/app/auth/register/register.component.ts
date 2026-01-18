import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  fullName = '';
  email = '';
  contactNumber = '';
  password = '';
  confirmPassword = '';
  cityArea = '';
  selectedRole: 'CUSTOMER' | 'VENDOR' | 'CRAFTSMAN' = 'CUSTOMER';
  
  // Vendor-specific fields
  pharmacyName = '';
  pharmacyRegistrationNumber = '';
  pharmacyAddress = '';
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
    if (!this.fullName || !this.email || !this.contactNumber || !this.password || !this.confirmPassword) {
      this.errorMessage = 'All required fields must be filled';
      return;
    }

    // Vendor-specific validation
    if (this.selectedRole === 'VENDOR') {
      if (!this.pharmacyName || !this.pharmacyRegistrationNumber || !this.pharmacyAddress) {
        this.errorMessage = 'All pharmacy details are required for vendor registration';
        return;
      }
    }

    if (this.password !== this.confirmPassword) {
      this.errorMessage = 'Passwords do not match';
      return;
    }

    if (this.password.length < 6) {
      this.errorMessage = 'Password must be at least 6 characters';
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.email)) {
      this.errorMessage = 'Invalid email format';
      return;
    }

    // Call register service
    const result = this.authService.register({
      fullName: this.fullName,
      email: this.email,
      contactNumber: this.contactNumber,
      password: this.password,
      cityArea: this.cityArea,
      role: this.selectedRole,
      // Vendor-specific fields
      pharmacyName: this.selectedRole === 'VENDOR' ? this.pharmacyName : undefined,
      pharmacyRegistrationNumber: this.selectedRole === 'VENDOR' ? this.pharmacyRegistrationNumber : undefined,
      pharmacyAddress: this.selectedRole === 'VENDOR' ? this.pharmacyAddress : undefined,
      deliveryAvailable: this.selectedRole === 'VENDOR' ? this.deliveryAvailable : undefined
    });

    if (result.success) {
      this.successMessage = result.message;
      
      // For CUSTOMER role, redirect to login immediately
      // For VENDOR/CRAFTSMAN, show approval message and redirect after 3 seconds
      setTimeout(() => {
        this.router.navigate(['/login']);
      }, 3000);
    } else {
      this.errorMessage = result.message;
    }
  }

  navigateToLogin() {
    this.router.navigate(['/login']);
  }
}
