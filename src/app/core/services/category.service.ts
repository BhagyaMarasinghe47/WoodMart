import { Injectable } from '@angular/core';

export interface SubCategory {
  id: string;
  name: string;
  slug: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  subCategories: SubCategory[];
}

export interface CategoryProduct {
  id: string;
  name: string;
  price: number;
  image: string;
  vendorName: string;
  categorySlug: string;
  subCategorySlug: string;
}

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  // Main categories with sub-categories
  private categories: Category[] = [
    {
      id: '1',
      name: 'Living Room Furniture',
      slug: 'living-room-furniture',
      subCategories: [
        { id: '1-1', name: 'Wooden Sofa Sets', slug: 'wooden-sofa-sets' },
        { id: '1-2', name: 'Coffee Tables', slug: 'coffee-tables' },
        { id: '1-3', name: 'TV Stands / TV Consoles', slug: 'tv-stands-consoles' },
        { id: '1-4', name: 'Side Tables', slug: 'side-tables' },
        { id: '1-5', name: 'Display Cabinets', slug: 'display-cabinets' },
        { id: '1-6', name: 'Wooden Shelving Units', slug: 'wooden-shelving-units' }
      ]
    },
    {
      id: '2',
      name: 'Bedroom Furniture',
      slug: 'bedroom-furniture',
      subCategories: [
        { id: '2-1', name: 'Wooden Beds (Single / Double / King)', slug: 'wooden-beds' },
        { id: '2-2', name: 'Bed Side Tables', slug: 'bed-side-tables' },
        { id: '2-3', name: 'Wooden Wardrobes', slug: 'wooden-wardrobes' },
        { id: '2-4', name: 'Dressing Tables', slug: 'dressing-tables' },
        { id: '2-5', name: 'Chest of Drawers', slug: 'chest-of-drawers' }
      ]
    },
    {
      id: '3',
      name: 'Dining Room Furniture',
      slug: 'dining-room-furniture',
      subCategories: [
        { id: '3-1', name: 'Dining Tables', slug: 'dining-tables' },
        { id: '3-2', name: 'Dining Chairs', slug: 'dining-chairs' },
        { id: '3-3', name: 'Dining Table Sets', slug: 'dining-table-sets' },
        { id: '3-4', name: 'Wooden Buffets / Sideboards', slug: 'wooden-buffets-sideboards' },
        { id: '3-5', name: 'Crockery Cabinets', slug: 'crockery-cabinets' }
      ]
    },
    {
      id: '4',
      name: 'Office Furniture',
      slug: 'office-furniture',
      subCategories: [
        { id: '4-1', name: 'Office Desks', slug: 'office-desks' },
        { id: '4-2', name: 'Office Chairs (Wood-based)', slug: 'office-chairs' },
        { id: '4-3', name: 'Filing Cabinets', slug: 'filing-cabinets' },
        { id: '4-4', name: 'Conference Tables', slug: 'conference-tables' },
        { id: '4-5', name: 'Bookshelves', slug: 'bookshelves' }
      ]
    },
    {
      id: '5',
      name: 'Outdoor & Garden Furniture',
      slug: 'outdoor-garden-furniture',
      subCategories: [
        { id: '5-1', name: 'Garden Chairs', slug: 'garden-chairs' },
        { id: '5-2', name: 'Garden Tables', slug: 'garden-tables' },
        { id: '5-3', name: 'Wooden Benches', slug: 'wooden-benches' },
        { id: '5-4', name: 'Patio Sets', slug: 'patio-sets' },
        { id: '5-5', name: 'Gazebo Furniture', slug: 'gazebo-furniture' }
      ]
    },
    {
      id: '6',
      name: 'Storage & Utility Furniture',
      slug: 'storage-utility-furniture',
      subCategories: [
        { id: '6-1', name: 'Shoe Racks', slug: 'shoe-racks' },
        { id: '6-2', name: 'Wooden Cupboards', slug: 'wooden-cupboards' },
        { id: '6-3', name: 'Cabinets', slug: 'cabinets' },
        { id: '6-4', name: 'Wooden Racks', slug: 'wooden-racks' },
        { id: '6-5', name: 'Wall-mounted Storage', slug: 'wall-mounted-storage' }
      ]
    },
    {
      id: '7',
      name: 'Kids Furniture',
      slug: 'kids-furniture',
      subCategories: [
        { id: '7-1', name: 'Kids Beds', slug: 'kids-beds' },
        { id: '7-2', name: 'Study Tables', slug: 'study-tables' },
        { id: '7-3', name: 'Toy Storage Units', slug: 'toy-storage-units' },
        { id: '7-4', name: 'Bookshelves for Kids', slug: 'bookshelves-for-kids' }
      ]
    }
  ];

  // Dummy products
  // In a real application, this would be fetched from backend API
  private dummyProducts: CategoryProduct[] = [
    // Living Room
    { id: 'p1', name: 'Premium Teak Wood Sofa Set', price: 45000, image: 'assets/images/hero-bg.jpg', vendorName: 'Premium Woodworks', categorySlug: 'living-room-furniture', subCategorySlug: 'wooden-sofa-sets' },
    { id: 'p2', name: 'Modern L-Shape Sofa', price: 55000, image: 'assets/images/hero-bg.jpg', vendorName: 'Artisan Wood Gallery', categorySlug: 'living-room-furniture', subCategorySlug: 'wooden-sofa-sets' },
    { id: 'p3', name: 'Classic Oak Coffee Table', price: 12000, image: 'assets/images/hero-bg.jpg', vendorName: 'Premium Woodworks', categorySlug: 'living-room-furniture', subCategorySlug: 'coffee-tables' },
    { id: 'p4', name: 'Rustic Wood Coffee Table', price: 15000, image: 'assets/images/hero-bg.jpg', vendorName: 'Rustic Wood Store', categorySlug: 'living-room-furniture', subCategorySlug: 'coffee-tables' },
    { id: 'p5', name: 'Modern TV Stand with Storage', price: 18000, image: 'assets/images/hero-bg.jpg', vendorName: 'Artisan Wood Gallery', categorySlug: 'living-room-furniture', subCategorySlug: 'tv-stands-consoles' },
    
    // Bedroom
    { id: 'p6', name: 'King Size Wooden Bed', price: 35000, image: 'assets/images/hero-bg.jpg', vendorName: 'Premium Woodworks', categorySlug: 'bedroom-furniture', subCategorySlug: 'wooden-beds' },
    { id: 'p7', name: 'Queen Size Teak Bed', price: 30000, image: 'assets/images/hero-bg.jpg', vendorName: 'Artisan Wood Gallery', categorySlug: 'bedroom-furniture', subCategorySlug: 'wooden-beds' },
    { id: 'p8', name: 'Wooden Bedside Table', price: 8000, image: 'assets/images/hero-bg.jpg', vendorName: 'Premium Woodworks', categorySlug: 'bedroom-furniture', subCategorySlug: 'bed-side-tables' },
    { id: 'p9', name: 'Large Wooden Wardrobe', price: 45000, image: 'assets/images/hero-bg.jpg', vendorName: 'Rustic Wood Store', categorySlug: 'bedroom-furniture', subCategorySlug: 'wooden-wardrobes' },
    
    // Dining Room
    { id: 'p10', name: '6 Seater Dining Table', price: 28000, image: 'assets/images/hero-bg.jpg', vendorName: 'Premium Woodworks', categorySlug: 'dining-room-furniture', subCategorySlug: 'dining-tables' },
    { id: 'p11', name: 'Wooden Dining Chair Set (4 pcs)', price: 16000, image: 'assets/images/hero-bg.jpg', vendorName: 'Artisan Wood Gallery', categorySlug: 'dining-room-furniture', subCategorySlug: 'dining-chairs' },
    { id: 'p12', name: 'Complete Dining Set', price: 55000, image: 'assets/images/hero-bg.jpg', vendorName: 'Premium Woodworks', categorySlug: 'dining-room-furniture', subCategorySlug: 'dining-table-sets' },
    
    // Office
    { id: 'p13', name: 'Executive Office Desk', price: 32000, image: 'assets/images/hero-bg.jpg', vendorName: 'Artisan Wood Gallery', categorySlug: 'office-furniture', subCategorySlug: 'office-desks' },
    { id: 'p14', name: 'Wooden Office Chair', price: 15000, image: 'assets/images/hero-bg.jpg', vendorName: 'Premium Woodworks', categorySlug: 'office-furniture', subCategorySlug: 'office-chairs' },
    { id: 'p15', name: 'Wooden Bookshelf 5-Tier', price: 18000, image: 'assets/images/hero-bg.jpg', vendorName: 'Rustic Wood Store', categorySlug: 'office-furniture', subCategorySlug: 'bookshelves' },
    
    // Kids
    { id: 'p16', name: 'Kids Single Bed', price: 15000, image: 'assets/images/hero-bg.jpg', vendorName: 'Artisan Wood Gallery', categorySlug: 'kids-furniture', subCategorySlug: 'kids-beds' },
    { id: 'p17', name: 'Kids Study Table with Chair', price: 12000, image: 'assets/images/hero-bg.jpg', vendorName: 'Premium Woodworks', categorySlug: 'kids-furniture', subCategorySlug: 'study-tables' },
    { id: 'p18', name: 'Toy Storage Cabinet', price: 8000, image: 'assets/images/hero-bg.jpg', vendorName: 'Rustic Wood Store', categorySlug: 'kids-furniture', subCategorySlug: 'toy-storage-units' }
  ];

  constructor() { }

  // Get all main categories
  getCategories(): Category[] {
    return this.categories;
  }

  // Get all main categories (alias for backwards compatibility)
  getAllCategories(): Category[] {
    return this.categories;
  }

  // Get category by slug
  getCategoryBySlug(slug: string): Category | undefined {
    return this.categories.find(cat => cat.slug === slug);
  }

  // Get products by category
  getProductsByCategory(categorySlug: string): CategoryProduct[] {
    return this.dummyProducts.filter(p => p.categorySlug === categorySlug);
  }

  // Get products by sub-category
  getProductsBySubCategory(categorySlug: string, subCategorySlug: string): CategoryProduct[] {
    return this.dummyProducts.filter(
      p => p.categorySlug === categorySlug && p.subCategorySlug === subCategorySlug
    );
  }
}
