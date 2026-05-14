import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { VendorService } from '../../core/services/vendor.service';
import { User, UserRole, ApprovalStatus } from '../../core/models/user.model';

interface UserDetails extends User {
  shopName?: string;
  shopRegNumber?: string;
  businessLicense?: string;
  taxId?: string;
  location?: string;
  city?: string;
  district?: string;
  postalCode?: string;
  specialization?: string;
  experience?: number;
  certifications?: string[];
  portfolio?: string;
}

@Component({
  selector: 'app-user-management',
  templateUrl: './user-management.component.html',
  styleUrls: ['./user-management.component.css']
})
export class UserManagementComponent implements OnInit {
  allUsers: UserDetails[] = [];
  filteredUsers: UserDetails[] = [];
  selectedTab: UserRole = UserRole.CUSTOMER;
  searchQuery = '';
  selectedUser: UserDetails | null = null;
  showDetailsModal = false;

  UserRole = UserRole;

  customers: UserDetails[] = [];
  vendors: UserDetails[] = [];
  craftsmen: UserDetails[] = [];

  constructor(
    private authService: AuthService,
    private vendorService: VendorService
  ) {}

  ngOnInit(): void {
    this.loadAllUsers();
  }

  loadAllUsers(): void {
    // Load customers
    this.customers = [
      {
        id: '1',
        email: 'john.doe@email.com',
        firstName: 'John',
        lastName: 'Doe',
        role: UserRole.CUSTOMER,
        approvalStatus: ApprovalStatus.APPROVED,
        createdAt: new Date('2025-01-15'),
        phone: '+94 71 234 5678',
        address: '123 Main Street',
        city: 'Colombo',
        district: 'Colombo',
        postalCode: '00100',
        location: 'Colombo 3'
      },
      {
        id: '2',
        email: 'jane.smith@email.com',
        firstName: 'Jane',
        lastName: 'Smith',
        role: UserRole.CUSTOMER,
        approvalStatus: ApprovalStatus.APPROVED,
        createdAt: new Date('2025-01-10'),
        phone: '+94 77 345 6789',
        address: '456 Park Avenue',
        city: 'Kandy',
        district: 'Kandy',
        postalCode: '20000',
        location: 'Kandy City'
      },
      {
        id: '3',
        email: 'robert.wilson@email.com',
        firstName: 'Robert',
        lastName: 'Wilson',
        role: UserRole.CUSTOMER,
        approvalStatus: ApprovalStatus.APPROVED,
        createdAt: new Date('2025-01-12'),
        phone: '+94 76 456 7890',
        address: '789 Lake Road',
        city: 'Galle',
        district: 'Galle',
        postalCode: '80000',
        location: 'Galle Fort'
      }
    ];

    // Load vendors
    this.vendors = [
      {
        id: '4',
        email: 'woodcraft@vendor.com',
        firstName: 'Michael',
        lastName: 'Anderson',
        role: UserRole.VENDOR,
        approvalStatus: ApprovalStatus.APPROVED,
        createdAt: new Date('2024-12-01'),
        phone: '+94 11 234 5678',
        address: '15 Industrial Zone',
        shopName: 'WoodCraft Suppliers',
        shopRegNumber: 'WC-2024-001',
        businessLicense: 'BL-567890',
        taxId: 'TAX-123456',
        city: 'Colombo',
        district: 'Colombo',
        postalCode: '01000',
        location: 'Colombo 10'
      },
      {
        id: '5',
        email: 'timbertrade@vendor.com',
        firstName: 'Sarah',
        lastName: 'Johnson',
        role: UserRole.VENDOR,
        approvalStatus: ApprovalStatus.APPROVED,
        createdAt: new Date('2024-11-15'),
        phone: '+94 81 345 6789',
        address: '28 Commerce Street',
        shopName: 'Timber Trade Co.',
        shopRegNumber: 'TT-2024-002',
        businessLicense: 'BL-678901',
        taxId: 'TAX-234567',
        city: 'Kandy',
        district: 'Kandy',
        postalCode: '20000',
        location: 'Kandy Central'
      },
      {
        id: '6',
        email: 'premiumwood@vendor.com',
        firstName: 'David',
        lastName: 'Lee',
        role: UserRole.VENDOR,
        approvalStatus: ApprovalStatus.PENDING,
        createdAt: new Date('2026-01-05'),
        phone: '+94 91 456 7890',
        address: '42 Trading Avenue',
        shopName: 'Premium Wood Ltd.',
        shopRegNumber: 'PW-2026-003',
        businessLicense: 'BL-789012',
        taxId: 'TAX-345678',
        city: 'Galle',
        district: 'Galle',
        postalCode: '80000',
        location: 'Galle City'
      }
    ];

    // Load craftsmen
    this.craftsmen = [
      {
        id: '7',
        email: 'kamal.artisan@craftsman.com',
        firstName: 'Kamal',
        lastName: 'Perera',
        role: UserRole.CRAFTSMAN,
        approvalStatus: ApprovalStatus.APPROVED,
        createdAt: new Date('2024-10-20'),
        phone: '+94 71 567 8901',
        address: '5 Workshop Lane',
        specialization: 'Furniture Making',
        experience: 15,
        certifications: ['Master Craftsman', 'Traditional Woodwork'],
        portfolio: 'https://kamalcrafts.com',
        city: 'Colombo',
        district: 'Colombo',
        postalCode: '00600',
        location: 'Nugegoda'
      },
      {
        id: '8',
        email: 'nimal.wood@craftsman.com',
        firstName: 'Nimal',
        lastName: 'Silva',
        role: UserRole.CRAFTSMAN,
        approvalStatus: ApprovalStatus.APPROVED,
        createdAt: new Date('2024-09-15'),
        phone: '+94 77 678 9012',
        address: '12 Artisan Road',
        specialization: 'Carving & Sculpture',
        experience: 20,
        certifications: ['Wood Carving Expert', 'Design Excellence'],
        portfolio: 'https://nimalwood.lk',
        city: 'Kandy',
        district: 'Kandy',
        postalCode: '20100',
        location: 'Peradeniya'
      },
      {
        id: '9',
        email: 'pradeep.craft@craftsman.com',
        firstName: 'Pradeep',
        lastName: 'Fernando',
        role: UserRole.CRAFTSMAN,
        approvalStatus: ApprovalStatus.PENDING,
        createdAt: new Date('2026-01-10'),
        phone: '+94 76 789 0123',
        address: '8 Creative Avenue',
        specialization: 'Modern Furniture Design',
        experience: 8,
        certifications: ['Contemporary Design'],
        portfolio: 'https://pradeepcrafts.com',
        city: 'Galle',
        district: 'Galle',
        postalCode: '80100',
        location: 'Hikkaduwa'
      }
    ];

    this.allUsers = [...this.customers, ...this.vendors, ...this.craftsmen];
    this.filterByTab(this.selectedTab);
  }

  filterByTab(role: UserRole): void {
    this.selectedTab = role;
    
    switch (role) {
      case UserRole.CUSTOMER:
        this.filteredUsers = this.customers;
        break;
      case UserRole.VENDOR:
        this.filteredUsers = this.vendors;
        break;
      case UserRole.CRAFTSMAN:
        this.filteredUsers = this.craftsmen;
        break;
      default:
        this.filteredUsers = this.allUsers;
    }

    this.applySearch();
  }

  onSearchChange(): void {
    this.applySearch();
  }

  applySearch(): void {
    if (!this.searchQuery.trim()) {
      this.filterByTab(this.selectedTab);
      return;
    }

    const query = this.searchQuery.toLowerCase();
    this.filteredUsers = this.filteredUsers.filter(user =>
      user.firstName.toLowerCase().includes(query) ||
      user.lastName.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query) ||
      (user.phone && user.phone.includes(query)) ||
      (user.shopName && user.shopName.toLowerCase().includes(query))
    );
  }

  viewDetails(user: UserDetails): void {
    this.selectedUser = user;
    this.showDetailsModal = true;
  }

  closeDetailsModal(): void {
    this.showDetailsModal = false;
    this.selectedUser = null;
  }

  approveUser(userId: string): void {
    const user = this.allUsers.find(u => u.id === userId);
    if (user) {
      user.approvalStatus = ApprovalStatus.APPROVED;
      alert(`${user.firstName} ${user.lastName} has been approved!`);
      this.filterByTab(this.selectedTab);
    }
  }

  rejectUser(userId: string): void {
    const user = this.allUsers.find(u => u.id === userId);
    if (user) {
      if (confirm(`Are you sure you want to reject ${user.firstName} ${user.lastName}?`)) {
        user.approvalStatus = ApprovalStatus.REJECTED;
        alert(`${user.firstName} ${user.lastName} has been rejected.`);
        this.filterByTab(this.selectedTab);
      }
    }
  }

  deleteUser(userId: string): void {
    const user = this.allUsers.find(u => u.id === userId);
    if (user) {
      if (confirm(`Are you sure you want to delete ${user.firstName} ${user.lastName}? This action cannot be undone.`)) {
        this.allUsers = this.allUsers.filter(u => u.id !== userId);
        this.customers = this.customers.filter(u => u.id !== userId);
        this.vendors = this.vendors.filter(u => u.id !== userId);
        this.craftsmen = this.craftsmen.filter(u => u.id !== userId);
        alert('User deleted successfully.');
        this.filterByTab(this.selectedTab);
      }
    }
  }

  getStatusClass(status: ApprovalStatus): string {
    switch (status) {
      case ApprovalStatus.APPROVED:
        return 'status-approved';
      case ApprovalStatus.PENDING:
        return 'status-pending';
      case ApprovalStatus.REJECTED:
        return 'status-rejected';
      default:
        return '';
    }
  }

  exportToCSV(): void {
    alert('Export to CSV functionality will be implemented soon.');
  }
}
