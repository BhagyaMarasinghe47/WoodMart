import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { ProductService } from '../../core/services/product.service';
import { CategoryService, Category, SubCategory } from '../../core/services/category.service';
import { Product } from '../../core/models/product.model';
import { VendorService, DashboardStats, CustomerOrder, InventoryItem, Craftsman, OrderStatus, CraftsmanProduct, VendorCatalogProduct, VendorBulkOrder } from '../../core/services/vendor.service';
import { ImageUploadService } from '../../core/services/image-upload.service';
import { ToastService } from '../../core/services/toast.service';
import { ConfirmDialogService } from '../../core/services/confirm-dialog.service';

@Component({
  selector: 'app-vendor-dashboard',
  templateUrl: './vendor-dashboard.component.html',
  styleUrls: ['./vendor-dashboard.component.css']
})
export class VendorDashboardComponent implements OnInit {
  activeTab: 'overview' | 'orders' | 'inventory' | 'craftsmen' | 'products' | 'catalog' | 'bulk-orders' = 'overview';
  Math = Math; // For use in template
  stats: DashboardStats = {
    totalProducts: 0,
    productsLowInStock: 0,
    totalOrders: 0,
    pendingOrders: 0,
    totalCraftsmenConnected: 0,
    monthlySales: 0
  };

  // Orders data
  orders: CustomerOrder[] = [];
  orderStatuses = Object.values(OrderStatus);

  // Inventory data
  inventoryItems: InventoryItem[] = [];
  editingStock: string | null = null;
  editingPrice: string | null = null;
  tempStockValue: number = 0;
  tempPriceValue: number = 0;

  // Craftsmen data
  craftsmen: Craftsman[] = [];
  selectedCraftsmanId: string | null = null;
  craftsmenProducts: CraftsmanProduct[] = [];
  craftsmenProductSearch = '';
  craftsmenCategoryFilter = '';
  showAddToCatalogModal = false;
  addingToCatalog = false;
  selectedCraftsmanProduct: CraftsmanProduct | null = null;
  addToCatalogForm = {
    retailPrice: 0,
    stock: 10
  };

  // Vendor Catalog data
  vendorCatalog: VendorCatalogProduct[] = [];
  selectedCatalogCategory = '';
  selectedInventoryCategory = '';
  showEditCatalogModal = false;
  editingCatalogProduct: VendorCatalogProduct | null = null;
  catalogEditForm = {
    retailPrice: 0,
    stock: 0,
    category: '',
    subcategory: ''
  };

  // Bulk Order data
  bulkOrders: VendorBulkOrder[] = [];
  showBulkOrderModal = false;
  selectedProductForBulkOrder: CraftsmanProduct | null = null;
  bulkOrderForm = {
    quantity: 1,
    notes: '',
    agreeUnitPrice: 0
  };
  bulkOrderSubmitting = false;

  // Products data
  vendorProducts: Product[] = [];
  showProductForm = false;
  editingProduct: Product | null = null;
  categories: Category[] = [];
  selectedCategory: Category | null = null;
  productForm: Partial<Product> = {
    name: '',
    description: '',
    category: '',
    subcategory: '',
    retailPrice: 0,
    stock: 0,
    material: 'Wood',
    imageUrl: '',
    dimensions: '',
    weight: ''
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

  loading = false;

  constructor(
    private authService: AuthService,
    private vendorService: VendorService,
    private productService: ProductService,
    private categoryService: CategoryService,
    private imageUploadService: ImageUploadService,
    private toast: ToastService,
    private confirmDialog: ConfirmDialogService
  ) {}

  ngOnInit(): void {
    this.loadDashboardData();
    this.loadCategories();
    this.loadVendorProducts();
  }

  loadDashboardData(): void {
    this.loading = true;
    this.vendorService.loadDashboardBundle().subscribe({
      next: data => {
        this.stats = data.stats;
        this.orders = data.orders;
        this.inventoryItems = data.inventory;
        this.craftsmen = data.craftsmen;
        this.craftsmenProducts = data.craftsmanProducts;
        this.vendorCatalog = data.catalog;
        this.bulkOrders = data.bulkOrders;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  loadCategories(): void {
    this.categoryService.loadCategories().subscribe(categories => {
      this.categories = categories;
    });
  }

  loadVendorProducts(): void {
    const currentUser = this.authService.currentUserValue;
    if (currentUser) {
      this.productService.getVendorProducts(currentUser.id).subscribe(products => {
        this.vendorProducts = products;
      });
    }
  }

  switchTab(tab: 'overview' | 'orders' | 'inventory' | 'craftsmen' | 'products' | 'catalog' | 'bulk-orders'): void {
    this.activeTab = tab;
  }

  // Order management
  updateOrderStatus(orderId: string, newStatus: OrderStatus): void {
    this.vendorService.updateOrderStatus(orderId, newStatus).subscribe(success => {
      if (success) {
        const order = this.orders.find(o => o.id === orderId);
        if (order) {
          order.status = newStatus;
        }
      }
    });
  }

  // Inventory management
  startEditStock(itemId: string, currentStock: number): void {
    this.editingStock = itemId;
    this.tempStockValue = currentStock;
  }

  saveStock(itemId: string): void {
    this.vendorService.updateInventoryStock(itemId, this.tempStockValue).subscribe(success => {
      if (success) {
        const item = this.inventoryItems.find(i => i.id === itemId);
        if (item) {
          item.stockQuantity = this.tempStockValue;
        }
      }
      this.editingStock = null;
    });
  }

  cancelEditStock(): void {
    this.editingStock = null;
  }

  startEditPrice(itemId: string, currentPrice: number): void {
    this.editingPrice = itemId;
    this.tempPriceValue = currentPrice;
  }

  savePrice(itemId: string): void {
    this.vendorService.updateRetailPrice(itemId, this.tempPriceValue).subscribe(success => {
      if (success) {
        const item = this.inventoryItems.find(i => i.id === itemId);
        if (item) {
          item.retailPrice = this.tempPriceValue;
        }
      }
      this.editingPrice = null;
    });
  }

  cancelEditPrice(): void {
    this.editingPrice = null;
  }

  getStatusClass(status: OrderStatus): string {
    switch (status) {
      case OrderStatus.PENDING: return 'status-pending';
      case OrderStatus.PROCESSING: return 'status-processing';
      case OrderStatus.SHIPPED: return 'status-shipped';
      case OrderStatus.DELIVERED: return 'status-delivered';
      case OrderStatus.CANCELLED: return 'status-cancelled';
      default: return '';
    }
  }

  // Product Management
  openProductForm(product?: Product): void {
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
      retailPrice: 0,
      stock: 0,
      material: 'Wood',
      imageUrl: '',
      dimensions: '',
      weight: ''
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
        this.imagePreview = `http://localhost:5037/${res.imageUrl}`;
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

    if (!this.productForm.name || !this.productForm.category || !this.productForm.retailPrice || !this.productForm.stock) {
      this.toast.warning('Please fill in all required fields.');
      return;
    }

    this.productForm.dimensions = this.composeDimensions();
    this.productForm.weight = this.weightKg != null ? `${this.weightKg} kg` : '';

    if (this.editingProduct) {
      this.productService.updateVendorProduct(this.editingProduct.id, this.productForm as Product).subscribe(updated => {
        if (updated) {
          this.loadVendorProducts();
          this.closeProductForm();
          this.toast.success('Product updated successfully!');
        }
      });
    } else {
      const newProduct: Omit<Product, 'id'> = {
        name: this.productForm.name!,
        description: this.productForm.description || '',
        category: this.productForm.category!,
        subcategory: this.productForm.subcategory,
        wholesalePrice: 0,
        retailPrice: this.productForm.retailPrice!,
        stock: this.productForm.stock!,
        imageUrl: this.productForm.imageUrl || 'https://images.unsplash.com/photo-1617806118233-18e1de247200?w=500',
        material: this.productForm.material,
        dimensions: this.productForm.dimensions,
        weight: this.productForm.weight,
        vendorId: currentUser.id,
        vendorName: `${currentUser.firstName} ${currentUser.lastName}`,
        createdAt: new Date(),
        isActive: true
      };

      this.productService.addVendorProduct(newProduct).subscribe(product => {
        this.loadVendorProducts();
        this.closeProductForm();
        this.toast.success('Product added successfully!');
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
      this.productService.deleteVendorProduct(this.productToDelete).subscribe(success => {
        if (success) {
          this.loadVendorProducts();
          this.cancelDelete();
          this.toast.success('Product deleted successfully!');
        }
      });
    }
  }

  getProductStatus(product: Product): string {
    return product.stock > 0 ? 'Active' : 'Out of Stock';
  }

  getProductStatusClass(product: Product): string {
    return product.stock > 0 ? 'status-active' : 'status-out-of-stock';
  }

  // Craftsmen Products Management
  viewCraftsmanProducts(craftsmanId: string): void {
    this.selectedCraftsmanId = craftsmanId;
    this.craftsmenProductSearch = '';
    this.craftsmenCategoryFilter = '';
    this.vendorService.getCraftsmenProducts(craftsmanId).subscribe(products => {
      this.craftsmenProducts = products;
    });
  }

  get filteredCraftsmanProducts(): CraftsmanProduct[] {
    const search = this.craftsmenProductSearch.toLowerCase().trim();
    const cat = this.craftsmenCategoryFilter;
    return this.craftsmenProducts.filter(p => {
      const matchSearch = !search || p.name.toLowerCase().includes(search) || p.description.toLowerCase().includes(search);
      const matchCat = !cat || p.category === cat;
      return matchSearch && matchCat;
    });
  }

  get craftsmanProductCategories(): string[] {
    return [...new Set(this.craftsmenProducts.map(p => p.category).filter(Boolean))].sort();
  }

  craftsmanProductCountByCategory(cat: string): number {
    return this.craftsmenProducts.filter(p => p.category === cat).length;
  }

  openAddToCatalogModal(product: CraftsmanProduct): void {
    this.selectedCraftsmanProduct = product;
    this.addToCatalogForm = {
      retailPrice: Math.round(product.wholesalePrice * 1.3),
      stock: 10
    };
    this.showAddToCatalogModal = true;
  }

  closeAddToCatalogModal(): void {
    this.showAddToCatalogModal = false;
    this.selectedCraftsmanProduct = null;
    this.addingToCatalog = false;
  }

  applyMarkup(pct: number): void {
    if (!this.selectedCraftsmanProduct) return;
    this.addToCatalogForm.retailPrice = Math.round(this.selectedCraftsmanProduct.wholesalePrice * (1 + pct / 100));
  }

  get catalogMargin(): { amount: number; pct: number } {
    if (!this.selectedCraftsmanProduct || !this.addToCatalogForm.retailPrice) return { amount: 0, pct: 0 };
    const amount = this.addToCatalogForm.retailPrice - this.selectedCraftsmanProduct.wholesalePrice;
    const pct = this.selectedCraftsmanProduct.wholesalePrice > 0
      ? Math.round((amount / this.selectedCraftsmanProduct.wholesalePrice) * 100)
      : 0;
    return { amount, pct };
  }

  addToCatalog(): void {
    if (!this.selectedCraftsmanProduct) return;
    if (this.addToCatalogForm.retailPrice <= 0) {
      this.toast.warning('Please set a retail price greater than zero.');
      return;
    }
    if (this.addToCatalogForm.stock < 0) {
      this.toast.warning('Stock cannot be negative.');
      return;
    }
    this.addingToCatalog = true;
    this.vendorService.addToVendorCatalog(
      this.selectedCraftsmanProduct.id,
      this.addToCatalogForm.retailPrice,
      this.addToCatalogForm.stock
    ).subscribe(product => {
      this.addingToCatalog = false;
      if (product) {
        // Mark in-place so the badge updates without reloading entire dashboard
        const p = this.craftsmenProducts.find(x => x.id === this.selectedCraftsmanProduct!.id);
        if (p) p.isSelectedByVendor = true;
        this.vendorCatalog = [...this.vendorCatalog, product];
        this.closeAddToCatalogModal();
      }
    });
  }

  // Catalog category filter
  get catalogCategories(): string[] {
    return [...new Set(this.vendorCatalog.map(p => p.category).filter(Boolean))].sort();
  }

  get filteredCatalog(): VendorCatalogProduct[] {
    if (!this.selectedCatalogCategory) return this.vendorCatalog;
    return this.vendorCatalog.filter(p => p.category === this.selectedCatalogCategory);
  }

  catalogCountByCategory(cat: string): number {
    return this.vendorCatalog.filter(p => p.category === cat).length;
  }

  // Inventory category filter
  get inventoryCategories(): string[] {
    return [...new Set(this.inventoryItems.map(i => i.category).filter(Boolean))].sort();
  }

  get filteredInventory(): any[] {
    if (!this.selectedInventoryCategory) return this.inventoryItems;
    return this.inventoryItems.filter(i => i.category === this.selectedInventoryCategory);
  }

  inventoryCountByCategory(cat: string): number {
    return this.inventoryItems.filter(i => i.category === cat).length;
  }

  resolveImageUrl(url: string): string {
    if (!url || url === 'assets/images/hero-bg.jpg') return '/assets/images/hero-bg.jpg';
    if (url.startsWith('http') || url.startsWith('/assets')) return url;
    return `http://localhost:5037/${url}`;
  }

  // Vendor Catalog Management
  openEditCatalogModal(product: VendorCatalogProduct): void {
    this.editingCatalogProduct = product;
    this.catalogEditForm = {
      retailPrice: product.retailPrice,
      stock: product.stock,
      category: product.category,
      subcategory: product.subcategory || ''
    };
    this.showEditCatalogModal = true;
  }

  closeEditCatalogModal(): void {
    this.showEditCatalogModal = false;
    this.editingCatalogProduct = null;
  }

  updateCatalogProduct(): void {
    if (this.editingCatalogProduct) {
      this.vendorService.updateVendorCatalogProduct(this.editingCatalogProduct.id, {
        retailPrice: this.catalogEditForm.retailPrice,
        stock: this.catalogEditForm.stock,
        category: this.catalogEditForm.category,
        subcategory: this.catalogEditForm.subcategory
      }).subscribe(success => {
        if (success) {
          this.loadDashboardData();
          this.closeEditCatalogModal();
          this.toast.success('Product updated successfully!');
        }
      });
    }
  }

  togglePublish(productId: string): void {
    this.vendorService.togglePublishProduct(productId).subscribe(success => {
      if (success) {
        this.loadDashboardData();
      }
    });
  }

  removeFromCatalog(productId: string): void {
    this.confirmDialog.confirm('Remove this product from your catalog?', 'Remove', 'Cancel').then(confirmed => {
      if (!confirmed) return;
      this.vendorService.removeFromVendorCatalog(productId).subscribe(success => {
        if (success) {
          this.loadDashboardData();
          this.toast.success('Product removed from catalog!');
        }
      });
    });
  }

  getCatalogStatusClass(product: VendorCatalogProduct): string {
    if (!product.isPublished) return 'status-unpublished';
    if (product.stock === 0) return 'status-out-of-stock';
    if (product.stock < 5) return 'status-low-stock';
    return 'status-active';
  }

  getCatalogStatus(product: VendorCatalogProduct): string {
    if (!product.isPublished) return 'Unpublished';
    if (product.stock === 0) return 'Out of Stock';
    if (product.stock < 5) return 'Low Stock';
    return 'Active';
  }

  getStockStatusClass(stock: number): string {
    if (stock === 0) return 'stock-out';
    if (stock < 5) return 'stock-low';
    return 'stock-ok';
  }

  getStockStatus(stock: number): string {
    if (stock === 0) return 'Out of Stock';
    if (stock < 5) return 'Low Stock';
    return 'Active';
  }

  requestBulkOrder(item: any): void {
    // Navigate to craftsmen tab and pre-select the craftsman
    this.activeTab = 'craftsmen';
    // Find and select the craftsman for this product
    const craftsman = this.craftsmen.find(c => c.name === item.craftsmanName);
    if (craftsman) {
      this.selectedCraftsmanId = craftsman.id;
    }
    // Scroll to top smoothly
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Bulk Order Modal methods
  openBulkOrderModal(product: CraftsmanProduct): void {
    this.selectedProductForBulkOrder = product;
    this.bulkOrderForm = {
      quantity: 1,
      notes: '',
      agreeUnitPrice: product.wholesalePrice
    };
    this.showBulkOrderModal = true;
  }

  closeBulkOrderModal(): void {
    this.showBulkOrderModal = false;
    this.selectedProductForBulkOrder = null;
    this.bulkOrderSubmitting = false;
    this.bulkOrderForm = { quantity: 1, notes: '', agreeUnitPrice: 0 };
  }

  calculateBulkOrderTotal(): string {
    if (!this.selectedProductForBulkOrder || !this.bulkOrderForm.quantity) return '0';
    const price = this.bulkOrderForm.agreeUnitPrice || this.selectedProductForBulkOrder.wholesalePrice;
    return (price * this.bulkOrderForm.quantity).toLocaleString();
  }

  submitBulkOrder(): void {
    if (!this.selectedProductForBulkOrder || this.bulkOrderForm.quantity < 1) {
      this.toast.warning('Please enter a valid quantity.');
      return;
    }
    this.bulkOrderSubmitting = true;
    this.vendorService.submitBulkOrder(
      this.selectedProductForBulkOrder.id,
      this.bulkOrderForm.quantity,
      this.bulkOrderForm.agreeUnitPrice,
      this.bulkOrderForm.notes
    ).subscribe(result => {
      this.bulkOrderSubmitting = false;
      if (result.success) {
        this.toast.success(`Bulk order submitted! Order #${result.orderNumber} — the craftsman will be notified.`);
        this.closeBulkOrderModal();
        this.vendorService.getBulkOrders().subscribe(orders => { this.bulkOrders = orders; });
      } else {
        this.toast.error(result.message || 'Failed to submit bulk order.');
      }
    });
  }

  getBulkOrderStatusClass(status: string): string {
    switch (status?.toLowerCase()) {
      case 'pending': return 'status-pending';
      case 'accepted': return 'status-processing';
      case 'inproduction': return 'status-shipped';
      case 'readyfordispatch': return 'status-shipped';
      case 'dispatched': return 'status-delivered';
      default: return '';
    }
  }

  logout(): void {
    this.authService.logout();
  }
}
