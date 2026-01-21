export interface Team {
    id: number;
    name: string;
    logoUrl: string;
    budget: number;
    currentBid?: number;
    playersWon: number;
}
