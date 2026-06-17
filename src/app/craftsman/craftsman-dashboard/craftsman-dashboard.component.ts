import { Component, OnInit } from '@angular/core';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../core/services/auth.service';
import { CategoryService, Category } from '../../core/services/category.service';
import { ImageUploadService } from '../../core/services/image-upload.service';
import { ToastService } from '../../core/services/toast.service';
import {
  CraftsmanService,
  DashboardStats,
  WholesaleProduct,
  VendorOrder,
  InventoryItem,
  OrderStatus,
  ProductStatus
} from '../../core/services/craftsman.service';

@Component({
  selector: 'app-craftsman-dashboard',
  templateUrl: './craftsman-dashboard.component.html',
  styleUrls: ['./craftsman-dashboard.component.css']
})
export class CraftsmanDashboardComponent implements OnInit {
  activeTab: 'overview' | 'products' | 'orders' | 'inventory' = 'overview';
  
  stats: DashboardStats = {
    totalProducts: 0,
    activeVendorOrders: 0,
    ordersInProduction: 0,
    lowStockProducts: 0
  };

  // Products
  products: WholesaleProduct[] = [];
  showProductForm = false;
  editingProduct: WholesaleProduct | null = null;
  categories: Category[] = [];
  selectedCategory: Category | null = null;
  productForm: Partial<WholesaleProduct> = {
    name: '',
    description: '',
    category: '',
    subcategory: '',
    wholesalePrice: 0,
    availableQuantity: 0,
    material: '',
    dimensions: '',
    weight: '',
    imageUrl: '',
    status: ProductStatus.ACTIVE
  };
  imagePreview: string = '';
  imageUploading = false;
  imageUploadError = '';
  showDeleteConfirm = false;
  productToDelete: string | null = null;
  dimL: number | null = null;
  dimW: number | null = null;
  dimH: number | null = null;
  weightKg: number | null = null;

  // Orders
  orders: VendorOrder[] = [];
  orderStatuses = Object.values(OrderStatus);
  editingOrder: VendorOrder | null = null;
  showOrderModal = false;
  orderForm = {
    status: OrderStatus.PENDING,
    expectedDeliveryDate: ''
  };

  selectedProductCategory = '';
  selectedInventoryCategory = '';

  // Inventory
  inventory: InventoryItem[] = [];
  editingQuantity: string | null = null;
  tempQuantityValue: number = 0;

  loading = false;
  ProductStatus = ProductStatus;
  OrderStatus = OrderStatus;

  constructor(
    private authService: AuthService,
    private craftsmanService: CraftsmanService,
    private categoryService: CategoryService,
    private imageUploadService: ImageUploadService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.loadDashboardData();
    this.loadCategories();
  }

  loadDashboardData(): void {
    this.loading = true;

    this.craftsmanService.getDashboardStats().subscribe({
      next: stats => { this.stats = stats; },
      error: () => {}
    });

    this.craftsmanService.getWholesaleProducts().subscribe({
      next: products => {
        this.products = products;
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });

    this.craftsmanService.getVendorOrders().subscribe({
      next: orders => { this.orders = orders; },
      error: () => {}
    });

    this.craftsmanService.getInventory().subscribe({
      next: inventory => { this.inventory = inventory; },
      error: () => {}
    });
  }

  loadCategories(): void {
    this.categoryService.loadCategories().subscribe(categories => {
      this.categories = categories;
    });
  }

  switchTab(tab: 'overview' | 'products' | 'orders' | 'inventory'): void {
    this.activeTab = tab;
  }

  // Product Management
  openProductForm(product?: WholesaleProduct): void {
    this.showProductForm = true;
    if (product) {
      this.editingProduct = product;
      this.productForm = { ...product };
      this.imagePreview = product.imageUrl;
      const category = this.categories.find(c => c.slug === product.category);
      if (category) {
        this.selectedCategory = category;
      }
      this.parseDimensions(product.dimensions);
      this.weightKg = product.weight ? (parseFloat(product.weight) || null) : null;
    } else {
      this.resetProductForm();
    }
  }

  closeProductForm(): void {
    this.showProductForm = false;
    this.resetProductForm();
  }

  resetProductForm(): void {
    this.editingProduct = null;
    this.selectedCategory = null;
    this.productForm = {
      name: '',
      description: '',
      category: '',
      subcategory: '',
      wholesalePrice: 0,
      availableQuantity: 0,
      material: '',
      dimensions: '',
      weight: '',
      imageUrl: '',
      status: ProductStatus.ACTIVE
    };
    this.imagePreview = '';
    this.dimL = null;
    this.dimW = null;
    this.dimH = null;
    this.weightKg = null;
  }

  parseDimensions(dim?: string): void {
    if (!dim) { this.dimL = null; this.dimW = null; this.dimH = null; return; }
    const parts = dim.split(/[×x]/i).map(p => parseFloat(p.trim()));
    this.dimL = isNaN(parts[0]) ? null : parts[0];
    this.dimW = isNaN(parts[1]) ? null : parts[1];
    this.dimH = isNaN(parts[2]) ? null : parts[2];
  }

  composeDimensions(): string {
    if (this.dimL == null && this.dimW == null && this.dimH == null) return '';
    return `${this.dimL ?? ''} × ${this.dimW ?? ''} × ${this.dimH ?? ''} cm`.trim();
  }

  onCategoryChange(categorySlug: string): void {
    this.selectedCategory = this.categories.find(c => c.slug === categorySlug) || null;
    this.productForm.category = categorySlug;
    this.productForm.subcategory = '';
  }

  onImageFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    const file = input.files[0];
    this.imageUploading = true;
    this.imageUploadError = '';

    this.imageUploadService.uploadImage(file).subscribe({
      next: (res) => {
        this.productForm.imageUrl = res.imageUrl;
        const baseUrl = environment.apiUrl.replace('/api', '');
        this.imagePreview = `${baseUrl}/${res.imageUrl}`;
        this.imageUploading = false;
      },
      error: () => {
        this.imageUploadError = 'Image upload failed. Please try again.';
        this.imageUploading = false;
      }
    });
  }

  saveProduct(): void {
    const currentUser = this.authService.currentUserValue;
    if (!currentUser) return;

    if (!this.productForm.name || !this.productForm.category ||
        !this.productForm.wholesalePrice || this.productForm.availableQuantity === undefined) {
      this.toast.warning('Please fill in all required fields.');
      return;
    }

    this.productForm.dimensions = this.composeDimensions();
    this.productForm.weight = this.weightKg != null ? `${this.weightKg} kg` : '';

    if (this.editingProduct) {
      this.craftsmanService.updateWholesaleProduct(this.editingProduct.id, this.productForm as WholesaleProduct)
        .subscribe({
          next: () => {
            this.loadDashboardData();
            this.closeProductForm();
            this.toast.success('Product updated successfully!');
          },
          error: (err) => {
            const msg = err?.error?.message || 'Failed to update product. Please try again.';
            this.toast.error(msg);
          }
        });
    } else {
      const newProduct: Omit<WholesaleProduct, 'id' | 'createdAt'> = {
        name: this.productForm.name!,
        description: this.productForm.description || '',
        category: this.productForm.category!,
        subcategory: this.productForm.subcategory,
        wholesalePrice: this.productForm.wholesalePrice!,
        availableQuantity: this.productForm.availableQuantity!,
        material: this.productForm.material || '',
        dimensions: this.productForm.dimensions || undefined,
        weight: this.productForm.weight || undefined,
        imageUrl: this.productForm.imageUrl || 'https://images.unsplash.com/photo-1617806118233-18e1de247200?w=500',
        status: this.productForm.status || ProductStatus.ACTIVE,
        craftsmanId: currentUser.id
      };

      this.craftsmanService.addWholesaleProduct(newProduct).subscribe({
        next: () => {
          this.loadDashboardData();
          this.closeProductForm();
          this.toast.success('Product added successfully!');
        },
        error: (err) => {
          const msg = err?.error?.message || 'Failed to add product. Please try again.';
          this.toast.error(msg);
        }
      });
    }
  }

  confirmDeleteProduct(productId: string): void {
    this.productToDelete = productId;
    this.showDeleteConfirm = true;
  }

  cancelDelete(): void {
    this.productToDelete = null;
    this.showDeleteConfirm = false;
  }

  deleteProduct(): void {
    if (this.productToDelete) {
      this.craftsmanService.deleteWholesaleProduct(this.productToDelete).subscribe({
        next: () => {
          this.loadDashboardData();
          this.cancelDelete();
          this.toast.success('Product deleted successfully!');
        },
        error: (err) => {
          const msg = err?.error?.message || 'Failed to delete product. Please try again.';
          this.toast.error(msg);
        }
      });
    }
  }

  getProductStatusClass(status: ProductStatus): string {
    switch (status) {
      case ProductStatus.ACTIVE: return 'status-active';
      case ProductStatus.OUT_OF_STOCK: return 'status-out-of-stock';
      case ProductStatus.DISCONTINUED: return 'status-discontinued';
      default: return '';
    }
  }

  // Order Management
  openOrderModal(order: VendorOrder): void {
    this.editingOrder = order;
    this.orderForm = {
      status: order.status,
      expectedDeliveryDate: this.formatDateForInput(order.expectedDeliveryDate)
    };
    this.showOrderModal = true;
  }

  closeOrderModal(): void {
    this.showOrderModal = false;
    this.editingOrder = null;
  }

  updateOrder(): void {
    if (this.editingOrder) {
      const expectedDate = this.orderForm.expectedDeliveryDate ? 
        new Date(this.orderForm.expectedDeliveryDate) : undefined;
      
      this.craftsmanService.updateOrderStatus(
        this.editingOrder.id,
        this.orderForm.status,
        expectedDate
      ).subscribe({
        next: () => {
          this.loadDashboardData();
          this.closeOrderModal();
          this.toast.success('Order updated successfully!');
        },
        error: (err) => {
          const msg = err?.error?.message || 'Failed to update order. Please try again.';
          this.toast.error(msg);
        }
      });
    }
  }

  formatDateForInput(date: Date): string {
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  }

  getOrderStatusClass(status: OrderStatus): string {
    switch (status) {
      case OrderStatus.PENDING: return 'order-pending';
      case OrderStatus.ACCEPTED: return 'order-accepted';
      case OrderStatus.IN_PRODUCTION: return 'order-production';
      case OrderStatus.READY_FOR_DISPATCH: return 'order-ready';
      case OrderStatus.DISPATCHED: return 'order-dispatched';
      default: return '';
    }
  }

  // Inventory Management
  startEditQuantity(itemId: string, currentQuantity: number): void {
    this.editingQuantity = itemId;
    this.tempQuantityValue = currentQuantity;
  }

  saveQuantity(itemId: string): void {
    this.craftsmanService.updateInventoryQuantity(itemId, this.tempQuantityValue)
      .subscribe(success => {
        if (success) {
          this.loadDashboardData();
          this.editingQuantity = null;
        }
      });
  }

  cancelEditQuantity(): void {
    this.editingQuantity = null;
  }

  isLowStock(quantity: number): boolean {
    return quantity < 5;
  }

  get productCategories(): string[] {
    return [...new Set(this.products.map(p => p.category).filter(Boolean))].sort();
  }

  get filteredProducts(): WholesaleProduct[] {
    if (!this.selectedProductCategory) return this.products;
    return this.products.filter(p => p.category === this.selectedProductCategory);
  }

  productCountByCategory(cat: string): number {
    return this.products.filter(p => p.category === cat).length;
  }

  get inventoryCategories(): string[] {
    return [...new Set(this.inventory.map(i => i.category).filter(Boolean))].sort();
  }

  get filteredInventory(): InventoryItem[] {
    if (!this.selectedInventoryCategory) return this.inventory;
    return this.inventory.filter(i => i.category === this.selectedInventoryCategory);
  }

  inventoryCountByCategory(cat: string): number {
    return this.inventory.filter(i => i.category === cat).length;
  }

  logout(): void {
    this.authService.logout();
  }
}
