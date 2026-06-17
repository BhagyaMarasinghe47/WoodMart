export interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  categoryId?: number;
  subcategory?: string;
  subcategoryId?: number;
  wholesalePrice: number;
  retailPrice: number;
  stock: number;
  imageUrl: string;
  craftsmanId?: string;
  craftsmanName?: string;
  vendorId?: string;
  vendorName?: string;
  createdAt: Date;
  isActive: boolean;
  dimensions?: string;
  material?: string;
  weight?: string;
}

export interface Category {
  id: string;
  name: string;
  slug?: string;
  description: string;
  imageUrl: string;
  productCount: number;
}
