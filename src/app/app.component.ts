import { Component } from '@angular/core';
import { AuthService } from './core/services/auth.service';
import { UserRole } from './core/models/user.model';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'WoodMart - Handcrafted Wooden Products Marketplace';

  constructor(public authService: AuthService) {}

  shouldShowCategoryBar(): boolean {
    const user = this.authService.currentUserValue;
    // Hide category bar for vendors and craftsmen only
    if (user && (user.role === UserRole.VENDOR || user.role === UserRole.CRAFTSMAN)) {
      return false;
    }
    // Show for guests, customers, and admin
    return true;
  }
}
