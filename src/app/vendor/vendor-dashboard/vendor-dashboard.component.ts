import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { ProductService } from '../../core/services/product.service';
import { CategoryService, Category, SubCategory } from '../../core/services/category.service';
import { Product } from '../../core/models/product.model';
import { VendorService, DashboardStats, CustomerOrder, InventoryItem, Craftsman, OrderStatus } from '../../core/services/vendor.service';

@Component({
  selector: 'app-vendor-dashboard',
  templateUrl: './vendor-dashboard.component.html',
  styleUrls: ['./vendor-dashboard.component.css']
})
export class VendorDashboardComponent implements OnInit {
  activeTab: 'overview' | 'orders' | 'inventory' | 'craftsmen' | 'products' = 'overview';
  stats: DashboardStats = {
    totalOrders: 0,
    totalInventoryItems: 0,
    totalCraftsmen: 0,
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

  switchTab(tab: 'overview' | 'orders' | 'inventory' | 'craftsmen' | 'products'): void {
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

  logout(): void {
    this.authService.logout();
  }
}
