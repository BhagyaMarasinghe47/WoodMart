import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  email = '';
  password = '';
  selectedRole: 'CUSTOMER' | 'VENDOR' | 'CRAFTSMAN' = 'CUSTOMER';
  loading = false;
  error = '';
  returnUrl = '/';
  showPassword = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    // If already logged in, redirect to appropriate dashboard
    if (this.authService.isAuthenticated()) {
      const user = this.authService.currentUserValue;
      if (user) {
        const dashboardRoute = this.authService.getDashboardRoute(user.role);
        this.router.navigate([dashboardRoute]);
      }
    }

    // Get return url from route parameters or default to '/'
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
  }

  onSubmit(): void {
    this.error = '';

    if (!this.email || !this.password) {
      this.error = 'Please enter both email and password';
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.email.trim())) {
      this.error = 'Please enter a valid email address (e.g. craftsman1@example.com)';
      return;
    }

    this.loading = true;

    // Store selected role (for future API integration where role might be needed)
    localStorage.setItem('selectedRole', this.selectedRole);

    this.authService.login(this.email, this.password).subscribe({
      next: (user) => {
        this.loading = false;
        const dashboardRoute = this.authService.getDashboardRoute(user!.role);

        if (this.returnUrl && this.returnUrl !== '/' && this.returnUrl !== '/login') {
          this.router.navigate([this.returnUrl]);
        } else {
          this.router.navigate([dashboardRoute]);
        }
      },
      error: (err: Error) => {
        this.error = err.message || 'Login failed. Please try again.';
        this.loading = false;
      }
    });
  }

  navigateToRegister() {
    this.router.navigate(['/register']);
  }
}
