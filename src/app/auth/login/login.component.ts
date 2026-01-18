import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { UserRole } from '../../core/models/user.model';

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

    this.loading = true;

    // Store selected role (for future API integration where role might be needed)
    localStorage.setItem('selectedRole', this.selectedRole);

    this.authService.login(this.email, this.password).subscribe({
      next: (user) => {
        if (user) {
          // Login successful
          const dashboardRoute = this.authService.getDashboardRoute(user.role);
          
          // If there's a return URL and it's not the login page, go there
          if (this.returnUrl && this.returnUrl !== '/' && this.returnUrl !== '/login') {
            this.router.navigate([this.returnUrl]);
          } else {
            // Otherwise go to role-specific dashboard
            this.router.navigate([dashboardRoute]);
          }
        } else {
          this.error = 'Invalid email or password, or account is pending approval';
          this.loading = false;
        }
      },
      error: (error) => {
        console.error('Login error:', error);
        this.error = 'An error occurred during login';
        this.loading = false;
      }
    });
  }

  navigateToRegister() {
    this.router.navigate(['/register']);
  }
}
