export interface Player {
    id: number;
    name: string;
    role: string;
    basePrice: number;
    currentBid: number;
    highestBidTeamId: number | null;
    status: 'available' | 'live' | 'sold' | 'skipped';
    photo: string;
}
