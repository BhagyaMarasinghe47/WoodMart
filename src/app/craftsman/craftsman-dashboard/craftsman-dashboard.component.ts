import { Component } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-craftsman-dashboard',
  template: `
    <div class="dashboard-container">
      <div class="dashboard-header">
        <h1>Craftsman Dashboard</h1>
        <button class="btn-logout" (click)="logout()">Logout</button>
      </div>
      <div class="content">
        <h2>Manage Your Products</h2>
        <p>This is your craftsman workspace. You can manage your wholesale products here.</p>
        <div class="info-card">
          <h3>✅ Features Available:</h3>
          <ul>
            <li>Manage wholesale product catalog</li>
            <li>View vendor bulk orders</li>
            <li>Update production status</li>
            <li>Track inventory levels</li>
          </ul>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-container { max-width: 1200px; margin: 0 auto; padding: 20px; }
    .dashboard-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
    .dashboard-header h1 { font-size: 2.5rem; color: #333; }
    .btn-logout { padding: 10px 20px; background: #e74c3c; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: bold; }
    .content { background: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    .content h2 { color: #333; margin-bottom: 15px; }
    .content p { color: #666; margin-bottom: 30px; }
    .info-card { background: #f8f9fa; padding: 25px; border-radius: 8px; border-left: 4px solid #8B4513; }
    .info-card h3 { color: #333; margin-bottom: 15px; }
    .info-card ul { color: #666; line-height: 2; }
  `]
})
export class CraftsmanDashboardComponent {
  constructor(private authService: AuthService) { }
  
  logout(): void {
    this.authService.logout();
  }
}
