import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {
  constructor(
    private router: Router,
    private authService: AuthService
  ) { }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    const currentUser = this.authService.currentUserValue;
    
    if (!currentUser) {
      this.router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
      return false;
    }

    // Get expected roles from route data
    const expectedRoles = route.data['roles'] as UserRole[];
    
    if (expectedRoles && expectedRoles.length > 0) {
      if (this.authService.hasRole(expectedRoles)) {
        return true;
      } else {
        // Role not authorized, redirect to appropriate dashboard
        const dashboardRoute = this.authService.getDashboardRoute(currentUser.role);
        this.router.navigate([dashboardRoute]);
        return false;
      }
    }

    return true;
  }
}
