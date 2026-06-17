import { Component, OnInit } from '@angular/core';
import { AuthService } from '../core/services/auth.service';
import { User } from '../core/models/user.model';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  currentUser: User | null = null;
  form = { firstName: '', lastName: '', phone: '', city: '' };

  avatarPreview: string = '';
  avatarUploading = false;
  avatarError = '';

  saving = false;
  saveSuccess = false;
  saveError = '';

  private readonly baseUrl = environment.apiUrl.replace('/api', '');

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.currentUser = this.authService.currentUserValue;
    if (this.currentUser) {
      this.form.firstName = this.currentUser.firstName;
      this.form.lastName = this.currentUser.lastName;
      this.form.phone = this.currentUser.phone || '';
      this.form.city = this.currentUser.city || '';
      this.avatarPreview = this.resolveAvatarUrl(this.currentUser.profileImageUrl);
    }
  }

  resolveAvatarUrl(url?: string): string {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `${this.baseUrl}/${url}`;
  }

  getInitials(): string {
    if (!this.currentUser) return '?';
    const f = this.currentUser.firstName?.[0] || '';
    const l = this.currentUser.lastName?.[0] || '';
    return (f + l).toUpperCase() || '?';
  }

  onAvatarSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    const file = input.files[0];
    this.avatarUploading = true;
    this.avatarError = '';

    this.authService.uploadProfileImage(file).subscribe({
      next: (res) => {
        this.avatarPreview = `${this.baseUrl}/${res.imageUrl}`;
        this.avatarUploading = false;
        const profileImageUrl = res.imageUrl;
        this.authService.updateProfile(this.currentUser!.id, { profileImageUrl }).subscribe({
          next: () => { this.currentUser = this.authService.currentUserValue; },
          error: () => {}
        });
      },
      error: () => {
        this.avatarError = 'Image upload failed. Please try again.';
        this.avatarUploading = false;
      }
    });
  }

  saveProfile(): void {
    if (!this.currentUser) return;
    this.saving = true;
    this.saveSuccess = false;
    this.saveError = '';

    this.authService.updateProfile(this.currentUser.id, {
      firstName: this.form.firstName,
      lastName: this.form.lastName,
      phone: this.form.phone,
      city: this.form.city
    }).subscribe({
      next: () => {
        this.saving = false;
        this.saveSuccess = true;
        this.currentUser = this.authService.currentUserValue;
        setTimeout(() => this.saveSuccess = false, 3000);
      },
      error: () => {
        this.saving = false;
        this.saveError = 'Failed to save changes. Please try again.';
      }
    });
  }
}
