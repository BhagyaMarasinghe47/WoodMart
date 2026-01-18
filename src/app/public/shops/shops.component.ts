import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

interface Shop {
  id: string;
  name: string;
  ownerName: string;
  description: string;
  rating: number;
  deliveryAvailable: boolean;
  image: string;
}

@Component({
  selector: 'app-shops',
  templateUrl: './shops.component.html',
  styleUrls: ['./shops.component.css']
})
export class ShopsComponent implements OnInit {
  shops: Shop[] = [];
  filteredShops: Shop[] = [];
  searchQuery = '';

  constructor(private router: Router) {}

  ngOnInit(): void {
    // Mock vendor shops data
    // In a real application, this would come from a backend API
    this.shops = [
      {
        id: '1',
        name: 'Premium Woodworks',
        ownerName: 'Jane Vendor',
        description: 'Quality wooden furniture and home decor items',
        rating: 4.5,
        deliveryAvailable: true,
        image: 'assets/images/hero-bg.jpg'
      },
      {
        id: '2',
        name: 'Artisan Wood Gallery',
        ownerName: 'Mike Smith',
        description: 'Handcrafted wooden art and custom furniture',
        rating: 4.8,
        deliveryAvailable: true,
        image: 'assets/images/hero-bg.jpg'
      },
      {
        id: '3',
        name: 'Rustic Wood Store',
        ownerName: 'Sarah Johnson',
        description: 'Rustic and vintage wooden products',
        rating: 4.3,
        deliveryAvailable: false,
        image: 'assets/images/hero-bg.jpg'
      }
    ];
    this.filteredShops = [...this.shops];
  }

  onSearch(): void {
    if (this.searchQuery.trim()) {
      this.filteredShops = this.shops.filter(shop =>
        shop.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        shop.description.toLowerCase().includes(this.searchQuery.toLowerCase())
      );
    } else {
      this.filteredShops = [...this.shops];
    }
  }

  viewShop(shopId: string): void {
    // Navigate to shop details or products from this vendor
    this.router.navigate(['/products'], { queryParams: { vendor: shopId } });
  }
}
