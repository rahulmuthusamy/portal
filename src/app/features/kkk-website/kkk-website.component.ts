import { CommonModule, isPlatformBrowser } from '@angular/common';
import {
  Component, HostListener, OnInit, OnDestroy, Inject, PLATFORM_ID,
  signal, WritableSignal, inject, DestroyRef
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { environment } from '@environments/environment';
import { AuctionSessionService } from '@features/auction/services/auction-session.service';
import { PlayerService } from '@features/players/services/players.service';
import { TeamsService } from '@features/teams/services/teams.service';
import { SettingsService } from '@core/services/settings.service';
import { OnboardingService } from '@core/services/onboarding.service';
import { MatchService } from '../matches/services/match.service';
import Swal from 'sweetalert2';

export interface Team {
  _id?: string;
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

export interface StandingRow {
  rank: number;
  team: Team;
  played: number;
  won: number;
  lost: number;
  tied: number;
  nrr: string;
  points: number;
}

export interface FixtureMatch {
  MatchID: string;
  MatchNumber?: number;
  Stage?: string;
  TeamA: Team;
  TeamB: Team;
  MatchDate: string;
  Venue?: string;
  Status: 'Scheduled' | 'Live' | 'Completed';
  TeamA_Runs?: number;
  TeamA_Wickets?: number;
  TeamA_Overs?: number;
  TeamB_Runs?: number;
  TeamB_Wickets?: number;
  TeamB_Overs?: number;
  ResultNote?: string;
}

export interface TopPerformer {
  player: any;
  value: number;
  label: string;
}

@Component({
  selector: 'app-kkk-website',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './kkk-website.component.html',
  styleUrl: './kkk-website.component.scss'
})
export class KkkWebsiteComponent implements OnInit, OnDestroy {

  // ─── Signals ───────────────────────────────────────────────────────────────
  activeSection = signal('home');
  showBackToTop = signal(false);
  teams: WritableSignal<Team[]> = signal([]);
  appSettings = signal<any>({});
  carouselItems = signal<any[]>([]);
  dynamicSponsors = signal<any[]>([]);
  dynamicGallery = signal<any[]>([]);
  liveMatches = signal<any[]>([]);
  upcomingMatches = signal<FixtureMatch[]>([]);
  completedMatches = signal<FixtureMatch[]>([]);
  standings = signal<StandingRow[]>([]);
  topRunScorers = signal<TopPerformer[]>([]);
  topWicketTakers = signal<TopPerformer[]>([]);

  // ─── Players ───────────────────────────────────────────────────────────────
  players: any[] = [];
  filteredPlayers: any[] = [];
  activeFilter = 'All';
  searchQuery = '';
  currentPage = 1;
  playersPerPage = 8;

  // ─── Gallery ───────────────────────────────────────────────────────────────
  selectedCategory = 'all';

  // ─── Fixture tab ───────────────────────────────────────────────────────────
  fixtureTab: 'upcoming' | 'live' | 'completed' = 'upcoming';

  // ─── Modals ────────────────────────────────────────────────────────────────
  selectedTeam = signal<Team | null>(null);
  selectedPlayer = signal<any | null>(null);
  teamModalOpen = signal(false);
  playerModalOpen = signal(false);

  // ─── Lightbox ──────────────────────────────────────────────────────────────
  lightboxOpen = signal(false);
  currentLightboxIndex = signal(0);
  currentLightboxImages = signal<{ src: string; caption: string }[]>([]);

  // ─── Auction ───────────────────────────────────────────────────────────────
  auctionList: any[] = [];
  auctionCountdowns: { [key: string]: any } = {};
  currentAuction = signal<any>(null);
  registerModalOpen = signal(false);
  selectedAuctionForReg: any = null;

// ─── Registration ──────────────────────────────────────────────────────────
   regForm = { ownerName: '', contactNumber: '', password: '', teamName: '', location: '', slogan: '', sessionId: null as any, transactionId: '', notes: '' };
   isRegistering = false;
   registrationSuccess = false;
   registrationError = '';
   showPassword = false;
   existingTeamMatch: any | null = null;
   existingPlayerMatch: any | null = null;
   regType: 'team' | 'player' = 'team';
   playerRegForm = { playerName: '', fatherName: '', contactNumber: '', photoUrl: '', role: 'Batsman', battingStyle: 'Right-hand bat', bowlingStyle: 'Right-arm medium', basePrice: 100000, sessionId: null };
   selectedPhotoFile: File | null = null;
   selectedReceiptFile: File | null = null;

  // ─── Location search ──────────────────────────────────────────────────────
  locationSearch = '';
  showLocationDropdown = false;

  get filteredLocations() {
    const q = this.locationSearch.toLowerCase();
    return this.availableLocations().filter(loc =>
      !q || (loc.Name || '').toLowerCase().includes(q) || (loc.District || '').toLowerCase().includes(q)
    );
  }

  selectLocation(loc: any) {
    this.regForm.location = loc.Name;
    this.locationSearch = loc.Name + (loc.District ? `, ${loc.District}` : '');
    this.showLocationDropdown = false;
  }

  onLocationSearchFocus() { this.showLocationDropdown = true; }
  onLocationSearchBlur() { setTimeout(() => this.showLocationDropdown = false, 200); }

  // ─── Franchise detail view ────────────────────────────────────────────────
  franchiseDetailOpen = signal(false);
  selectedFranchise = signal<any | null>(null);

  openFranchiseDetail(team: any) {
    this.selectedFranchise.set(team);
    this.franchiseDetailOpen.set(true);
    if (this.isBrowser) document.body.style.overflow = 'hidden';
  }

  closeFranchiseDetail() {
    this.franchiseDetailOpen.set(false);
    if (this.isBrowser) document.body.style.overflow = '';
  }

  // ─── Newsletter ────────────────────────────────────────────────────────────
  newsletterEmail = '';
  newsletterSuccess = false;

  // ─── UI ────────────────────────────────────────────────────────────────────
  isBrowser: boolean;
  mobileNavOpen = false;
  selectedSeason = '2026';
  availableSeasons = ['2024', '2025', '2026'];
  availableLocations = signal<any[]>([]);

  // ─── Fallback grid ─────────────────────────────────────────────────────────
  gridImages = [
    'assets/GJ2026_3.jpeg', 'assets/MV_1.jpeg', 'assets/MWPI3556.JPG',
    'assets/NMUM0899.JPG', 'assets/MV_5.jpeg', 'assets/IUEF1539.JPG'
  ];

  contactInfo = {
    facebook: 'https://facebook.com/katturcricket',
    instagram: 'https://instagram.com/katturcricket',
    youtube: 'https://youtube.com/katturcricket',
    twitter: 'https://twitter.com/katturcricket'
  };

  private countdownInterval: any;
  private liveMatchInterval: any;
  private matchService = inject(MatchService);

  constructor(
    private teamService: TeamsService,
    private playerService: PlayerService,
    private auctionSessionService: AuctionSessionService,
    private settingsService: SettingsService,
    private onboardingService: OnboardingService,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit() {
    this.loadAppSettings();
    this.loadCarousel();
    this.loadSponsors();
    this.loadGallery();
    this.getAuctionList();
    this.getTeamList();
    this.getPlayerList();
    this.loadAllMatches();
    this.loadLocations();

    if (this.isBrowser) {
      this.updateActiveSection();
      this.liveMatchInterval = setInterval(() => this.loadAllMatches(), 30000);
    }
  }

  ngOnDestroy() {
    if (this.countdownInterval) clearInterval(this.countdownInterval);
    if (this.liveMatchInterval) clearInterval(this.liveMatchInterval);
  }

  // ─── Data loading ──────────────────────────────────────────────────────────

  loadLocations() {
    this.settingsService.getLocations(true).subscribe({
      next: (res: any) => {
        this.availableLocations.set(res.data?.locations || []);
      },
      error: () => {}
    });
  }

  loadAppSettings() {
    this.settingsService.getAppSettings().subscribe({
      next: (res: any) => {
        const rawSettings = res.data?.settings || res.data || res;
        const settings = { ...rawSettings };
        
        // Map backend fields to frontend properties
        settings.appName = settings.AppName;
        settings.logo = settings.AppLogoURL;
        
        if (settings?.logo) {
          settings.logoUrl = settings.logo.startsWith('http') || settings.logo.startsWith('assets')
            ? settings.logo : environment.apiUrl.replace('/api', '') + settings.logo;
        }
        
        // Fix UPI scanner image URL — prepend apiUrl for relative paths
        if (settings?.UPIScannerImageURL &&
            !settings.UPIScannerImageURL.startsWith('http') &&
            !settings.UPIScannerImageURL.startsWith('assets')) {
          settings.UPIScannerImageURL = environment.apiUrl + settings.UPIScannerImageURL;
        }
        this.appSettings.set(settings || {});
        if (settings) {
          if (settings.facebook) this.contactInfo.facebook = settings.facebook;
          if (settings.instagram) this.contactInfo.instagram = settings.instagram;
          if (settings.twitter) this.contactInfo.twitter = settings.twitter;
          if (settings.youtube) this.contactInfo.youtube = settings.youtube;
        }
      },
      error: (err) => console.error('Settings error:', err)
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
          imageUrl: (item.ImageURL || item.imageUrl)
            ? ((item.ImageURL || item.imageUrl).startsWith('http') ? (item.ImageURL || item.imageUrl) : environment.apiUrl + (item.ImageURL || item.imageUrl))
            : 'assets/MV_4.jpeg'
        })) : []);
      },
      error: (err) => console.error('Carousel error:', err)
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
          LogoURL: s.LogoURL ? (s.LogoURL.startsWith('http') ? s.LogoURL : environment.apiUrl + s.LogoURL) : ''
        })) : []);
      },
      error: (err) => console.error('Sponsors error:', err)
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
          url: img.ImageURL ? (img.ImageURL.startsWith('http') ? img.ImageURL : environment.apiUrl + img.ImageURL) : ''
        })) : []);
      },
      error: (err) => console.error('Gallery error:', err)
    });
  }

  getTeamList() {
    this.teamService.getAll().subscribe({
      next: (response: any) => {
        const teams = response?.data?.teams ?? [];
        const mapped = teams.map((team: any) => {
          let logo = team.LogoURL;
          if (logo && !logo.startsWith('http') && !logo.startsWith('assets')) {
            logo = environment.apiUrl + logo;
          } else if (!logo) {
            const fallbacks: { [key: string]: string } = {
              'KKK Juniors': 'assets/teams/kkkjuniors.png',
              '7 Star': 'assets/teams/sevenstar.png',
              'GJ Warriors': 'assets/teams/gjwarriors.png',
              'Power Hitters': 'assets/teams/powerhitter.png'
            };
            logo = fallbacks[team.Name] || 'assets/logo.jpeg';
          }
          return { ...team, LogoURL: logo };
        });
        this.teams.set(mapped);
        this.computeStandings(mapped);
      },
      error: (err) => console.error('Teams error:', err)
    });
  }

  getPlayerList() {
    this.playerService.getAll().subscribe({
      next: (response: any) => {
        this.players = (response?.data?.players ?? []).map((p: any) => ({
          ...p,
          PhotoURL: p.PhotoURL ? (p.PhotoURL.startsWith('http') ? p.PhotoURL : environment.apiUrl + p.PhotoURL) : ''
        }));
        this.applyPlayerFilter();
        this.computeTopPerformers();
      },
      error: (err) => console.error('Players error:', err)
    });
  }

  loadAllMatches() {
    this.matchService.getAll().subscribe({
      next: (res: any) => {
        const all: FixtureMatch[] = res.data?.matches || res.matches || [];
        this.liveMatches.set(all.filter(m => m.Status === 'Live'));
        this.upcomingMatches.set(all.filter(m => m.Status === 'Scheduled')
          .sort((a, b) => new Date(a.MatchDate).getTime() - new Date(b.MatchDate).getTime()));
        this.completedMatches.set(all.filter(m => m.Status === 'Completed')
          .sort((a, b) => new Date(b.MatchDate).getTime() - new Date(a.MatchDate).getTime()));
        this.computeStandingsFromMatches(all);
      }
    });
  }

  getAuctionList() {
    this.auctionSessionService.getAuctionList().subscribe({
      next: (response: any) => {
        this.auctionList = (response?.data?.sessions ?? [])
          .sort((a: any, b: any) => new Date(a.StartDate).getTime() - new Date(b.StartDate).getTime())
          .map((session: any) => ({
            ...session,
            registeredTeams: (session.registeredTeams ?? []).map((t: any) => ({
              ...t,
              logoUrl: t.logoUrl
                ? (t.logoUrl.startsWith('http') ? t.logoUrl : environment.apiUrl + t.logoUrl)
                : 'assets/logo.jpeg'
            }))
          }));
        if (this.isBrowser) this.startCountdown();
      },
      error: (err) => console.error('Auction error:', err)
    });
  }

  // ─── Standings & Stats ─────────────────────────────────────────────────────

  computeStandings(teams: Team[]) {
    // Placeholder until matches load — show teams with 0 stats
    const rows: StandingRow[] = teams.map((t, i) => ({
      rank: i + 1, team: t, played: 0, won: 0, lost: 0, tied: 0, nrr: '+0.000', points: 0
    }));
    this.standings.set(rows);
  }

  computeStandingsFromMatches(matches: FixtureMatch[]) {
    const teamMap: { [key: string]: StandingRow } = {};

    const ensureTeam = (team: Team) => {
      const key = team.Name;
      if (!teamMap[key]) {
        teamMap[key] = { rank: 0, team, played: 0, won: 0, lost: 0, tied: 0, nrr: '+0.000', points: 0 };
      }
    };

    matches.filter(m => m.Status === 'Completed').forEach(m => {
      if (!m.TeamA || !m.TeamB) return;
      ensureTeam(m.TeamA);
      ensureTeam(m.TeamB);
      const a = teamMap[m.TeamA.Name];
      const b = teamMap[m.TeamB.Name];
      a.played++; b.played++;

      const resultNote = (m.ResultNote || '').toLowerCase();
      if (resultNote.includes(m.TeamA.Name.toLowerCase()) || resultNote.includes('team a')) {
        a.won++; a.points += 2; b.lost++;
      } else if (resultNote.includes(m.TeamB.Name.toLowerCase()) || resultNote.includes('team b')) {
        b.won++; b.points += 2; a.lost++;
      } else {
        a.tied++; b.tied++; a.points++; b.points++;
      }
    });

    // Also count live matches as played
    matches.filter(m => m.Status === 'Live').forEach(m => {
      if (!m.TeamA || !m.TeamB) return;
      ensureTeam(m.TeamA);
      ensureTeam(m.TeamB);
    });

    const sorted = Object.values(teamMap)
      .sort((a, b) => b.points - a.points || b.won - a.won)
      .map((r, i) => ({ ...r, rank: i + 1 }));

    if (sorted.length > 0) this.standings.set(sorted);
  }

  computeTopPerformers() {
    const scorers = [...this.players]
      .sort((a, b) => (b.runs || 0) - (a.runs || 0))
      .slice(0, 5)
      .map(p => ({ player: p, value: p.runs || 0, label: 'runs' }));

    const takers = [...this.players]
      .sort((a, b) => (b.wickets || 0) - (a.wickets || 0))
      .slice(0, 5)
      .map(p => ({ player: p, value: p.wickets || 0, label: 'wickets' }));

    this.topRunScorers.set(scorers);
    this.topWicketTakers.set(takers);
  }

  // ─── Player filtering ──────────────────────────────────────────────────────

  applyPlayerFilter(role?: string) {
    if (role) { this.activeFilter = role; this.currentPage = 1; }
    let filtered = [...this.players];
    if (this.activeFilter !== 'All') {
      filtered = filtered.filter(p => p.Role === this.activeFilter);
    }
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        (p.Name || '').toLowerCase().includes(q) ||
        (p.Team || '').toLowerCase().includes(q)
      );
    }
    const start = (this.currentPage - 1) * this.playersPerPage;
    this.filteredPlayers = filtered.slice(start, start + this.playersPerPage);
    this._totalFilteredCount = filtered.length;
  }

  _totalFilteredCount = 0;

  get totalPages() { return Math.ceil(this._totalFilteredCount / this.playersPerPage); }

  prevPage() { if (this.currentPage > 1) { this.currentPage--; this.applyPlayerFilter(); } }
  nextPage() { if (this.currentPage < this.totalPages) { this.currentPage++; this.applyPlayerFilter(); } }

  onSearchChange() { this.currentPage = 1; this.applyPlayerFilter(); }

  getRoleBadgeClass(role: string) {
    const map: { [k: string]: string } = {
      'Batsman': 'role-bat', 'Bowler': 'role-bowl',
      'All-Rounder': 'role-all', 'Wicket Keeper': 'role-wk'
    };
    return map[role] || 'role-default';
  }

  // ─── Gallery ───────────────────────────────────────────────────────────────

  get availableCategories() {
    return [...new Set(this.dynamicGallery().map(img => img.Category).filter(Boolean))];
  }

  getFilteredGallery() {
    const imgs = this.dynamicGallery();
    return this.selectedCategory === 'all' ? imgs : imgs.filter(i => i.Category === this.selectedCategory);
  }

  setCategory(cat: string) { this.selectedCategory = cat; }

  openLightbox(image: any) {
    const all = this.getFilteredGallery().map(img => ({ src: img.url, caption: img.Title }));
    const idx = all.findIndex(i => i.src === image.url);
    this.currentLightboxImages.set(all);
    this.currentLightboxIndex.set(idx >= 0 ? idx : 0);
    this.lightboxOpen.set(true);
    if (this.isBrowser) document.body.style.overflow = 'hidden';
  }

  closeLightbox() {
    this.lightboxOpen.set(false);
    if (this.isBrowser) document.body.style.overflow = '';
  }

  nextLightboxImage() {
    const n = this.currentLightboxImages().length;
    this.currentLightboxIndex.set((this.currentLightboxIndex() + 1) % n);
  }

  prevLightboxImage() {
    const n = this.currentLightboxImages().length;
    this.currentLightboxIndex.set((this.currentLightboxIndex() - 1 + n) % n);
  }

  get currentLightboxImage() {
    const imgs = this.currentLightboxImages();
    return imgs[this.currentLightboxIndex()] || undefined;
  }

  // ─── Modals ────────────────────────────────────────────────────────────────

  openRegisterModal(auction?: any) {
    this.selectedAuctionForReg = auction || null;
    // Pre-fill session if auction is provided
    if (auction) {
      this.regForm.sessionId = auction.SessionID || auction.id || auction._id || null;
    }
    this.registrationSuccess = false;
    this.registrationError = '';
    this.regType = 'team';
    this.registerModalOpen.set(true);
    if (this.isBrowser) document.body.style.overflow = 'hidden';
  }

  closeRegisterModal() {
    this.registerModalOpen.set(false);
    if (this.isBrowser) document.body.style.overflow = '';
    // Reset form state
    this.registrationSuccess = false;
    this.registrationError = '';
  }

  openTeamModal(team: Team) {
    this.selectedTeam.set(team);
    this.teamModalOpen.set(true);
    if (this.isBrowser) document.body.style.overflow = 'hidden';
  }

  closeTeamModal() {
    this.teamModalOpen.set(false);
    if (this.isBrowser) document.body.style.overflow = '';
  }

  openPlayerModal(player: any) {
    this.selectedPlayer.set(player);
    this.playerModalOpen.set(true);
    if (this.isBrowser) document.body.style.overflow = 'hidden';
  }

  closePlayerModal() {
    this.playerModalOpen.set(false);
    if (this.isBrowser) document.body.style.overflow = '';
  }

  getPlayersForTeam(teamName: string) {
    return this.players.filter(p => p.Team === teamName);
  }

  // ─── Auction Countdown ─────────────────────────────────────────────────────

  startCountdown() {
    if (this.countdownInterval) clearInterval(this.countdownInterval);
    this.updateCountdowns();
    this.countdownInterval = setInterval(() => this.updateCountdowns(), 1000);
  }

  updateCountdowns() {
    const now = Date.now();
    this.auctionList.forEach((auction: any, i: number) => {
      if (!auction.StartDate) return;
      const diff = new Date(auction.StartDate).getTime() - now;
      const key = auction.id || auction._id || i;
      if (diff <= 0) {
        this.auctionCountdowns[key] = { days: '00', hours: '00', minutes: '00', seconds: '00', started: true };
      } else {
        this.auctionCountdowns[key] = {
          days: String(Math.floor(diff / 86400000)).padStart(2, '0'),
          hours: String(Math.floor((diff % 86400000) / 3600000)).padStart(2, '0'),
          minutes: String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0'),
          seconds: String(Math.floor((diff % 60000) / 1000)).padStart(2, '0'),
          started: false
        };
      }
    });
    this.auctionCountdowns = { ...this.auctionCountdowns };
  }

  // ─── Registration ──────────────────────────────────────────────────────────



  setRegistrationType(type: 'team' | 'player') {
    this.regType = type;
    this.registrationSuccess = false;
    this.registrationError = '';
  }

  onTeamLookupChange() {
    const phone = this.normalizePhone(this.regForm.contactNumber);
    const teamName = this.normalizeText(this.regForm.teamName);
    if (!phone && teamName.length < 3) {
      this.existingTeamMatch = null;
      return;
    }

    this.existingTeamMatch = this.teams().find((team: any) => {
      const teamPhone = this.normalizePhone(team.Contact || team.contact || team.OwnerContact || '');
      const teamLabel = this.normalizeText(team.Name);
      return (phone && teamPhone && teamPhone === phone) || (teamName.length >= 3 && teamLabel === teamName);
    }) || null;

    if (this.existingTeamMatch) this.applyExistingTeam(this.existingTeamMatch, false);
  }

  onPlayerLookupChange() {
    const phone = this.normalizePhone(this.playerRegForm.contactNumber);
    const playerName = this.normalizeText(this.playerRegForm.playerName);
    if (!phone && playerName.length < 3) {
      this.existingPlayerMatch = null;
      return;
    }

    this.existingPlayerMatch = this.players.find((player: any) => {
      const playerPhone = this.normalizePhone(player.Mobile || player.contactNumber || player.Contact || '');
      const playerLabel = this.normalizeText(player.Name);
      return (phone && playerPhone && playerPhone === phone) || (playerName.length >= 3 && playerLabel === playerName);
    }) || null;

    if (this.existingPlayerMatch) this.applyExistingPlayer(this.existingPlayerMatch, false);
  }

  applyExistingTeam(team: any, announce = true) {
    this.regForm = {
      ...this.regForm,
      ownerName: this.regForm.ownerName || team.OwnerName || '',
      contactNumber: this.regForm.contactNumber || team.Contact || '',
      teamName: team.Name || this.regForm.teamName,
      location: team.Location || this.regForm.location,
      slogan: team.Slogan || this.regForm.slogan
    };
    if (announce) this.registrationError = '';
  }

  applyExistingPlayer(player: any, announce = true) {
    this.playerRegForm = {
      ...this.playerRegForm,
      playerName: player.Name || this.playerRegForm.playerName,
      fatherName: player.FatherName || this.playerRegForm.fatherName,
      contactNumber: this.playerRegForm.contactNumber || player.Mobile || '',
      role: player.Role || this.playerRegForm.role,
      battingStyle: player.BattingStyle || this.playerRegForm.battingStyle,
      bowlingStyle: player.BowlingStyle || this.playerRegForm.bowlingStyle
    };
    if (announce) this.registrationError = '';
  }

  private normalizePhone(value: string) {
    return String(value || '').replace(/\D/g, '').slice(-10);
  }

  private normalizeText(value: string) {
    return String(value || '').trim().toLowerCase();
  }

  onReceiptFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedReceiptFile = file;
    }
  }

  submitRegistration() {
    const phone = this.normalizePhone(this.regForm.contactNumber);
    if (!/^\d{10}$/.test(phone)) {
      this.registrationError = 'Please enter a valid 10-digit mobile number.';
      return;
    }
    if (!this.regForm.ownerName || !this.regForm.contactNumber || !this.regForm.password || !this.regForm.teamName || !this.regForm.sessionId) {
      this.registrationError = 'Please fill all required fields (including Auction Session).';
      return;
    }
    if (!this.regForm.transactionId || !this.selectedReceiptFile) {
      this.registrationError = 'Please complete the payment and upload the payment screenshot with Transaction ID.';
      return;
    }
    this.isRegistering = true;
    this.registrationError = '';
    const payload = { ...this.regForm, contactNumber: phone };
    this.onboardingService.registerTeam(payload, this.selectedReceiptFile).subscribe({
      next: () => {
        this.isRegistering = false;
        this.registrationSuccess = true;
        this.existingTeamMatch = null;
        this.selectedReceiptFile = null;
        this.regForm = { ownerName: '', contactNumber: '', password: '', teamName: '', location: '', slogan: '', sessionId: null as any, transactionId: '', notes: '' };
        this.getAuctionList();
        this.getTeamList();
        // Auto-close the modal after showing success for 3 seconds
        setTimeout(() => {
          this.registrationSuccess = false;
          this.closeRegisterModal();
        }, 3500);
      },
      error: (err: any) => {
        this.isRegistering = false;
        this.registrationError = err.error?.message || 'Registration failed. Please try again.';
      }
    });
  }

  submitPlayerRegistration() {
    const phone = this.normalizePhone(this.playerRegForm.contactNumber);
    if (!/^\d{10}$/.test(phone)) {
      this.registrationError = 'Please enter a valid 10-digit mobile number.';
      return;
    }
    if (!this.playerRegForm.playerName || !this.playerRegForm.fatherName || !this.playerRegForm.contactNumber || !this.playerRegForm.sessionId) {
      this.registrationError = 'Please fill all required fields (Name, Father Name, Contact, Auction Session).';
      return;
    }
    this.isRegistering = true;
    this.registrationError = '';
    const payload: any = { ...this.playerRegForm, contactNumber: phone };
    if (this.selectedPhotoFile) {
      payload.photoFile = this.selectedPhotoFile;
    }
    this.onboardingService.registerPlayerForAuction(payload).subscribe({
      next: () => {
        this.isRegistering = false;
        this.registrationSuccess = true;
        this.existingPlayerMatch = null;
        this.playerRegForm = { playerName: '', fatherName: '', contactNumber: '', photoUrl: '', role: 'Batsman', battingStyle: 'Right-hand bat', bowlingStyle: 'Right-arm medium', basePrice: 100000, sessionId: null };
        this.selectedPhotoFile = null;
        this.getPlayerList();
        Swal.fire({
          icon: 'success',
          title: 'Player Registered!',
          text: 'You are now registered for the auction pool.',
          confirmButtonColor: '#0ea5e9',
          timer: 3000,
          timerProgressBar: true
        });
        setTimeout(() => this.registrationSuccess = false, 3000);
      },
      error: (err: any) => {
        this.isRegistering = false;
        this.registrationError = err.error?.message || 'Player Registration failed. Please try again.';
      }
    });
  }

  onPhotoSelected(event: any) {
    const file = event.target.files?.[0];
    if (file) {
      this.selectedPhotoFile = file;
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.playerRegForm.photoUrl = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  // ─── Newsletter ────────────────────────────────────────────────────────────

  subscribeNewsletter() {
    if (this.newsletterEmail?.includes('@')) {
      this.newsletterSuccess = true;
      this.newsletterEmail = '';
      setTimeout(() => this.newsletterSuccess = false, 4000);
    }
  }

  // ─── Scroll & Navigation ───────────────────────────────────────────────────

  scrollTo(sectionId: string,auction?:any) {
    if (sectionId === 'register') {
      this.openRegisterModal(auction);
      return;
    }
    this.activeSection.set(sectionId);
    this.mobileNavOpen = false;
    if (this.isBrowser) {
      const el = document.getElementById(sectionId);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  scrollContainer(id: string, dir: 'left' | 'right') {
    if (!this.isBrowser) return;
    const el = document.getElementById(id);
    if (el) el.scrollBy({ left: dir === 'left' ? -320 : 320, behavior: 'smooth' });
  }

  redirectTo(url: string) { if (this.isBrowser) window.open(url, '_blank'); }

  @HostListener('window:scroll')
  onScroll() {
    if (!this.isBrowser) return;
    this.showBackToTop.set(window.pageYOffset > 400);
    this.updateActiveSection();
  }

  updateActiveSection() {
    if (!this.isBrowser) return;
    const sections = ['home', 'teams', 'standings', 'fixtures', 'players', 'stats', 'sponsors', 'auction', 'gallery', 'contact'];
    const scrollPos = window.pageYOffset + 120;
    for (const id of sections) {
      const el = document.getElementById(id);
      if (el && scrollPos >= el.offsetTop && scrollPos < el.offsetTop + el.offsetHeight) {
        this.activeSection.set(id);
        break;
      }
    }
  }

  @HostListener('document:keydown', ['$event'])
  handleKey(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      if (this.lightboxOpen()) this.closeLightbox();
      if (this.teamModalOpen()) this.closeTeamModal();
      if (this.playerModalOpen()) this.closePlayerModal();
      if (this.registerModalOpen()) this.closeRegisterModal();
      if (this.franchiseDetailOpen()) this.closeFranchiseDetail();
    }
    if (this.lightboxOpen()) {
      if (e.key === 'ArrowRight') this.nextLightboxImage();
      if (e.key === 'ArrowLeft') this.prevLightboxImage();
    }
  }

  // ─── Fixture tab ───────────────────────────────────────────────────────────

  setFixtureTab(tab: 'upcoming' | 'live' | 'completed') { this.fixtureTab = tab; }

  getFixturesList(): FixtureMatch[] {
    if (this.fixtureTab === 'live') return this.liveMatches() as FixtureMatch[];
    if (this.fixtureTab === 'completed') return this.completedMatches();
    return this.upcomingMatches();
  }

  formatMatchDate(dateStr: string) {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  formatMatchTime(dateStr: string) {
    return new Date(dateStr).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  }

  getWinnerName(match: FixtureMatch): string {
    if (!match.ResultNote) return '';
    const note = match.ResultNote;
    if (note.toLowerCase().includes('won')) return note;
    return note;
  }
}
