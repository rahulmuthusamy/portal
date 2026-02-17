export interface Match {
    MatchID?: number;
    TournamentID?: number;
    MatchNumber?: number;
    TeamA_ID?: number;
    TeamB_ID?: number;
    MatchDate?: string;
    Venue?: string;
    Status?: 'Scheduled' | 'Live' | 'Completed' | 'Abandoned';
    TossWinnerID?: number;
    TossDecision?: 'Bat' | 'Bowl';
    WinnerID?: number;
    ResultNote?: string;
    OversPerSide?: number;
    TeamA?: any;
    TeamB?: any;
    CurrentInnings?: number;
    TeamA_Runs?: number;
    TeamA_Wickets?: number;
    TeamA_Overs?: number;
    TeamB_Runs?: number;
    TeamB_Wickets?: number;
    TeamB_Overs?: number;
}

export interface Ball {
    overNumber: number;
    ballNumber: number;
    batsmanId: number;
    bowlerId: number;
    runs: number;
    extraType?: 'Wide' | 'NoBall' | 'Bye' | 'LegBye' | 'Penalty';
    extraRuns: number;
    isWicket: boolean;
    wicketType?: 'Bowled' | 'Caught' | 'Lbw' | 'RunOut' | 'Stumped' | 'HitWicket' | 'Others';
    outBatsmanId?: number;
}

export interface Innings {
    id: number;
    matchId: number;
    inningsNumber: 1 | 2;
    battingTeamId: number;
    bowlingTeamId: number;
    runs: number;
    wickets: number;
    overs: number;
    balls: number;
    extras: Extras;
}

export interface Extras {
    wides: number;
    noBalls: number;
    byes: number;
    legByes: number;
    penalty: number;
    total: number;
}

export interface BatsmanScore {
    playerId: number;
    playerName: string;
    runs: number;
    balls: number;
    fours: number;
    sixes: number;
    strikeRate: number;
    isOut: boolean;
    wicketDescription?: string;
}

export interface BowlerScore {
    playerId: number;
    playerName: string;
    overs: number;
    maidens: number;
    runs: number;
    wickets: number;
    economy: number;
}
