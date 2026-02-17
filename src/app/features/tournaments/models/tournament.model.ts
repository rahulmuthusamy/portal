export interface Tournament {
    id?: number;
    name?: string;
    description?: string;
    startDate?: string;
    endDate?: string;
    type?: 'League' | 'Knockout' | 'Hybrid';
    status?: 'Upcoming' | 'Ongoing' | 'Completed';
    teams?: number[];
    bannerUrl?: string;

    TournamentID: number;
    Name: string;
    Description?: string;
    StartDate?: string;
    EndDate?: string;
    Type: 'League' | 'Knockout' | 'Hybrid';
    Status: 'Upcoming' | 'Ongoing' | 'Completed';
    Teams?: any[];
    LogoURL?: string;
    BannerURL?: string;
    MatchFormat?: string;
    VenueName?: string;
    City?: string;
    State?: string;
    RegistrationStartDate?: string;
    RegistrationEndDate?: string;
    IsRegistrationOpen?: boolean;
    MaxTeams?: number;
    MinTeams?: number; OversPerMatch?: number;
    PlayersPerTeam?: number;
    RegistrationFee?: number;
    ContactEmail?: string;
    ContactPhone?: string;
    WebsiteURL?: string;
}

export interface PointsTableEntry {
    teamId: number;
    teamName: string;
    matchesPlayed: number;
    won: number;
    lost: number;
    draw: number;
    noResult: number;
    points: number;
    netRunRate: number;
    teamLogo?: string;
}
