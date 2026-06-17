import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CategoryService, Category } from '../../core/services/category.service';

@Component({
  selector: 'app-category-bar',
  templateUrl: './category-bar.component.html',
  styleUrls: ['./category-bar.component.css']
})
export class CategoryBarComponent implements OnInit {
  categories: Category[] = [];
  activeDropdown: string | null = null;

  constructor(
    private categoryService: CategoryService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.categoryService.loadCategories().subscribe({
      next: (categories) => {
        this.categories = categories;
      }
    });
  }

  showDropdown(categoryId: string): void {
    this.activeDropdown = categoryId;
  }

  hideDropdown(): void {
    this.activeDropdown = null;
  }

  navigateToCategory(categorySlug: string): void {
    this.hideDropdown();
    this.router.navigate(['/category', categorySlug]);
  }

  navigateToSubCategory(categorySlug: string, subCategorySlug: string): void {
    this.hideDropdown();
    this.router.navigate(['/category', categorySlug], {
      queryParams: { sub: subCategorySlug }
    });
  }
}
