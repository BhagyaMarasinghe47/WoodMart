import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface ReviewItem {
  id: number;
  customerId: number;
  customerName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface ReviewSummary {
  reviews: ReviewItem[];
  averageRating: number;
  reviewCount: number;
}

@Injectable({ providedIn: 'root' })
export class ReviewService {
  private readonly apiUrl = `${environment.apiUrl}/reviews`;

  constructor(private http: HttpClient) {}

  getProductReviews(productId: number): Observable<ReviewSummary> {
    return this.http.get<ReviewSummary>(`${this.apiUrl}/product/${productId}`).pipe(
      catchError(() => of({ reviews: [], averageRating: 0, reviewCount: 0 }))
    );
  }

  submitReview(productId: number, rating: number, comment: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.apiUrl}/product/${productId}`,
      { rating, comment }
    );
  }

  deleteReview(reviewId: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${reviewId}`);
  }
}
