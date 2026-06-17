import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
import { UserRole } from '../models/user.model';

export interface WishlistProduct {
  id: number;
  productId: number;
  name: string;
  description: string;
  category: string;
  subcategory: string;
  retailPrice: number;
  wholesalePrice: number;
  stock: number;
  imageUrl: string;
  vendorName: string;
  craftsmanName: string;
  addedAt: string;
}

@Injectable({ providedIn: 'root' })
export class WishlistService {
  private readonly apiUrl = `${environment.apiUrl}/wishlist`;
  private wishlistIdsSubject = new BehaviorSubject<Set<number>>(new Set());
  public wishlistIds$ = this.wishlistIdsSubject.asObservable();

  constructor(private http: HttpClient, private auth: AuthService) {
    this.auth.currentUser.subscribe(user => {
      if (user?.role === UserRole.CUSTOMER && this.auth.getToken()) {
        this.loadIds();
      } else {
        this.wishlistIdsSubject.next(new Set());
      }
    });

    const user = this.auth.currentUserValue;
    if (user?.role === UserRole.CUSTOMER && this.auth.getToken()) {
      this.loadIds();
    }
  }

  private loadIds(): void {
    this.http.get<number[]>(`${this.apiUrl}/ids`).pipe(
      catchError(() => of([]))
    ).subscribe(ids => this.wishlistIdsSubject.next(new Set(ids)));
  }

  isWishlisted(productId: number): boolean {
    return this.wishlistIdsSubject.value.has(productId);
  }

  getWishlist(): Observable<WishlistProduct[]> {
    return this.http.get<WishlistProduct[]>(this.apiUrl).pipe(
      catchError(() => of([]))
    );
  }

  toggle(productId: number): Observable<{ added: boolean }> {
    if (this.isWishlisted(productId)) {
      return this.remove(productId);
    }
    return this.add(productId);
  }

  add(productId: number): Observable<{ added: boolean }> {
    return this.http.post<{ message: string; alreadyExists?: boolean }>(
      `${this.apiUrl}/${productId}`, {}
    ).pipe(
      tap(() => {
        const ids = new Set(this.wishlistIdsSubject.value);
        ids.add(productId);
        this.wishlistIdsSubject.next(ids);
      }),
      catchError(() => of({ message: '', added: false }))
    ) as any;
  }

  remove(productId: number): Observable<{ added: boolean }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${productId}`).pipe(
      tap(() => {
        const ids = new Set(this.wishlistIdsSubject.value);
        ids.delete(productId);
        this.wishlistIdsSubject.next(ids);
      }),
      catchError(() => of({ message: '', added: false }))
    ) as any;
  }

  get wishlistCount(): number {
    return this.wishlistIdsSubject.value.size;
  }

  resolveImageUrl(url?: string): string {
    if (!url) return 'assets/images/hero-bg.jpg';
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('assets/')) return url;
    const baseUrl = environment.apiUrl.replace('/api', '');
    return `${baseUrl}/${url}`;
  }
}
