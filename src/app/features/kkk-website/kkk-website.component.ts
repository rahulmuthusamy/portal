import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, HostListener, OnInit, Inject, PLATFORM_ID, signal, WritableSignal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuctionSessionService } from '@features/auction/services/auction-session.service';
import { PlayerService } from '@features/players/services/players.service';
import { TeamsService } from '@features/teams/services/teams.service';

interface Team {
  Name: string;
  LogoURL: string;
  captain?: string;
  owner?: string;
  trophies?: string;
  matches?: number;
  wins?: number;
  founded?: string;
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
  imports: [CommonModule, FormsModule],
  templateUrl: './kkk-website.component.html',
  styleUrl: './kkk-website.component.scss'
})
export class KkkWebsiteComponent implements OnInit {

  // Signals for reactivity
  activeSection = signal('home');
  showBackToTop = signal(false);

  // Data
  teams: WritableSignal<Team[]> = signal([]);
  players: any[] = [];
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

  // KPL Winners
  kplWinners = [
    { season: 'KPL 2023', winner: 'Seven Stars', runnerUp: 'KKK Juniors' },
    { season: 'KPL 2024', winner: 'Maverick Strikers', runnerUp: 'Power Hitters' },
    { season: 'KPL 2025', winner: 'GJ Warriors', runnerUp: 'Seven Stars' },
    { season: 'KPL 2026', winner: 'Maverick Strikers', runnerUp: 'GJ Warriors' }
  ];

  sponsorsList: any[] = [
    { logo: 'https://cdn-icons-png.flaticon.com/512/732/732217.png', name: 'Tech Corp', desc: 'Title Sponsor' },
    { logo: 'https://cdn-icons-png.flaticon.com/512/869/869869.png', name: 'Sports Gear', desc: 'Kit Partner' },
    { logo: 'https://cdn-icons-png.flaticon.com/512/3448/3448609.png', name: 'Refresh Co', desc: 'Hydration Partner' },
    { logo: 'https://cdn-icons-png.flaticon.com/512/2830/2830283.png', name: 'Local Media', desc: 'Media Partner' },
    { logo: 'https://cdn-icons-png.flaticon.com/512/732/732217.png', name: 'Community Bank', desc: 'Event Partner' },
  ];

  // Grid Images for KPL 2025
  gridImages = [
    'assets/hero-image.jpeg',
    'assets/default-player.jpeg',
    'assets/MWPI3556.JPG',
    'assets/NMUM0899.JPG',
    'assets/DXBQ2771.JPG',
    'assets/IUEF1539.JPG'
  ];

  // Upcoming Fixtures
  upcomingFixtures = [
    {
      date: 'Jan 20, 2025',
      time: '4:00 PM',
      team1: 'Super Kings',
      team2: 'Maverick Strikers',
      venue: 'Main Ground'
    },
    {
      date: 'Jan 21, 2025',
      time: '9:00 AM',
      team1: 'KKK Juniors',
      team2: 'Thunder Bolts',
      venue: 'Kattur Ground'
    }
  ];

  // Gallery Categories
  galleryCategories = [
    { id: 'all', name: 'All Photos' },
    { id: 'kpl', name: 'KPL Matches' },
    { id: 'teams', name: 'Team Photos' },
    { id: 'players', name: 'Players' },
    { id: 'trophy', name: 'Trophy Ceremony' },
    { id: 'celebration', name: 'Celebrations' }
  ];

  // Gallery Albums
  galleryAlbums: Album[] = [
    {
      id: 'winning-moment',
      title: 'Winning Moments',
      coverImage: 'assets/IMG_3562.JPG',
      category: 'trophy',
      images: [
        { src: 'assets/IMG_3562.JPG', caption: 'Lifting the Trophy' },
        { src: 'assets/MWPI3556.JPG', caption: 'Team Celebration' },
        { src: 'assets/hero-image.jpeg', caption: 'Victory Lap' },
        { src: 'assets/IMG_3562.JPG', caption: 'Captain with Cup' },
        { src: 'assets/MWPI3556.JPG', caption: 'Medal Ceremony' },
        { src: 'assets/hero-image.jpeg', caption: 'Team Group Photo' },
        { src: 'assets/IMG_3562.JPG', caption: 'Champagne Shower' },
        { src: 'assets/MWPI3556.JPG', caption: 'Coach with Trophy' },
        { src: 'assets/hero-image.jpeg', caption: 'Final Wicket Celebration' },
        { src: 'assets/IMG_3562.JPG', caption: 'Winning Run' }
      ]
    },
    {
      id: 'kpl-2024',
      title: 'KPL 2024 Highlights',
      coverImage: 'assets/DXBQ2771.JPG',
      category: 'kpl',
      images: [
        { src: 'assets/DXBQ2771.JPG', caption: 'Opening Ceremony' },
        { src: 'assets/NMUM0899.JPG', caption: 'Best Catch' },
        { src: 'assets/default-player.jpeg', caption: 'Man of the Match' }
      ]
    },
    {
      id: 'team-photos',
      title: 'Team Photos',
      coverImage: 'assets/IUEF1539.JPG',
      category: 'teams',
      images: [
        { src: 'assets/IUEF1539.JPG', caption: 'Full Squad' },
        { src: 'assets/default-player.jpeg', caption: 'Batting lineup' }
      ]
    }
  ];

  // Flattened images for legacy support if needed, or helper
  get galleryImages() {
    return this.galleryAlbums.flatMap(album => album.images);
  }

  contactInfo = {
    facebook: 'https://facebook.com/katturcricket',
    instagram: 'https://instagram.com/katturcricket',
    youtube: 'https://youtube.com/katturcricket',
    twitter: 'https://twitter.com/katturcricket'
  };

  auctionList: any = [];
  isBrowser: boolean;

  upcomingTournaments = [
    {
      tournament_name: 'Kattur Premier League 2025',
      location: 'Kattur Ground',
      start_datetime: new Date('2025-07-10T09:00:00'),
    },
    {
      tournament_name: 'Corporate Cup 2025',
      location: 'Trichy Sports Complex',
      start_datetime: new Date('2025-08-05T10:00:00'),
    }
  ];

  constructor(
    private teamService: TeamsService,
    private playerService: PlayerService,
    private auctionSessionService: AuctionSessionService,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit() {
    this.getAuctionList();
    this.getTeamList();
    this.getPlayerList();
    if (this.isBrowser) {
      this.startCountdown();
      this.updateActiveSection();
    }
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
        this.teams.set(response?.data?.teams?.map((team: any) => ({
          ...team,
          LogoURL: team.Name === 'KKK Juniors' ? 'assets/teams/kkkjuniors.png'
            : team.Name === '7 Star' ? 'assets/teams/sevenstar.png'
              : team.Name === 'GJ Warriors' ? 'assets/teams/gjwarriors.png'
                : team.Name.includes("XI Maverick Stricker's") ? 'assets/teams/maverickstrikers.png'
                  : team.Name === 'Power Hitters' ? 'assets/teams/powerhitter.png' : ''
        })) ?? []);
      },
      error: (error: any) => console.error('Error fetching Teams:', error)
    });
  }

  getPlayerList() {
    this.playerService.getAll().subscribe({
      next: (response: any) => {
        this.players = response?.data?.players ?? [];
        this.filteredPlayers = [...this.players];
      },
      error: (error: any) => console.error('Error fetching Players:', error)
    });
  }

  // --- Logic & Helpers ---

  getFilteredGallery() {
    if (this.selectedCategory === 'all') {
      return this.galleryAlbums;
    }
    return this.galleryAlbums.filter(album => album.category === this.selectedCategory);
  }

  loadMoreImages() {
    // simplified or removed for now as we show albums
  }

  // --- Lightbox Logic ---
  lightboxOpen = signal(false);
  currentLightboxIndex = signal(0);
  currentLightboxImages = signal<{ src: string; caption: string }[]>([]);

  get currentLightboxImage() {
    return this.currentLightboxImages()[this.currentLightboxIndex()];
  }

  // Open lightbox with a specific album
  openLightbox(album: Album) {
    this.currentLightboxImages.set(album.images);
    this.currentLightboxIndex.set(0); // Start from first image
    this.lightboxOpen.set(true);
    document.body.style.overflow = 'hidden';
  }

  closeLightbox() {
    this.lightboxOpen.set(false);
    document.body.style.overflow = '';
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

    if (this.activeFilter !== 'all') {
      filtered = filtered.filter(p => p.role === this.activeFilter);
    }

    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(query) ||
        p.team.toLowerCase().includes(query)
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
    alert(team.Name);
  }

  updateActiveSection() {
    if (!this.isBrowser) return;

    const sections = ['home', 'kpl', 'teams', 'live', 'gallery', 'contact'];
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
    this.auctionSessionService.getAll().subscribe({
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
