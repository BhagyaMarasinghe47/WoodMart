export interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  subcategory?: string;
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
  description: string;
  imageUrl: string;
  productCount: number;
}
