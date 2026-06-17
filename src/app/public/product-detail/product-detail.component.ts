import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductService } from '../../core/services/product.service';
import { CartService } from '../../core/services/cart.service';
import { WishlistService } from '../../core/services/wishlist.service';
import { AuthService } from '../../core/services/auth.service';
import { ReviewService, ReviewItem, ReviewSummary } from '../../core/services/review.service';
import { Product } from '../../core/models/product.model';
import { UserRole } from '../../core/models/user.model';
import { ToastService } from '../../core/services/toast.service';
import { ConfirmDialogService } from '../../core/services/confirm-dialog.service';

@Component({
  selector: 'app-product-detail',
  templateUrl: './product-detail.component.html',
  styleUrls: ['./product-detail.component.css']
})
export class ProductDetailComponent implements OnInit {
  product: Product | undefined;
  loading = true;
  quantity = 1;

  // Reviews
  reviewSummary: ReviewSummary = { reviews: [], averageRating: 0, reviewCount: 0 };
  reviewsLoading = false;
  myReview: ReviewItem | null = null;
  showReviewForm = false;
  newRating = 0;
  hoverRating = 0;
  newComment = '';
  submittingReview = false;
  reviewError = '';
  wishlistInProgress = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService,
    private cartService: CartService,
    public wishlistService: WishlistService,
    public authService: AuthService,
    private reviewService: ReviewService,
    private toast: ToastService,
    private confirmDialog: ConfirmDialogService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.loadProduct(params['id']);
    });
  }

  loadProduct(id: string): void {
    this.loading = true;
    this.productService.getProductById(id).subscribe({
      next: (product) => {
        this.product = product;
        this.loading = false;
        if (product) this.loadReviews(Number(product.id));
      },
      error: () => { this.loading = false; }
    });
  }

  loadReviews(productId: number): void {
    this.reviewsLoading = true;
    this.reviewService.getProductReviews(productId).subscribe(summary => {
      this.reviewSummary = summary;
      const currentId = this.authService.currentUserValue?.id;
      this.myReview = currentId
        ? summary.reviews.find(r => r.customerId === Number(currentId)) ?? null
        : null;
      if (this.myReview) {
        this.newRating = this.myReview.rating;
        this.newComment = this.myReview.comment;
      }
      this.reviewsLoading = false;
    });
  }

  // ── Cart ──────────────────────────────────────
  incrementQuantity(): void {
    if (this.product && this.quantity < this.product.stock) this.quantity++;
  }

  decrementQuantity(): void {
    if (this.quantity > 1) this.quantity--;
  }

  addToCart(): void {
    if (!this.product || this.product.stock === 0) return;
    this.cartService.addToCart(
      this.product.id, this.product.name, this.product.imageUrl,
      this.product.retailPrice, this.product.stock, this.quantity
    ).subscribe(result => {
      if (result.success) {
        this.toast.success(`${this.quantity} × ${this.product!.name} added to cart!`);
        this.quantity = 1;
      } else {
        this.cartService.notifyAddResult(result, this.product!.name);
      }
    });
  }

  // ── Wishlist ──────────────────────────────────
  isWishlisted(): boolean {
    return this.product ? this.wishlistService.isWishlisted(Number(this.product.id)) : false;
  }

  toggleWishlist(): void {
    if (!this.product) return;
    if (!this.authService.isAuthenticated() || this.authService.currentUserValue?.role !== UserRole.CUSTOMER) {
      this.confirmDialog.confirm('Please log in as a customer to use your wishlist.', 'Go to Login', 'Cancel')
        .then(go => { if (go) this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } }); });
      return;
    }
    this.wishlistInProgress = true;
    this.wishlistService.toggle(Number(this.product.id)).subscribe({
      next: () => { this.wishlistInProgress = false; },
      error: () => { this.wishlistInProgress = false; }
    });
  }

  // ── Reviews ───────────────────────────────────
  isCustomer(): boolean {
    return this.authService.currentUserValue?.role === UserRole.CUSTOMER;
  }

  openReviewForm(): void {
    if (!this.authService.isAuthenticated()) {
      this.confirmDialog.confirm('Please log in to leave a review.', 'Go to Login', 'Cancel')
        .then(go => { if (go) this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } }); });
      return;
    }
    this.showReviewForm = true;
    this.reviewError = '';
  }

  cancelReview(): void {
    this.showReviewForm = false;
    this.reviewError = '';
    if (this.myReview) {
      this.newRating = this.myReview.rating;
      this.newComment = this.myReview.comment;
    } else {
      this.newRating = 0;
      this.newComment = '';
    }
  }

  setRating(star: number): void { this.newRating = star; }
  setHover(star: number): void { this.hoverRating = star; }
  clearHover(): void { this.hoverRating = 0; }

  starFilled(star: number): boolean {
    return star <= (this.hoverRating || this.newRating);
  }

  submitReview(): void {
    if (this.newRating === 0) { this.reviewError = 'Please select a star rating.'; return; }
    if (!this.product) return;
    this.submittingReview = true;
    this.reviewError = '';
    this.reviewService.submitReview(Number(this.product.id), this.newRating, this.newComment).subscribe({
      next: () => {
        this.submittingReview = false;
        this.showReviewForm = false;
        this.loadReviews(Number(this.product!.id));
      },
      error: (err) => {
        this.submittingReview = false;
        this.reviewError = err?.error?.message || 'Failed to submit review.';
      }
    });
  }

  deleteReview(): void {
    if (!this.myReview) return;
    this.confirmDialog.confirm('Delete your review?', 'Delete', 'Cancel').then(confirmed => {
      if (!confirmed || !this.myReview) return;
      this.reviewService.deleteReview(this.myReview.id).subscribe({
        next: () => {
          this.myReview = null;
          this.newRating = 0;
          this.newComment = '';
          this.showReviewForm = false;
          this.loadReviews(Number(this.product!.id));
        },
        error: (err) => this.toast.error(err?.error?.message || 'Failed to delete review.')
      });
    });
  }

  starsArray(rating: number): number[] {
    return [1, 2, 3, 4, 5];
  }

  starFilledDisplay(star: number, rating: number): boolean {
    return star <= Math.round(rating);
  }

  goBack(): void { this.router.navigate(['/products']); }
}
