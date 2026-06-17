import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { VendorService, VendorShop } from '../../core/services/vendor.service';

@Component({
  selector: 'app-shops',
  templateUrl: './shops.component.html',
  styleUrls: ['./shops.component.css']
})
export class ShopsComponent implements OnInit {
  shops: VendorShop[] = [];
  filteredShops: VendorShop[] = [];
  searchQuery = '';
  loading = true;

  constructor(
    private router: Router,
    private vendorService: VendorService
  ) {}

  ngOnInit(): void {
    this.vendorService.getShops().subscribe({
      next: shops => {
        this.shops = shops;
        this.filteredShops = [...shops];
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  onSearch(): void {
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      this.filteredShops = this.shops.filter(shop =>
        shop.name.toLowerCase().includes(q) ||
        shop.ownerName.toLowerCase().includes(q) ||
        (shop.city || '').toLowerCase().includes(q) ||
        shop.description.toLowerCase().includes(q)
      );
    } else {
      this.filteredShops = [...this.shops];
    }
  }

  viewShop(shopId: string): void {
    this.router.navigate(['/products'], { queryParams: { vendor: shopId } });
  }
}
