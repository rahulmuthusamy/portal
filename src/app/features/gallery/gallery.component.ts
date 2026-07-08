import { Component, OnInit, signal, WritableSignal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { environment } from '@environments/environment';
import { SettingsService } from '@core/services/settings.service';

interface GalleryImage {
  id: string;
  src: string;
  thumbnail: string;
  caption: string;
  category: string;
  uploadDate: Date;
  photographer?: string;
  tags?: string[];
  likes?: number;
}

interface Album {
  id: string;
  title: string;
  description: string;
  coverImage: string;
  category: string;
  images: GalleryImage[];
  createdDate: Date;
}

@Component({
  selector: 'app-gallery',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './gallery.component.html',
  styleUrl: './gallery.component.scss'
})
export class GalleryComponent implements OnInit {
  private baseUrl = environment.apiUrl;

  // View Mode
  viewMode = signal<'grid' | 'masonry' | 'album'>('grid');

  // Data
  albums: WritableSignal<Album[]> = signal([]);
  allImages: WritableSignal<GalleryImage[]> = signal([]);

  // Filters
  categories = ['All', 'Matches', 'Team Photos', 'Players', 'Trophy Ceremony', 'Celebrations', 'Events', 'Training'];
  selectedCategory = signal<string>('All');
  searchQuery = signal<string>('');
  sortBy = signal<'date' | 'name' | 'popular'>('date');

  // Lightbox
  lightboxOpen = signal<boolean>(false);
  currentImageIndex = signal<number>(0);
  currentAlbumImages = signal<GalleryImage[]>([]);

  // UI State
  isLoading = signal<boolean>(false);
  selectedImages = signal<string[]>([]);

  // Pagination
  currentPage = signal<number>(1);
  imagesPerPage = 12;

  constructor(private settingsService: SettingsService) { }

  ngOnInit(): void {
    this.loadGalleryData();
  }

  loadGalleryData(): void {
    this.isLoading.set(true);
    this.settingsService.getGallery().subscribe({
      next: (res) => {
        const images: GalleryImage[] = res.data.gallery.map((item: any) => ({
          id: item.id.toString(),
          src: `${this.baseUrl}${item.ImageURL}`,
          thumbnail: item.ThumbnailURL ? `${this.baseUrl}${item.ThumbnailURL}` : `${this.baseUrl}${item.ImageURL}`,
          caption: item.Description || item.Title || '',
          category: item.Category,
          uploadDate: new Date(item.createdAt),
          photographer: item.UploadedBy || 'Staff',
          tags: item.Tags ? (typeof item.Tags === 'string' ? JSON.parse(item.Tags) : item.Tags) : [],
          likes: 0
        }));
        this.allImages.set(images);

        // Group by category as albums
        const albumsMap = new Map<string, Album>();
        images.forEach(img => {
          if (!albumsMap.has(img.category)) {
            albumsMap.set(img.category, {
              id: img.category,
              title: img.category,
              description: `Collection of ${img.category} photos`,
              coverImage: img.src,
              category: img.category,
              images: [],
              createdDate: img.uploadDate
            });
          }
          albumsMap.get(img.category)?.images.push(img);
        });
        this.albums.set(Array.from(albumsMap.values()));
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading gallery:', err);
        this.isLoading.set(false);
      }
    });
  }

  // ==================== FILTERING & SORTING ====================

  getFilteredImages(): GalleryImage[] {
    let images = this.allImages();

    // Filter by category
    if (this.selectedCategory() !== 'All') {
      images = images.filter(img => img.category === this.selectedCategory());
    }

    // Filter by search query
    const query = this.searchQuery().toLowerCase();
    if (query) {
      images = images.filter(img =>
        img.caption.toLowerCase().includes(query) ||
        img.tags?.some(tag => tag.toLowerCase().includes(query)) ||
        img.photographer?.toLowerCase().includes(query)
      );
    }

    // Sort
    const sortedImages = [...images];
    switch (this.sortBy()) {
      case 'date':
        sortedImages.sort((a, b) => b.uploadDate.getTime() - a.uploadDate.getTime());
        break;
      case 'name':
        sortedImages.sort((a, b) => a.caption.localeCompare(b.caption));
        break;
      case 'popular':
        sortedImages.sort((a, b) => (b.likes || 0) - (a.likes || 0));
        break;
    }

    return sortedImages;
  }

  getFilteredAlbums(): Album[] {
    let albums = this.albums();

    if (this.selectedCategory() !== 'All') {
      albums = albums.filter(album => album.category === this.selectedCategory());
    }

    const query = this.searchQuery().toLowerCase();
    if (query) {
      albums = albums.filter(album =>
        album.title.toLowerCase().includes(query) ||
        album.description.toLowerCase().includes(query)
      );
    }

    return albums;
  }

  getPaginatedImages(): GalleryImage[] {
    const filtered = this.getFilteredImages();
    const start = (this.currentPage() - 1) * this.imagesPerPage;
    const end = start + this.imagesPerPage;
    return filtered.slice(start, end);
  }

  getTotalPages(): number {
    return Math.ceil(this.getFilteredImages().length / this.imagesPerPage);
  }

  // ==================== LIGHTBOX ====================

  openLightbox(image: GalleryImage, images?: GalleryImage[]): void {
    const imagesToShow = images || this.getFilteredImages();
    this.currentAlbumImages.set(imagesToShow);
    const index = imagesToShow.findIndex(img => img.id === image.id);
    this.currentImageIndex.set(index >= 0 ? index : 0);
    this.lightboxOpen.set(true);
    document.body.style.overflow = 'hidden';
  }

  openAlbumLightbox(album: Album): void {
    this.currentAlbumImages.set(album.images);
    this.currentImageIndex.set(0);
    this.lightboxOpen.set(true);
    document.body.style.overflow = 'hidden';
  }

  closeLightbox(): void {
    this.lightboxOpen.set(false);
    document.body.style.overflow = '';
  }

  nextImage(): void {
    const images = this.currentAlbumImages();
    const nextIndex = (this.currentImageIndex() + 1) % images.length;
    this.currentImageIndex.set(nextIndex);
  }

  prevImage(): void {
    const images = this.currentAlbumImages();
    const prevIndex = this.currentImageIndex() === 0
      ? images.length - 1
      : this.currentImageIndex() - 1;
    this.currentImageIndex.set(prevIndex);
  }

  getCurrentImage(): GalleryImage | null {
    const images = this.currentAlbumImages();
    return images[this.currentImageIndex()] || null;
  }

  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent): void {
    if (!this.lightboxOpen()) return;

    switch (event.key) {
      case 'Escape':
        this.closeLightbox();
        break;
      case 'ArrowRight':
        this.nextImage();
        break;
      case 'ArrowLeft':
        this.prevImage();
        break;
    }
  }

  // ==================== IMAGE SELECTION ====================

  toggleImageSelection(imageId: string): void {
    this.selectedImages.update(selected => {
      if (selected.includes(imageId)) {
        return selected.filter(id => id !== imageId);
      } else {
        return [...selected, imageId];
      }
    });
  }

  selectAllImages(): void {
    const allIds = this.getFilteredImages().map(img => img.id);
    this.selectedImages.set(allIds);
  }

  deselectAllImages(): void {
    this.selectedImages.set([]);
  }

  // ==================== ACTIONS ====================

  downloadImage(image: GalleryImage): void {
    const link = document.createElement('a');
    link.href = image.src;
    link.download = `${image.caption.replace(/\s+/g, '_')}.jpg`;
    link.click();
  }

  shareImage(image: GalleryImage): void {
    if (navigator.share) {
      navigator.share({
        title: image.caption,
        text: `Check out this image: ${image.caption}`,
        url: window.location.href
      }).catch(err => console.log('Error sharing:', err));
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  }

  likeImage(image: GalleryImage): void {
    this.allImages.update(images =>
      images.map(img =>
        img.id === image.id
          ? { ...img, likes: (img.likes || 0) + 1 }
          : img
      )
    );
  }

  // ==================== PAGINATION ====================

  goToPage(page: number): void {
    this.currentPage.set(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  nextPage(): void {
    if (this.currentPage() < this.getTotalPages()) {
      this.goToPage(this.currentPage() + 1);
    }
  }

  prevPage(): void {
    if (this.currentPage() > 1) {
      this.goToPage(this.currentPage() - 1);
    }
  }

  // ==================== VIEW MODE ====================

  setViewMode(mode: 'grid' | 'masonry' | 'album'): void {
    this.viewMode.set(mode);
    this.currentPage.set(1);
  }

  // ==================== FILTERS ====================

  setCategory(category: string): void {
    this.selectedCategory.set(category);
    this.currentPage.set(1);
  }

  setSortBy(sort: 'date' | 'name' | 'popular'): void {
    this.sortBy.set(sort);
  }

  clearFilters(): void {
    this.selectedCategory.set('All');
    this.searchQuery.set('');
    this.sortBy.set('date');
    this.currentPage.set(1);
  }
}
