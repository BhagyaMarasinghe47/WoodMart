import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Order, OrderItem, OrderStatus } from '../models/order.model';

export interface PaymentMethodOption {
  id: number;
  name: string;
  description?: string;
}

export interface CreateOrderFromCartRequest {
  deliveryAddress: string;
  deliveryCity?: string;
  deliveryPostalCode?: string;
  notes?: string;
  paymentMethodId: number;
}

export interface PlaceOrderResult {
  success: boolean;
  message: string;
  order?: Order;
}

interface ApiOrderItemDto {
  id: number;
  productId: number;
  productName: string;
  price: number;
  quantity: number;
  totalPrice: number;
}

interface ApiCustomerOrderDto {
  id: number;
  orderNumber?: string;
  customerId: number;
  orderDate: string;
  deliveryDate?: string;
  deliveryAddress: string;
  deliveryCity?: string;
  deliveryState?: string;
  deliveryPostalCode?: string;
  deliveryCountry?: string;
  status: string;
  totalAmount: number;
  notes?: string;
  items: ApiOrderItemDto[];
  payment?: {
    id: number;
    paymentMethod: string;
    status: string;
    amount: number;
    paymentDate: string;
    transactionId?: string;
  };
}

interface ApiPaymentMethodDto {
  id: number;
  name: string;
  description?: string;
}

const DEFAULT_PRODUCT_IMAGE = 'assets/images/hero-bg.jpg';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private readonly ordersApi = `${environment.apiUrl}/orders`;
  private readonly paymentsApi = `${environment.apiUrl}/payments`;

  constructor(private http: HttpClient) {}

  getMyOrders(): Observable<Order[]> {
    return this.http.get<ApiCustomerOrderDto[]>(this.ordersApi).pipe(
      map(orders => orders.map(o => this.mapApiOrder(o))),
      catchError(err => {
        console.error('Failed to load orders:', err);
        return of([]);
      })
    );
  }

  getOrderById(orderId: string): Observable<Order | undefined> {
    return this.http.get<ApiCustomerOrderDto>(`${this.ordersApi}/${orderId}`).pipe(
      map(o => this.mapApiOrder(o)),
      catchError(() => of(undefined))
    );
  }

  getPaymentMethods(): Observable<PaymentMethodOption[]> {
    return this.http.get<ApiPaymentMethodDto[]>(`${this.paymentsApi}/methods`).pipe(
      map(methods => methods
        .filter(m => !m.name.toLowerCase().includes('paypal'))
        .map(m => ({ id: m.id, name: m.name, description: m.description }))),
      catchError(() => of([
        { id: 1, name: 'Credit Card' },
        { id: 2, name: 'Debit Card' },
        { id: 5, name: 'Cash On Delivery' }
      ]))
    );
  }

  placeOrderFromCart(request: CreateOrderFromCartRequest): Observable<PlaceOrderResult> {
    return this.http.post<ApiCustomerOrderDto>(`${this.ordersApi}/from-cart`, request).pipe(
      map(order => ({
        success: true,
        message: 'Order placed successfully!',
        order: this.mapApiOrder(order)
      })),
      catchError(err => of({
        success: false,
        message: this.extractErrorMessage(err, 'Could not place order.')
      }))
    );
  }

  cancelOrder(orderId: string): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ message: string }>(`${this.ordersApi}/${orderId}/cancel`).pipe(
      map(res => ({ success: true, message: res.message || 'Order cancelled.' })),
      catchError(err => of({
        success: false,
        message: this.extractErrorMessage(err, 'Could not cancel order.')
      }))
    );
  }

  private mapApiOrder(dto: ApiCustomerOrderDto): Order {
    const items: OrderItem[] = (dto.items || []).map(item => ({
      productId: String(item.productId),
      productName: item.productName,
      productImage: DEFAULT_PRODUCT_IMAGE,
      quantity: item.quantity,
      price: Number(item.price),
      subtotal: Number(item.totalPrice)
    }));

    return {
      id: String(dto.id),
      orderNumber: dto.orderNumber || String(dto.id),
      customerId: String(dto.customerId),
      customerName: '',
      items,
      totalAmount: Number(dto.totalAmount),
      status: this.mapStatus(dto.status),
      shippingAddress: dto.deliveryAddress,
      deliveryCity: dto.deliveryCity,
      deliveryState: dto.deliveryState,
      deliveryPostalCode: dto.deliveryPostalCode,
      deliveryCountry: dto.deliveryCountry || 'Sri Lanka',
      notes: dto.notes,
      paymentMethod: dto.payment?.paymentMethod || '—',
      paymentStatus: dto.payment?.status,
      paymentDate: dto.payment?.paymentDate ? new Date(dto.payment.paymentDate) : undefined,
      paymentAmount: dto.payment ? Number(dto.payment.amount) : undefined,
      paymentTransactionId: dto.payment?.transactionId,
      estimatedDelivery: dto.deliveryDate ? new Date(dto.deliveryDate) : undefined,
      createdAt: new Date(dto.orderDate),
      updatedAt: new Date(dto.deliveryDate || dto.orderDate)
    };
  }

  private mapStatus(status: string): OrderStatus {
    const key = status?.toUpperCase().replace(/\s+/g, '_');
    if (key && key in OrderStatus) {
      return OrderStatus[key as keyof typeof OrderStatus];
    }
    return OrderStatus.PENDING;
  }

  private extractErrorMessage(err: unknown, fallback: string): string {
    const httpErr = err as HttpErrorResponse;
    if (httpErr?.status === 401) {
      return 'Your session has expired. Please log in again.';
    }
    const body = httpErr?.error;
    if (typeof body === 'string' && body.trim()) {
      return body;
    }
    if (body && typeof body === 'object' && 'message' in body && body.message) {
      return String(body.message);
    }
    return fallback;
  }
}
