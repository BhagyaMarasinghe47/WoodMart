import { Component, OnInit } from '@angular/core';
import { ProductService } from '../../core/services/product.service';
import { Product } from '../../core/models/product.model';

export enum ProductStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  DISABLED = 'DISABLED'
}

interface ProductWithStatus extends Product {
  status: ProductStatus;
  vendorName: string;
  submittedDate: Date;
  rejectionReason?: string;
}

@Component({
  selector: 'app-product-management',
  templateUrl: './product-management.component.html',
  styleUrls: ['./product-management.component.css']
})
export class ProductManagementComponent implements OnInit {
  allProducts: ProductWithStatus[] = [];
  filteredProducts: ProductWithStatus[] = [];
  selectedTab: ProductStatus | 'ALL' = 'PENDING';
  searchQuery = '';
  selectedProduct: ProductWithStatus | null = null;
  showDetailsModal = false;
  showRejectModal = false;
  rejectionReason = '';

  ProductStatus = ProductStatus;

  pendingProducts: ProductWithStatus[] = [];
  approvedProducts: ProductWithStatus[] = [];
  rejectedProducts: ProductWithStatus[] = [];
  disabledProducts: ProductWithStatus[] = [];

  constructor(private productService: ProductService) {}

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {
    // Dummy products with moderation status
    this.allProducts = [
      {
        id: '1',
        name: 'Handcrafted Oak Dining Table',
        description: 'Beautiful solid oak dining table with 6 seats',
        category: 'Dining Room Furniture',
        subcategory: 'Tables',
        craftsmanName: 'Kamal Perera',
        retailPrice: 85000,
        wholesalePrice: 65000,
        stock: 5,
        imageUrl: 'assets/images/dining-room.jpg',
        vendorName: 'WoodCraft Suppliers',
        status: ProductStatus.PENDING,
        submittedDate: new Date('2026-01-15')
      },
      {
        id: '2',
        name: 'Modern Teak Office Desk',
        description: 'Contemporary teak desk with storage drawers',
        category: 'Office Furniture',
        subcategory: 'Desks',
        craftsmanName: 'Nimal Silva',
        retailPrice: 45000,
        wholesalePrice: 35000,
        stock: 8,
        imageUrl: 'assets/images/office-space.jpg',
        vendorName: 'Timber Trade Co.',
        status: ProductStatus.APPROVED,
        submittedDate: new Date('2026-01-10')
      },
      {
        id: '3',
        name: 'Luxury Mahogany Bed Frame',
        description: 'King size mahogany bed with carved headboard',
        category: 'Bedroom Furniture',
        subcategory: 'Beds',
        craftsmanName: 'Pradeep Fernando',
        retailPrice: 125000,
        wholesalePrice: 95000,
        stock: 3,
        imageUrl: 'assets/images/bedroom-serenity.jpg',
        vendorName: 'Premium Wood Ltd.',
        status: ProductStatus.PENDING,
        submittedDate: new Date('2026-01-17')
      },
      {
        id: '4',
        name: 'Rustic Coffee Table',
        description: 'Reclaimed wood coffee table with iron legs',
        category: 'Living Room Furniture',
        subcategory: 'Tables',
        craftsmanName: 'Kamal Perera',
        retailPrice: 32000,
        wholesalePrice: 24000,
        stock: 0,
        imageUrl: 'assets/images/cozy-nook.jpg',
        vendorName: 'WoodCraft Suppliers',
        status: ProductStatus.DISABLED,
        submittedDate: new Date('2025-12-20'),
        rejectionReason: 'Out of stock'
      },
      {
        id: '5',
        name: 'Contemporary Bookshelf',
        description: 'Modern design bookshelf with 5 tiers',
        category: 'Storage & Utility Furniture',
        subcategory: 'Shelves',
        craftsmanName: 'Nimal Silva',
        retailPrice: 28000,
        wholesalePrice: 21000,
        stock: 12,
        imageUrl: 'assets/images/dining-elegance.jpg',
        vendorName: 'Timber Trade Co.',
        status: ProductStatus.REJECTED,
        submittedDate: new Date('2026-01-12'),
        rejectionReason: 'Quality issues identified in product images'
      },
      {
        id: '6',
        name: 'Classic Rocking Chair',
        description: 'Traditional wooden rocking chair with cushion',
        category: 'Living Room Furniture',
        subcategory: 'Chairs',
        craftsmanName: 'Pradeep Fernando',
        retailPrice: 18500,
        wholesalePrice: 14000,
        stock: 6,
        imageUrl: 'assets/images/cozy-nook.jpg',
        vendorName: 'Premium Wood Ltd.',
        status: ProductStatus.PENDING,
        submittedDate: new Date('2026-01-18')
      }
    ];

    this.categorizeProducts();
    this.filterByTab(this.selectedTab);
  }

  categorizeProducts(): void {
    this.pendingProducts = this.allProducts.filter(p => p.status === ProductStatus.PENDING);
    this.approvedProducts = this.allProducts.filter(p => p.status === ProductStatus.APPROVED);
    this.rejectedProducts = this.allProducts.filter(p => p.status === ProductStatus.REJECTED);
    this.disabledProducts = this.allProducts.filter(p => p.status === ProductStatus.DISABLED);
  }

  filterByTab(status: ProductStatus | 'ALL'): void {
    this.selectedTab = status;
    
    switch (status) {
      case 'ALL':
        this.filteredProducts = this.allProducts;
        break;
      case ProductStatus.PENDING:
        this.filteredProducts = this.pendingProducts;
        break;
      case ProductStatus.APPROVED:
        this.filteredProducts = this.approvedProducts;
        break;
      case ProductStatus.REJECTED:
        this.filteredProducts = this.rejectedProducts;
        break;
      case ProductStatus.DISABLED:
        this.filteredProducts = this.disabledProducts;
        break;
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
    this.filteredProducts = this.filteredProducts.filter(product =>
      product.name.toLowerCase().includes(query) ||
      product.vendorName.toLowerCase().includes(query) ||
      product.category.toLowerCase().includes(query) ||
      product.craftsmanName.toLowerCase().includes(query)
    );
  }

  viewDetails(product: ProductWithStatus): void {
    this.selectedProduct = product;
    this.showDetailsModal = true;
  }

  closeDetailsModal(): void {
    this.showDetailsModal = false;
    this.selectedProduct = null;
  }

  approveProduct(productId: string): void {
    const product = this.allProducts.find(p => p.id === productId);
    if (product) {
      product.status = ProductStatus.APPROVED;
      product.rejectionReason = undefined;
      alert(`${product.name} has been approved!`);
      this.categorizeProducts();
      this.filterByTab(this.selectedTab);
      this.closeDetailsModal();
    }
  }

  openRejectModal(product: ProductWithStatus): void {
    this.selectedProduct = product;
    this.showRejectModal = true;
    this.rejectionReason = '';
  }

  closeRejectModal(): void {
    this.showRejectModal = false;
    this.selectedProduct = null;
    this.rejectionReason = '';
  }

  rejectProduct(): void {
    if (!this.rejectionReason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }

    if (this.selectedProduct) {
      const product = this.allProducts.find(p => p.id === this.selectedProduct!.id);
      if (product) {
        product.status = ProductStatus.REJECTED;
        product.rejectionReason = this.rejectionReason;
        alert(`${product.name} has been rejected.`);
        this.categorizeProducts();
        this.filterByTab(this.selectedTab);
        this.closeRejectModal();
        this.closeDetailsModal();
      }
    }
  }

  disableProduct(productId: string): void {
    const product = this.allProducts.find(p => p.id === productId);
    if (product) {
      if (confirm(`Are you sure you want to disable ${product.name}?`)) {
        product.status = ProductStatus.DISABLED;
        alert(`${product.name} has been disabled.`);
        this.categorizeProducts();
        this.filterByTab(this.selectedTab);
        this.closeDetailsModal();
      }
    }
  }

  enableProduct(productId: string): void {
    const product = this.allProducts.find(p => p.id === productId);
    if (product) {
      product.status = ProductStatus.APPROVED;
      alert(`${product.name} has been enabled.`);
      this.categorizeProducts();
      this.filterByTab(this.selectedTab);
      this.closeDetailsModal();
    }
  }

  getStatusClass(status: ProductStatus): string {
    switch (status) {
      case ProductStatus.APPROVED:
        return 'status-approved';
      case ProductStatus.PENDING:
        return 'status-pending';
      case ProductStatus.REJECTED:
        return 'status-rejected';
      case ProductStatus.DISABLED:
        return 'status-disabled';
      default:
        return '';
    }
  }
}
