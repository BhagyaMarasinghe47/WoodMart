import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { ProductService } from '../../core/services/product.service';
import { CategoryService, Category, SubCategory } from '../../core/services/category.service';
import { Product } from '../../core/models/product.model';
import { VendorService, DashboardStats, CustomerOrder, InventoryItem, Craftsman, OrderStatus, CraftsmanProduct, VendorCatalogProduct } from '../../core/services/vendor.service';

@Component({
  selector: 'app-vendor-dashboard',
  templateUrl: './vendor-dashboard.component.html',
  styleUrls: ['./vendor-dashboard.component.css']
})
export class VendorDashboardComponent implements OnInit {
  activeTab: 'overview' | 'orders' | 'inventory' | 'craftsmen' | 'products' | 'catalog' = 'overview';
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
  showAddToCatalogModal = false;
  selectedCraftsmanProduct: CraftsmanProduct | null = null;
  addToCatalogForm = {
    retailPrice: 0,
    stock: 0
  };

  // Vendor Catalog data
  vendorCatalog: VendorCatalogProduct[] = [];
  showEditCatalogModal = false;
  editingCatalogProduct: VendorCatalogProduct | null = null;
  catalogEditForm = {
    retailPrice: 0,
    stock: 0,
    category: '',
    subcategory: ''
  };

  // Bulk Order data
  showBulkOrderModal = false;
  selectedProductForBulkOrder: CraftsmanProduct | null = null;
  bulkOrderForm = {
    quantity: 1,
    notes: ''
  };

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
  showDeleteConfirm = false;
  productToDelete: string | null = null;

  loading = false;

  constructor(
    private authService: AuthService,
    private vendorService: VendorService,
    private productService: ProductService,
    private categoryService: CategoryService
  ) {}

  ngOnInit(): void {
    this.loadDashboardData();
    this.loadCategories();
    this.loadVendorProducts();
  }

  loadDashboardData(): void {
    this.loading = true;
    
    // Load dashboard stats
    this.vendorService.getDashboardStats().subscribe(stats => {
      this.stats = stats;
    });

    // Load orders
    this.vendorService.getCustomerOrders().subscribe(orders => {
      this.orders = orders;
    });

    // Load inventory
    this.vendorService.getInventoryItems().subscribe(items => {
      this.inventoryItems = items;
    });

    // Load craftsmen
    this.vendorService.getCraftsmen().subscribe(craftsmen => {
      this.craftsmen = craftsmen;
    });

    // Load craftsmen products
    this.vendorService.getCraftsmenProducts().subscribe(products => {
      this.craftsmenProducts = products;
    });

    // Load vendor catalog
    this.vendorService.getVendorCatalog().subscribe(catalog => {
      this.vendorCatalog = catalog;
      this.loading = false;
    });
  }

  loadCategories(): void {
    this.categories = this.categoryService.getAllCategories();
  }

  loadVendorProducts(): void {
    const currentUser = this.authService.currentUserValue;
    if (currentUser) {
      this.productService.getVendorProducts(currentUser.id).subscribe(products => {
        this.vendorProducts = products;
      });
    }
  }

  switchTab(tab: 'overview' | 'orders' | 'inventory' | 'craftsmen' | 'products' | 'catalog'): void {
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
  }

  onCategoryChange(categorySlug: string): void {
    this.selectedCategory = this.categories.find(c => c.slug === categorySlug) || null;
    this.productForm.category = categorySlug;
    this.productForm.subcategory = '';
  }

  onImageUrlChange(url: string): void {
    this.productForm.imageUrl = url;
    this.imagePreview = url;
  }

  saveProduct(): void {
    const currentUser = this.authService.currentUserValue;
    if (!currentUser) return;

    if (!this.productForm.name || !this.productForm.category || !this.productForm.retailPrice || !this.productForm.stock) {
      alert('Please fill in all required fields');
      return;
    }

    if (this.editingProduct) {
      // Update existing product
      this.productService.updateVendorProduct(this.editingProduct.id, this.productForm as Product).subscribe(updated => {
        if (updated) {
          this.loadVendorProducts();
          this.closeProductForm();
          alert('Product updated successfully!');
        }
      });
    } else {
      // Add new product
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
        alert('Product added successfully!');
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
          alert('Product deleted successfully!');
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
  }

  getCraftsmanProducts(craftsmanId: string): CraftsmanProduct[] {
    return this.craftsmenProducts.filter(p => p.craftsmanId === craftsmanId);
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
  }

  addToCatalog(): void {
    if (this.selectedCraftsmanProduct && this.addToCatalogForm.retailPrice > 0 && this.addToCatalogForm.stock >= 0) {
      this.vendorService.addToVendorCatalog(
        this.selectedCraftsmanProduct.id,
        this.addToCatalogForm.retailPrice,
        this.addToCatalogForm.stock
      ).subscribe(product => {
        if (product) {
          this.loadDashboardData();
          this.closeAddToCatalogModal();
          alert('Product added to your catalog successfully!');
        }
      });
    }
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
          alert('Product updated successfully!');
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
    if (confirm('Are you sure you want to remove this product from your catalog?')) {
      this.vendorService.removeFromVendorCatalog(productId).subscribe(success => {
        if (success) {
          this.loadDashboardData();
          alert('Product removed from catalog!');
        }
      });
    }
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
      notes: ''
    };
    this.showBulkOrderModal = true;
  }

  closeBulkOrderModal(): void {
    this.showBulkOrderModal = false;
    this.selectedProductForBulkOrder = null;
    this.bulkOrderForm = {
      quantity: 1,
      notes: ''
    };
  }

  calculateBulkOrderTotal(): string {
    if (!this.selectedProductForBulkOrder || !this.bulkOrderForm.quantity) {
      return '0';
    }
    const total = this.selectedProductForBulkOrder.wholesalePrice * this.bulkOrderForm.quantity;
    return total.toLocaleString();
  }

  submitBulkOrder(): void {
    if (!this.selectedProductForBulkOrder || this.bulkOrderForm.quantity < 1) {
      alert('Please enter a valid quantity');
      return;
    }

    // In a real app, this would send the order to the backend
    const orderDetails = {
      productId: this.selectedProductForBulkOrder.id,
      productName: this.selectedProductForBulkOrder.name,
      craftsmanId: this.selectedProductForBulkOrder.craftsmanId,
      quantity: this.bulkOrderForm.quantity,
      wholesalePrice: this.selectedProductForBulkOrder.wholesalePrice,
      totalAmount: this.selectedProductForBulkOrder.wholesalePrice * this.bulkOrderForm.quantity,
      notes: this.bulkOrderForm.notes,
      orderDate: new Date()
    };

    console.log('Bulk Order Request:', orderDetails);
    alert(`Bulk order request submitted!\n\nProduct: ${orderDetails.productName}\nQuantity: ${orderDetails.quantity} units\nTotal: Rs. ${orderDetails.totalAmount.toLocaleString()}\n\nThe craftsman will be notified of your order.`);
    
    this.closeBulkOrderModal();
  }

  logout(): void {
    this.authService.logout();
  }
}
