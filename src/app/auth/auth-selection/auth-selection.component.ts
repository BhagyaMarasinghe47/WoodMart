import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-auth-selection',
  templateUrl: './auth-selection.component.html',
  styleUrls: ['./auth-selection.component.css']
})
export class AuthSelectionComponent {
  constructor(private router: Router) {}

  navigateToLogin() {
    this.router.navigate(['/login']);
  }

  navigateToRegister() {
    this.router.navigate(['/register']);
  }
}
