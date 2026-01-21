export interface Player {
    PlayerID?: number;
    Name: string;
    Mobile: string;
    Email?: string;
    Role?: string;
    PhotoURL?: string;
    Notes?: string;
    Status?: 'active' | 'inactive';
    CreatedAt?: string;
    UpdatedAt?: string;
}
