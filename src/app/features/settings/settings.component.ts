import { Component, OnInit, signal, WritableSignal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { environment } from '@environments/environment';
import { SettingsService } from '@core/services/settings.service';

interface CarouselImage {
  id: string;
  src: string;
  alt: string;
  title: string;
  description: string;
  order: number;
  isActive: boolean;
  file?: File;
}

interface GalleryImage {
  id: string;
  src: string;
  caption: string;
  category: string;
  uploadDate: Date;
  file?: File;
}

interface Sponsor {
  id: string;
  name: string;
  logo: string;
  description: string;
  website: string;
  order: number;
  isActive: boolean;
  file?: File;
}

interface AppSettings {
  appName: string;
  appLogo: string;
  appDescription: string;
  primaryColor: string;
  secondaryColor: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  socialMedia: {
    facebook: string;
    instagram: string;
    twitter: string;
    youtube: string;
  };
  upiName: string;
  upiId: string;
  upiScannerImage: string;
}

interface PollOption {
  id?: number;
  OptionText: string;
  Votes: number;
}

interface Poll {
  id: number;
  Question: string;
  Description: string;
  IsActive: boolean;
  TotalVotes: number;
  options: PollOption[];
  createdAt: Date;
}

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss'
})
export class SettingsComponent implements OnInit {
  // Active Tab Management
  activeTab = signal<string>('carousel');

  // Forms
  appSettingsForm!: FormGroup;
  carouselForm!: FormGroup;
  sponsorForm!: FormGroup;
  pollForm!: FormGroup;

  // Data Signals
  carouselImages: WritableSignal<CarouselImage[]> = signal([]);
  activeCarouselImages = computed(() => this.carouselImages().filter(img => img.isActive));
  galleryImages: WritableSignal<GalleryImage[]> = signal([]);
  sponsors: WritableSignal<Sponsor[]> = signal([]);
  polls: WritableSignal<Poll[]> = signal([]);
  appSettings: WritableSignal<AppSettings> = signal({
    appName: 'Kattur Cricket Club',
    appLogo: 'assets/logo.jpeg',
    appDescription: 'Village Cricket League Management System',
    primaryColor: '#1a73e8',
    secondaryColor: '#34a853',
    contactEmail: 'info@katturcricket.com',
    contactPhone: '+91 1234567890',
    address: 'Kattur Village, Tamil Nadu',
    socialMedia: {
      facebook: 'https://facebook.com/katturcricket',
      instagram: 'https://instagram.com/katturcricket',
      twitter: 'https://twitter.com/katturcricket',
      youtube: 'https://youtube.com/katturcricket'
    },
    upiName: '',
    upiId: '',
    upiScannerImage: ''
  });

  // UI State
  selectedCarouselImage = signal<CarouselImage | null>(null);
  selectedGalleryImages = signal<string[]>([]);
  carouselPreviewMode = signal<boolean>(false);
  currentCarouselIndex = signal<number>(0);
  galleryCategories = signal<string[]>(['Matches', 'Team Photos', 'Players', 'Trophy Ceremony', 'Celebrations', 'Events']);
  newCategoryName = signal<string>('');
  selectedGalleryCategory = signal<string>('Matches');

  // Poll Options State
  pollOptions = signal<string[]>(['', '']);

  // Voter State (for simulation in settings)
  players: WritableSignal<any[]> = signal([]);
  selectedVoterId = signal<number | null>(null);

  // Location Master State
  locations: WritableSignal<any[]> = signal([]);
  editingLocation: any = null;
  locationForm: any = { Name: '', District: '', State: 'Tamil Nadu', SortOrder: 0, IsActive: true };

  // Sponsor Upload State
  newSponsorFile = signal<File | null>(null);
  newSponsorLogoPreview = signal<string>('https://via.placeholder.com/150');

  // File Upload State
  isDragging = signal<boolean>(false);
  uploadProgress = signal<number>(0);
  isUploading = signal<boolean>(false);
  
  appLogoFile = signal<File | null>(null);
  upiScannerFile = signal<File | null>(null);

  // Carousel Auto-play
  private carouselInterval: any;

  constructor(
    private fb: FormBuilder,
    private settingsService: SettingsService
  ) {
    this.initializeForms();
  }

  ngOnInit(): void {
    this.loadSettings();
    this.startCarouselPreview();
  }

  loadSettings(): void {
    this.settingsService.getAppSettings().subscribe({
      next: (res) => {
        if (res.data.settings) {
          const s = res.data.settings;
          this.appSettings.set({
            appName: s.AppName,
            appLogo: s.AppLogoURL ? `${environment.apiUrl}${s.AppLogoURL}` : 'assets/logo.jpeg',
            appDescription: s.AppDescription,
            primaryColor: s.PrimaryColor,
            secondaryColor: s.SecondaryColor,
            contactEmail: s.ContactEmail,
            contactPhone: s.ContactPhone,
            address: s.Address,
            socialMedia: {
              facebook: s.FacebookURL,
              instagram: s.InstagramURL,
              twitter: s.TwitterURL,
              youtube: s.YoutubeURL
            },
            upiName: s.UPIName || '',
            upiId: s.UPIId || '',
            upiScannerImage: s.UPIScannerImageURL ? `${environment.apiUrl}${s.UPIScannerImageURL}` : ''
          });
          this.appSettingsForm.patchValue({
            appName: s.AppName,
            appDescription: s.AppDescription,
            primaryColor: s.PrimaryColor,
            secondaryColor: s.SecondaryColor,
            contactEmail: s.ContactEmail,
            contactPhone: s.ContactPhone,
            address: s.Address,
            facebook: s.FacebookURL,
            instagram: s.InstagramURL,
            twitter: s.TwitterURL,
            youtube: s.YoutubeURL,
            upiName: s.UPIName,
            upiId: s.UPIId
          });
        }
      }
    });

    // Load Carousel
    this.settingsService.getCarousel().subscribe({
      next: (res) => {
        const images = res.data.carousel.map((item: any) => ({
          id: item.id,
          src: `${environment.apiUrl}${item.ImageURL}`,
          alt: item.AltText,
          title: item.Title,
          description: item.Description,
          order: item.Order,
          isActive: item.IsActive
        }));
        this.carouselImages.set(images);
      }
    });

    // Load Gallery
    this.settingsService.getGallery().subscribe({
      next: (res) => {
        const images = res.data.gallery.map((item: any) => ({
          id: item.id,
          src: `${environment.apiUrl}${item.ImageURL}`,
          thumbnail: item.ThumbnailURL ? `${environment.apiUrl}${item.ThumbnailURL}` : `${environment.apiUrl.replace('/api', '')}${item.ImageURL}`,
          caption: item.Description || item.Title || '',
          category: item.Category,
          uploadDate: new Date(item.createdAt),
          likes: 0
        }));
        this.galleryImages.set(images);
      }
    });

    // Load Sponsors
    this.settingsService.getSponsors().subscribe({
      next: (res) => {
        const sponsors = res.data.sponsors.map((item: any) => ({
          id: item.id,
          name: item.Name,
          logo: `${environment.apiUrl}${item.LogoURL}`,
          description: item.Description,
          website: item.WebsiteURL,
          order: item.Order,
          isActive: item.IsActive
        }));
        this.sponsors.set(sponsors);
      }
    });

    // Load Polls
    this.settingsService.getPolls().subscribe({
      next: (res) => {
        this.polls.set(res.data.polls);
      }
    });

    // Load Players
    this.settingsService.getPlayers().subscribe({
      next: (res) => {
        this.players.set(res.data.players || []);
      }
    });
    // Load Locations
    this.loadLocations();
  }

  loadLocations(): void {
    this.settingsService.getLocations().subscribe({
      next: (res) => {
        this.locations.set(res.data?.locations || []);
      }
    });
  }

  ngOnDestroy(): void {
    if (this.carouselInterval) {
      clearInterval(this.carouselInterval);
    }
  }

  // ==================== INITIALIZATION ====================

  initializeForms(): void {
    this.appSettingsForm = this.fb.group({
      appName: ['Kattur Cricket Club', Validators.required],
      appDescription: ['Village Cricket League Management System'],
      primaryColor: ['#1a73e8'],
      secondaryColor: ['#34a853'],
      contactEmail: ['info@katturcricket.com', [Validators.required, Validators.email]],
      contactPhone: ['+91 1234567890'],
      address: ['Kattur Village, Tamil Nadu'],
      facebook: ['https://facebook.com/katturcricket'],
      instagram: ['https://instagram.com/katturcricket'],
      twitter: ['https://twitter.com/katturcricket'],
      youtube: ['https://youtube.com/katturcricket'],
      upiName: [''],
      upiId: ['']
    });

    this.carouselForm = this.fb.group({
      title: ['', Validators.required],
      description: [''],
      alt: ['', Validators.required]
    });

    this.sponsorForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      website: ['', Validators.pattern('https?://.+')]
    });

    this.pollForm = this.fb.group({
      question: ['', Validators.required],
      description: [''],
      endDate: ['']
    });
  }



  // ==================== TAB MANAGEMENT ====================

  switchTab(tab: string): void {
    this.activeTab.set(tab);
    if (tab !== 'carousel') {
      this.stopCarouselPreview();
    }
    if (tab === 'locations') {
      this.loadLocations();
    }
  }

  // ==================== GALLERY CATEGORIES ====================

  addGalleryCategory(): void {
    const name = this.newCategoryName().trim();
    if (name && !this.galleryCategories().includes(name)) {
      this.settingsService.addGalleryCategory(name).subscribe(() => {
        this.galleryCategories.update(cats => [...cats, name]);
        this.newCategoryName.set('');
        this.selectedGalleryCategory.set(name);
      });
    }
  }

  // ==================== POLL MANAGEMENT ====================

  addPollOption(): void {
    this.pollOptions.update(opts => [...opts, '']);
  }

  removePollOption(index: number): void {
    if (this.pollOptions().length > 2) {
      this.pollOptions.update(opts => opts.filter((_, i) => i !== index));
    }
  }

  updatePollOption(index: number, value: string): void {
    this.pollOptions.update(opts => {
      const newOpts = [...opts];
      newOpts[index] = value;
      return newOpts;
    });
  }

  createPoll(): void {
    if (this.pollForm.invalid) return;

    const options = this.pollOptions().filter(opt => opt.trim() !== '');
    if (options.length < 2) {
      alert('Please provide at least 2 options');
      return;
    }

    const payload = {
      Question: this.pollForm.value.question,
      Description: this.pollForm.value.description,
      EndDate: this.pollForm.value.endDate,
      options: options
    };

    this.settingsService.createPoll(payload).subscribe({
      next: (res) => {
        this.polls.update(current => [res.data.poll, ...current]);
        this.pollForm.reset();
        this.pollOptions.set(['', '']);
        alert('Poll created successfully!');
      }
    });
  }

  togglePollStatus(poll: Poll): void {
    this.settingsService.togglePollStatus(poll.id).subscribe({
      next: (res) => {
        this.polls.update(current =>
          current.map(p => p.id === poll.id ? res.data.poll : p)
        );
      }
    });
  }

  deletePoll(id: number): void {
    if (confirm('Are you sure you want to delete this poll?')) {
      this.settingsService.deletePoll(id).subscribe(() => {
        this.polls.update(current => current.filter(p => p.id !== id));
      });
    }
  }

  votePoll(pollId: number, optionId: number): void {
    const playerId = this.selectedVoterId();
    if (!playerId) {
      alert('Please select a player to vote as (Simulation Mode)');
      return;
    }

    this.settingsService.votePoll(pollId, optionId, playerId).subscribe({
      next: (res) => {
        this.polls.update(current =>
          current.map(p => p.id === pollId ? res.data.poll : p)
        );
        alert('Vote recorded successfully!');
      },
      error: (err) => {
        alert(err.error?.message || 'Error recording vote');
      }
    });
  }

  // ==================== CAROUSEL MANAGEMENT ====================

  onCarouselFileSelect(event: any): void {
    const files = event.target.files;
    if (files && files.length > 0) {
      this.handleCarouselFiles(files);
    }
  }

  onCarouselDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(false);

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleCarouselFiles(files);
    }
  }

  handleCarouselFiles(files: FileList): void {
    Array.from(files).forEach((file, index) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e: any) => {
          const newImage: CarouselImage = {
            id: Date.now().toString() + index,
            src: e.target.result,
            alt: file.name,
            title: '',
            description: '',
            order: this.carouselImages().length + 1,
            isActive: true,
            file: file
          };
          this.carouselImages.update(images => [...images, newImage]);
        };
        reader.readAsDataURL(file);
      }
    });
  }

  editCarouselImage(image: CarouselImage): void {
    this.selectedCarouselImage.set(image);
    this.carouselForm.patchValue({
      title: image.title,
      description: image.description,
      alt: image.alt
    });
  }

  updateCarouselImage(): void {
    const selected = this.selectedCarouselImage();
    if (!selected) return;

    const formValue = this.carouselForm.value;
    this.carouselImages.update(images =>
      images.map(img =>
        img.id === selected.id
          ? { ...img, title: formValue.title, description: formValue.description, alt: formValue.alt }
          : img
      )
    );

    this.selectedCarouselImage.set(null);
    this.carouselForm.reset();
  }

  deleteCarouselImage(id: string): void {
    if (confirm('Are you sure you want to delete this carousel image?')) {
      const numId = parseInt(id);
      if (!isNaN(numId)) {
        this.settingsService.deleteCarouselImage(numId).subscribe(() => {
          this.carouselImages.update(images => images.filter(img => img.id !== id));
        });
      } else {
        // Handle unsaved temporary image
        this.carouselImages.update(images => images.filter(img => img.id !== id));
      }
    }
  }

  toggleCarouselImageStatus(id: string): void {
    this.carouselImages.update(images =>
      images.map(img =>
        img.id === id ? { ...img, isActive: !img.isActive } : img
      )
    );
  }

  moveCarouselImage(id: string, direction: 'up' | 'down'): void {
    const images = [...this.carouselImages()];
    const index = images.findIndex(img => img.id === id);

    if (direction === 'up' && index > 0) {
      [images[index], images[index - 1]] = [images[index - 1], images[index]];
    } else if (direction === 'down' && index < images.length - 1) {
      [images[index], images[index + 1]] = [images[index + 1], images[index]];
    }

    // Update order
    images.forEach((img, idx) => img.order = idx + 1);
    this.carouselImages.set(images);
  }

  // Carousel Preview
  toggleCarouselPreview(): void {
    this.carouselPreviewMode.update(mode => !mode);
    if (this.carouselPreviewMode()) {
      this.startCarouselPreview();
    } else {
      this.stopCarouselPreview();
    }
  }

  startCarouselPreview(): void {
    this.currentCarouselIndex.set(0);
    this.carouselInterval = setInterval(() => {
      this.nextCarouselSlide();
    }, 3000);
  }

  stopCarouselPreview(): void {
    if (this.carouselInterval) {
      clearInterval(this.carouselInterval);
    }
  }

  nextCarouselSlide(): void {
    const activeImages = this.carouselImages().filter(img => img.isActive);
    if (activeImages.length === 0) return;

    this.currentCarouselIndex.update(index =>
      (index + 1) % activeImages.length
    );
  }

  prevCarouselSlide(): void {
    const activeImages = this.carouselImages().filter(img => img.isActive);
    if (activeImages.length === 0) return;

    this.currentCarouselIndex.update(index =>
      index === 0 ? activeImages.length - 1 : index - 1
    );
  }

  goToCarouselSlide(index: number): void {
    this.currentCarouselIndex.set(index);
  }

  // ==================== GALLERY MANAGEMENT ====================

  onGalleryFileSelect(event: any): void {
    const files = event.target.files;
    if (files && files.length > 0) {
      this.handleGalleryFiles(files);
    }
  }

  onGalleryDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(false);

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleGalleryFiles(files);
    }
  }

  handleGalleryFiles(files: FileList): void {
    Array.from(files).forEach((file, index) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e: any) => {
          const newImage: GalleryImage = {
            id: Date.now().toString() + index,
            src: e.target.result,
            caption: file.name,
            category: this.selectedGalleryCategory(),
            uploadDate: new Date(),
            file: file
          };
          this.galleryImages.update(images => [...images, newImage]);
        };
        reader.readAsDataURL(file);
      }
    });
  }

  toggleGalleryImageSelection(id: string): void {
    this.selectedGalleryImages.update(selected => {
      if (selected.includes(id)) {
        return selected.filter(imgId => imgId !== id);
      } else {
        return [...selected, id];
      }
    });
  }

  deleteSelectedGalleryImages(): void {
    const selected = this.selectedGalleryImages();
    if (selected.length === 0) return;

    if (confirm(`Are you sure you want to delete ${selected.length} image(s)?`)) {
      this.galleryImages.update(images =>
        images.filter(img => !selected.includes(img?.id))
      );
      this.selectedGalleryImages.set([]);
    }
  }

  deleteGalleryImage(id: string): void {
    if (confirm('Are you sure you want to delete this image?')) {
      this.galleryImages.update(images => images.filter(img => img.id !== id));
    }
  }

  updateGalleryImageCaption(id: string, caption: string): void {
    this.galleryImages.update(images =>
      images.map(img => img.id === id ? { ...img, caption } : img)
    );
  }

  getFilteredGalleryImages(): GalleryImage[] {
    return this.galleryImages().filter(
      img => img.category === this.selectedGalleryCategory()
    );
  }

  // ==================== SPONSOR MANAGEMENT ====================

  onSponsorFileSelect(event: any, sponsorId?: string): void {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        if (sponsorId) {
          // Update existing sponsor logo
          this.sponsors.update(sponsors =>
            sponsors.map(s =>
              s.id === sponsorId ? { ...s, logo: e.target.result, file } : s
            )
          );
        } else {
          // New sponsor logo
          this.newSponsorFile.set(file);
          this.newSponsorLogoPreview.set(e.target.result);
        }
      };
      reader.readAsDataURL(file);
    }
  }

  addSponsor(): void {
    if (this.sponsorForm.invalid) return;

    const formValue = this.sponsorForm.value;
    const newSponsor: Sponsor = {
      id: 'temp-' + Date.now().toString(),
      name: formValue.name,
      logo: this.newSponsorLogoPreview(),
      description: formValue.description,
      website: formValue.website,
      order: this.sponsors().length + 1,
      isActive: true,
      file: this.newSponsorFile() || undefined
    };

    this.sponsors.update(sponsors => [...sponsors, newSponsor]);
    this.sponsorForm.reset();
    this.newSponsorFile.set(null);
    this.newSponsorLogoPreview.set('https://via.placeholder.com/150');
  }

  deleteSponsor(id: string): void {
    if (confirm('Are you sure you want to delete this sponsor?')) {
      const numId = parseInt(id);
      if (!isNaN(numId)) {
        this.settingsService.deleteSponsor(numId).subscribe(() => {
          this.sponsors.update(sponsors => sponsors.filter(s => s.id !== id));
        });
      } else {
        this.sponsors.update(sponsors => sponsors.filter(s => s.id !== id));
      }
    }
  }

  toggleSponsorStatus(id: string): void {
    this.sponsors.update(sponsors =>
      sponsors.map(s =>
        s.id === id ? { ...s, isActive: !s.isActive } : s
      )
    );
  }

  moveSponsor(id: string, direction: 'up' | 'down'): void {
    const sponsors = [...this.sponsors()];
    const index = sponsors.findIndex(s => s.id === id);

    if (direction === 'up' && index > 0) {
      [sponsors[index], sponsors[index - 1]] = [sponsors[index - 1], sponsors[index]];
    } else if (direction === 'down' && index < sponsors.length - 1) {
      [sponsors[index], sponsors[index + 1]] = [sponsors[index + 1], sponsors[index]];
    }

    sponsors.forEach((s, idx) => s.order = idx + 1);
    this.sponsors.set(sponsors);
  }

  // ==================== APP SETTINGS ====================

  saveAppSettings(): void {
    if (this.appSettingsForm.invalid) return;

    const formValue = this.appSettingsForm.value;
    const settings: AppSettings = {
      appName: formValue.appName,
      appLogo: this.appSettings().appLogo,
      appDescription: formValue.appDescription,
      primaryColor: formValue.primaryColor,
      secondaryColor: formValue.secondaryColor,
      contactEmail: formValue.contactEmail,
      contactPhone: formValue.contactPhone,
      address: formValue.address,
      socialMedia: {
        facebook: formValue.facebook,
        instagram: formValue.instagram,
        twitter: formValue.twitter,
        youtube: formValue.youtube
      },
      upiName: formValue.upiName,
      upiId: formValue.upiId,
      upiScannerImage: this.appSettings().upiScannerImage
    };

    this.appSettings.set(settings);
    localStorage.setItem('appSettings', JSON.stringify(settings));
    alert('Settings saved successfully!');
  }

  onLogoFileSelect(event: any): void {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      this.appLogoFile.set(file);
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.appSettings.update(settings => ({
          ...settings,
          appLogo: e.target.result
        }));
      };
      reader.readAsDataURL(file);
    }
  }

  onUpiScannerFileSelect(event: any): void {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      this.upiScannerFile.set(file);
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.appSettings.update(settings => ({
          ...settings,
          upiScannerImage: e.target.result
        }));
      };
      reader.readAsDataURL(file);
    }
  }

  // ==================== DRAG & DROP ====================

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(false);
  }

  // ==================== SAVE ALL ====================

  // ==================== SAVE ALL ====================

  saveAllSettings(): void {
    this.isUploading.set(true);
    this.uploadProgress.set(0);

    // 1. Save App Settings
    const appSettingsData = {
      AppName: this.appSettingsForm.value.appName,
      AppDescription: this.appSettingsForm.value.appDescription,
      PrimaryColor: this.appSettingsForm.value.primaryColor,
      SecondaryColor: this.appSettingsForm.value.secondaryColor,
      ContactEmail: this.appSettingsForm.value.contactEmail,
      ContactPhone: this.appSettingsForm.value.contactPhone,
      Address: this.appSettingsForm.value.address,
      FacebookURL: this.appSettingsForm.value.facebook,
      InstagramURL: this.appSettingsForm.value.instagram,
      TwitterURL: this.appSettingsForm.value.twitter,
      YoutubeURL: this.appSettingsForm.value.youtube,
      UPIName: this.appSettingsForm.value.upiName,
      UPIId: this.appSettingsForm.value.upiId
    };

    this.settingsService.updateAppSettings(
      appSettingsData, 
      this.appLogoFile() || undefined,
      this.upiScannerFile() || undefined
    ).subscribe();
    this.uploadProgress.set(25);

    // 2. Save Carousel (Only new ones with files)
    const newCarouselItems = this.carouselImages().filter(img => img.file);
    let carouselCount = 0;
    if (newCarouselItems.length > 0) {
      newCarouselItems.forEach(item => {
        const data = {
          Title: item.title,
          Description: item.description,
          AltText: item.alt,
          Order: item.order,
          IsActive: item.isActive
        };
        this.settingsService.addCarouselImage(data, item.file!).subscribe(() => {
          carouselCount++;
          if (carouselCount === newCarouselItems.length) {
            this.uploadProgress.set(50);
            this.checkAllSaved(75); // Gallery next
          }
        });
      });
    } else {
      this.uploadProgress.set(50);
    }

    // 3. Save Gallery (Only new ones with files)
    const newGalleryItems = this.galleryImages().filter(img => (img as any).file);
    let galleryCount = 0;
    if (newGalleryItems.length > 0) {
      newGalleryItems.forEach(item => {
        const data = {
          Title: item.caption,
          Description: item.caption,
          Category: item.category,
          Order: 0
        };
        this.settingsService.addGalleryImage(data, (item as any).file!).subscribe(() => {
          galleryCount++;
          if (galleryCount === newGalleryItems.length) {
            this.uploadProgress.set(75);
            this.checkAllSaved(100); // Sponsors next
          }
        });
      });
    } else {
      this.uploadProgress.set(75);
    }

    // 4. Save Sponsors (Only new ones with files)
    const newSponsors = this.sponsors().filter(s => (s as any).file);
    let sponsorCount = 0;
    if (newSponsors.length > 0) {
      newSponsors.forEach(s => {
        const data = {
          Name: s.name,
          Description: s.description,
          WebsiteURL: s.website,
          Order: s.order,
          IsActive: s.isActive
        };
        this.settingsService.addSponsor(data, (s as any).file!).subscribe(() => {
          sponsorCount++;
          if (sponsorCount === newSponsors.length) {
            this.onSaveComplete();
          }
        });
      });
    } else {
      this.onSaveComplete();
    }
  }

  private checkAllSaved(nextProgress: number): void {
    // Helper to sync progress
  }

  private onSaveComplete(): void {
    this.uploadProgress.set(100);
    setTimeout(() => {
      this.isUploading.set(false);
      alert('All settings saved successfully to database!');
      this.loadSettings(); // Reload to get fresh IDs from DB
    }, 500);
  }

  // ==================== LOCATION MASTER ====================

  saveLocation(): void {
    if (!this.locationForm.Name.trim()) return;
    if (this.editingLocation) {
      this.settingsService.updateLocation(this.editingLocation.LocationID, this.locationForm).subscribe({
        next: () => {
          this.cancelEditLocation();
          this.loadLocations();
        }
      });
    } else {
      this.settingsService.createLocation(this.locationForm).subscribe({
        next: () => {
          this.locationForm = { Name: '', District: '', State: 'Tamil Nadu', SortOrder: 0, IsActive: true };
          this.loadLocations();
        }
      });
    }
  }

  editLocation(loc: any): void {
    this.editingLocation = loc;
    this.locationForm = { Name: loc.Name, District: loc.District || '', State: loc.State || 'Tamil Nadu', SortOrder: loc.SortOrder || 0, IsActive: loc.IsActive };
  }

  cancelEditLocation(): void {
    this.editingLocation = null;
    this.locationForm = { Name: '', District: '', State: 'Tamil Nadu', SortOrder: 0, IsActive: true };
  }

  deleteLocation(id: number): void {
    if (!confirm('Are you sure you want to delete this location?')) return;
    this.settingsService.deleteLocation(id).subscribe({
      next: () => this.loadLocations()
    });
  }
}

