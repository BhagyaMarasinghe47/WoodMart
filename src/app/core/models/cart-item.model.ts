export interface CartItem {
  cartItemId: string;
  productId: string;
  productName: string;
  productImage: string;
  quantity: number;
  price: number;
  maxStock: number;
}

export interface Cart {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
}

export interface CartActionResult {
  success: boolean;
  message: string;
  loginRequired?: boolean;
}
