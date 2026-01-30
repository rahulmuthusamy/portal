import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, HostListener, OnInit, Inject, PLATFORM_ID, signal, WritableSignal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { environment } from '@environments/environment';
import { AuctionSessionService } from '@features/auction/services/auction-session.service';
import { PlayerService } from '@features/players/services/players.service';
import { TeamsService } from '@features/teams/services/teams.service';
import { SettingsService } from '@core/services/settings.service';

interface Team {
  Name: string;
  LogoURL: string;
  Captain?: string;
  OwnerName?: string;
  Founded?: string;
  Location?: string;
  Coach?: string;
  Bio?: string;
  Slogan?: string;
}

interface Album {
  id: string;
  title: string;
  coverImage: string;
  category: string;
  images: { src: string; caption: string }[];
}


@Component({
  selector: 'app-kkk-website',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule
  ],
  templateUrl: './kkk-website.component.html',
  styleUrl: './kkk-website.component.scss'
})
export class KkkWebsiteComponent implements OnInit {

  // Signals for reactivity
  activeSection = signal('home');
  showBackToTop = signal(false);

  // Data
  teams: WritableSignal<Team[]> = signal([]);
  players: any = [];
  filteredPlayers: any[] = [];

  // UI State
  selectedCategory: string = 'all';
  showLoadMore: boolean = true;
  imagesToShow: number = 8;
  newsletterEmail: string = '';
  searchQuery: string = '';
  activeFilter: string = 'all';
  currentPage: number = 1;
  playersPerPage: number = 8;

  // Dynamic Settings Data
  appSettings = signal<any>({});
  carouselItems = signal<any[]>([]);
  dynamicSponsors = signal<any[]>([]);
  dynamicGallery = signal<any[]>([]);

  gridImages = [
    'assets/GJ2026_3.jpeg',
    'assets/MV_1.jpeg',
    'assets/MWPI3556.JPG',
    'assets/NMUM0899.JPG',
    'assets/MV_5.jpeg',
    'assets/IUEF1539.JPG'
  ];


  get galleryImages() {
    return this.dynamicGallery().map(img => ({
      src: img.url,
      caption: img.Title || img.title
    }));
  }

  get availableCategories() {
    const images = this.dynamicGallery();
    const categories = new Set(images.map(img => img.Category).filter(c => !!c));
    return Array.from(categories);
  }

  setCategory(category: string) {
    this.selectedCategory = category;
  }

  contactInfo = {
    facebook: 'https://facebook.com/katturcricket',
    instagram: 'https://instagram.com/katturcricket',
    youtube: 'https://youtube.com/katturcricket',
    twitter: 'https://twitter.com/katturcricket'
  };

  auctionList: any = [];
  isBrowser: boolean;

  constructor(
    private teamService: TeamsService,
    private playerService: PlayerService,
    private auctionSessionService: AuctionSessionService,
    private settingsService: SettingsService,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit() {
    console.log('KkkWebsiteComponent: Initializing...');
    try {
      this.loadAppSettings();
      this.loadCarousel();
      this.loadSponsors();
      this.loadGallery();
      this.getAuctionList();
      this.getTeamList();
      this.getPlayerList();
      if (this.isBrowser) {
        this.startCountdown();
        this.updateActiveSection();
      }
    } catch (e) {
      console.error('KkkWebsiteComponent: Error in ngOnInit', e);
    }
    console.log('KkkWebsiteComponent: Initialization complete.');
  }

  loadAppSettings() {
    this.settingsService.getAppSettings().subscribe({
      next: (res: any) => {
        if (!res) return;
        const settings = res.data?.settings || res.data || res;

        // Map logo URL
        if (settings.logo && !settings.logo.startsWith('http') && !settings.logo.startsWith('assets')) {
          settings.logoUrl = environment.apiUrl + settings.logo;
        } else if (settings.logo) {
          settings.logoUrl = settings.logo;
        }

        this.appSettings.set(settings || {});

        if (settings) {
          if (settings.facebook) this.contactInfo.facebook = settings.facebook;
          if (settings.instagram) this.contactInfo.instagram = settings.instagram;
          if (settings.twitter) this.contactInfo.twitter = settings.twitter;
          if (settings.youtube) this.contactInfo.youtube = settings.youtube;
        }
      },
      error: (err) => console.error('Error loading App Settings:', err)
    });
  }

  loadCarousel() {
    this.settingsService.getCarousel().subscribe({
      next: (res: any) => {
        const items = res?.data?.carousel || res || [];
        this.carouselItems.set(Array.isArray(items) ? items.map((item: any) => ({
          ...item,
          title: item.Title || item.title || 'Kattur Premier League',
          description: item.Description || item.description || 'The Battle of Champions',
          imageUrl: (item.ImageURL || item.imageUrl) ?
            ((item.ImageURL || item.imageUrl).startsWith('http') ? (item.ImageURL || item.imageUrl) : environment.apiUrl + (item.ImageURL || item.imageUrl)) :
            'assets/MV_4.jpeg'
        })) : []);
      },
      error: (err) => console.error('Error loading Carousel:', err)
    });
  }

  loadSponsors() {
    this.settingsService.getSponsors().subscribe({
      next: (res: any) => {
        const sponsors = res?.data?.sponsors || res?.data?.sponsorships || [];
        this.dynamicSponsors.set(Array.isArray(sponsors) ? sponsors.map((s: any) => ({
          ...s,
          Name: s.Name || s.name || '',
          Description: s.Description || s.description || '',
          WebsiteURL: s.WebsiteURL || s.website || '#',
          LogoURL: s.LogoURL ? environment.apiUrl + s.LogoURL : ''
        })) : []);
      },
      error: (err) => console.error('Error loading Sponsors:', err)
    });
  }

  loadGallery() {
    this.settingsService.getGallery().subscribe({
      next: (res: any) => {
        const images = res?.data?.gallery || [];
        this.dynamicGallery.set(Array.isArray(images) ? images.map((img: any) => ({
          ...img,
          Title: img.Title || '',
          Category: img.Category || 'Other',
          url: img.ImageURL ? img.ImageURL.startsWith('http') ? img.ImageURL : environment.apiUrl + img.ImageURL : ''
        })) : []);
      },
      error: (err) => console.error('Error loading Gallery:', err)
    });
  }

  @HostListener('window:scroll', [])
  onScroll() {
    if (this.isBrowser) {
      this.updateActiveSection();
      this.showBackToTop.set(window.pageYOffset > 300);
    }
  }

  // --- Data Fetching ---

  getTeamList() {
    this.teamService.getAll().subscribe({
      next: (response: any) => {
        const teams = response?.data?.teams ?? [];
        this.teams.set(teams.map((team: any) => {
          let logo = team.LogoURL;
          if (logo && !logo.startsWith('http') && !logo.startsWith('assets')) {
            logo = environment.apiUrl + logo;
          } else if (!logo) {
            // Fallback for known team names if no logo exists in DB
            logo = team.Name === 'KKK Juniors' ? 'assets/teams/kkkjuniors.png'
              : team.Name === '7 Star' ? 'assets/teams/sevenstar.png'
                : team.Name === 'GJ Warriors' ? 'assets/teams/gjwarriors.png'
                  : team.Name.includes("XI Maverick Stricker's") ? 'assets/teams/maverickstrikers.png'
                    : team.Name === 'Power Hitters' ? 'assets/teams/powerhitter.png' : 'assets/logo.jpeg';
          }
          return {
            ...team,
            LogoURL: logo,
            Captain: team.Captain,
            OwnerName: team.OwnerName,
            Founded: team.Founded,
            Location: team.Location,
            Slogan: team.Slogan
          };
        }));
      },
      error: (error: any) => console.error('Error fetching Teams:', error)
    });
  }

  getPlayerList() {
    this.playerService.getAll().subscribe({
      next: (response: any) => {
        this.players = response?.data?.players ?? [];

        this.players = this.players.map((player: any) => ({
          ...player,
          PhotoURL: player.PhotoURL ?
            environment.apiUrl + player.PhotoURL : ''
        }));

        const startIndex = (this.currentPage - 1) * this.playersPerPage;
        const endIndex = startIndex + this.playersPerPage;
        this.filteredPlayers = this.players.slice(startIndex, endIndex);
      },
      error: (error: any) => console.error('Error fetching Players:', error)
    });
  }

  // --- Logic & Helpers ---

  getFilteredGallery() {
    const images = this.dynamicGallery();
    if (this.selectedCategory === 'all') {
      return images;
    }
    return images.filter(img => img.Category === this.selectedCategory);
  }

  loadMoreImages() {
    // handled by pagination or infinite scroll in future
  }

  // --- Lightbox Logic ---
  lightboxOpen = signal(false);
  currentLightboxIndex = signal(0);
  currentLightboxImages = signal<{ src: string; caption: string }[]>([]);

  get currentLightboxImage() {
    return this.currentLightboxImages()[this.currentLightboxIndex()];
  }

  // Open lightbox with dynamic image
  openLightbox(image: any) {
    const allImages = this.getFilteredGallery().map(img => ({
      src: img.url,
      caption: img.Title || img.title
    }));
    const index = allImages.findIndex(img => img.src === image.url);

    this.currentLightboxImages.set(allImages);
    this.currentLightboxIndex.set(index >= 0 ? index : 0);
    this.lightboxOpen.set(true);
    if (this.isBrowser) {
      document.body.style.overflow = 'hidden';
    }
  }

  closeLightbox() {
    this.lightboxOpen.set(false);
    if (this.isBrowser) {
      document.body.style.overflow = '';
    }
  }

  nextLightboxImage() {
    const images = this.currentLightboxImages();
    let nextIndex = this.currentLightboxIndex() + 1;
    if (nextIndex >= images.length) {
      nextIndex = 0;
    }
    this.currentLightboxIndex.set(nextIndex);
  }

  prevLightboxImage() {
    const images = this.currentLightboxImages();
    let prevIndex = this.currentLightboxIndex() - 1;
    if (prevIndex < 0) {
      prevIndex = images.length - 1;
    }
    this.currentLightboxIndex.set(prevIndex);
  }

  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (!this.lightboxOpen()) return;

    if (event.key === 'Escape') this.closeLightbox();
    if (event.key === 'ArrowRight') this.nextLightboxImage();
    if (event.key === 'ArrowLeft') this.prevLightboxImage();
  }

  scrollTo(sectionId: string) {
    this.activeSection.set(sectionId);
    if (this.isBrowser) {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }

  // --- Filtering ---

  filterPlayers(role?: string) {
    if (role) this.activeFilter = role;

    let filtered = this.players;

    if (this.activeFilter !== 'All') {
      filtered = filtered.filter((p: any) => p.Role === this.activeFilter);
    }

    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter((p: any) =>
        p.Name.toLowerCase().includes(query) ||
        p.Team.toLowerCase().includes(query)
      );
    }

    const startIndex = (this.currentPage - 1) * this.playersPerPage;
    const endIndex = startIndex + this.playersPerPage;
    this.filteredPlayers = filtered.slice(startIndex, endIndex);
  }

  getRoleBadgeClass(role: string) {
    const roles: { [key: string]: string } = {
      'batsman': 'bg-success',
      'bowler': 'bg-danger',
      'allrounder': 'bg-warning text-dark',
      'wicketkeeper': 'bg-info'
    };
    return roles[role] || 'bg-secondary';
  }

  viewPlayerProfile(player: any) {
    alert(`Player: ${player.name}\nTeam: ${player.team}`);
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.filterPlayers();
    }
  }

  nextPage() {
    if (this.currentPage * this.playersPerPage < this.players.length) {
      this.currentPage++;
      this.filterPlayers();
    }
  }

  // --- Carousel / Scroll Helpers ---

  scrollContainer(containerId: string, direction: 'left' | 'right') {
    if (!this.isBrowser) return;
    const container = document.getElementById(containerId);
    if (container) {
      const scrollAmount = 300;
      const currentScroll = container.scrollLeft;
      const newScroll = direction === 'left' ? currentScroll - scrollAmount : currentScroll + scrollAmount;

      container.scrollTo({
        left: newScroll,
        behavior: 'smooth'
      });
    }
  }

  redirectTo(url: string) {
    window.open(url, '_blank');
  }

  viewTeamDetails(team: Team) {
    const details = `
🏆 ${team.Name}
━━━━━━━━━━━━━━━━
Captained by: ${team.Captain || 'TBD'}
Coach: ${team.Coach || 'TBD'}
Owner: ${team.OwnerName || 'Club Managed'}
Founded: ${team.Founded || 'New Entry'}
Location: ${team.Location || 'Local'}

"${team.Slogan || 'Striving for Glory'}"

Bio: ${team.Bio || 'A proud member of the Kattur Premier League.'}
    `.trim();
    alert(details);
  }

  updateActiveSection() {
    if (!this.isBrowser) return;

    const sections = ['home', 'teams', 'sponsors', 'auction', 'fixtures', 'gallery', 'contact'];
    const scrollPosition = window.pageYOffset + 100;

    for (const section of sections) {
      const element = document.getElementById(section);
      if (element) {
        const top = element.offsetTop;
        const bottom = top + element.offsetHeight;
        if (scrollPosition >= top && scrollPosition < bottom) {
          this.activeSection.set(section);
          break;
        }
      }
    }
  }

  // Dynamic Auction Data
  currentAuction = signal<any>(null); // Kept for other references if needed
  auctionCountdowns: { [key: string]: any } = {}; // Map for multiple countdowns

  get currentAuctionData() {
    return this.currentAuction();
  }

  // ... (rest of the file until startCountdown)

  getAuctionList() {
    this.auctionSessionService.getAuctionList().subscribe({
      next: (response: any) => {
        this.auctionList = response?.data?.sessions ?? [];
        // Optional: Sort by date
        this.auctionList.sort((a: any, b: any) => new Date(a.StartDate).getTime() - new Date(b.StartDate).getTime());

        // Initialize countdowns immediately
        this.startCountdown();
      },
      error: (error: any) => console.error('Error fetching Auctions:', error)
    });
  }

  startCountdown() {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }

    // Update immediately and then every second
    this.updateCountdowns();
    this.countdownInterval = setInterval(() => {
      this.updateCountdowns();
    }, 1000);
  }

  updateCountdowns() {
    const now = new Date().getTime();

    this.auctionList.forEach((auction: any) => {
      if (!auction.StartDate) return;

      const auctionDate = new Date(auction.StartDate).getTime();
      const diff = auctionDate - now;

      // Create a unique key for the auction (fallback to index if no ID)
      const key = auction.id || auction._id || this.auctionList.indexOf(auction);

      if (diff <= 0) {
        this.auctionCountdowns[key] = { days: '00', hours: '00', minutes: '00' };
      } else {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

        this.auctionCountdowns[key] = {
          days: days.toString().padStart(2, '0'),
          hours: hours.toString().padStart(2, '0'),
          minutes: minutes.toString().padStart(2, '0')
        };
      }
    });

    // Trigger change detection manually if needed by re-assigning to trigger pure pipes, 
    // but object mutation works in default strategy mostly. 
    // For signals, we might want to wrap this, but simple object property update is fine for now.
    // To ensure template updates, we can spread:
    this.auctionCountdowns = { ...this.auctionCountdowns };
  }

  private countdownInterval: any;

  showAuctionDetails() {
    const auction = this.currentAuction();
    if (!auction) return;

    const auctionDetails = `
🎯 ${auction.Name} DETAILS:

📅 Date: ${new Date(auction.StartDate).toLocaleDateString()}
⏰ Time: ${new Date(auction.StartDate).toLocaleTimeString()}
📍 Venue: ${auction.location || 'To be announced'}
💰 Budget: ${auction.budget || '₹50,000'} per team
👥 Teams: ${this.teams().length} Teams

📝 Status: ${auction.Status}
    `.trim();

    alert(auctionDetails);
  }

  subscribeNewsletter() {
    if (this.newsletterEmail && this.newsletterEmail.includes('@')) {
      alert(`Thank you for subscribing!\nWe'll send updates to: ${this.newsletterEmail}`);
      this.newsletterEmail = '';
    } else {
      alert('Please enter a valid email address.');
    }
  }

  ngOnDestroy() {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
  }
}
