import { Injectable } from '@angular/core';
import { ApiService } from '@core/services/api.service';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class AuctionManagementService {
    private endpoint = '/auction';

    constructor(private api: ApiService) { }

    // ── Sessions ──
    createSession(data: any): Observable<any> {
        return this.api.post(`${this.endpoint}/sessions`, data);
    }

    getLiveSessions(): Observable<any> {
        return this.api.get(`${this.endpoint}/sessions/live`);
    }

    startAuction(sessionId: number): Observable<any> {
        return this.api.post(`${this.endpoint}/sessions/${sessionId}/start`, {});
    }

    completeAuction(sessionId: number): Observable<any> {
        return this.api.post(`${this.endpoint}/sessions/${sessionId}/complete`, {});
    }

    // ── Teams ──
    getSessionTeams(sessionId: number): Observable<any> {
        return this.api.get(`${this.endpoint}/sessions/${sessionId}/teams`);
    }

    registerTeam(sessionId: number, teamId: number): Observable<any> {
        return this.api.post(`${this.endpoint}/sessions/${sessionId}/teams`, { teamId });
    }

    removeTeam(sessionId: number, teamId: number): Observable<any> {
        return this.api.delete(`${this.endpoint}/sessions/${sessionId}/teams/${teamId}`);
    }

    getTeamDashboard(sessionId: number, teamId: number): Observable<any> {
        return this.api.get(`${this.endpoint}/sessions/${sessionId}/teams/${teamId}/dashboard`);
    }

    // ── Player Pool ──
    getSessionPlayers(sessionId: number): Observable<any> {
        return this.api.get(`${this.endpoint}/sessions/${sessionId}/players`);
    }

    addPlayerToPool(sessionId: number, playerId: number, basePrice: number): Observable<any> {
        return this.api.post(`${this.endpoint}/sessions/${sessionId}/players`, { playerId, basePrice });
    }

    removePlayerFromPool(sessionId: number, playerId: number): Observable<any> {
        return this.api.delete(`${this.endpoint}/sessions/${sessionId}/players/${playerId}`);
    }

    // ── Bidding ──
    validateBid(sessionId: number, teamId: number, playerId: number, bidAmount: number): Observable<any> {
        return this.api.post(`${this.endpoint}/sessions/${sessionId}/validate-bid`, { teamId, playerId, bidAmount });
    }

    sellPlayer(sessionId: number, playerId: number, teamId: number, finalBid: number): Observable<any> {
        return this.api.post(`${this.endpoint}/sessions/${sessionId}/sell`, { playerId, teamId, finalBid });
    }

    markUnsold(sessionId: number, playerId: number): Observable<any> {
        return this.api.post(`${this.endpoint}/sessions/${sessionId}/unsold`, { playerId });
    }

    // ── Results ──
    getAuctionResults(sessionId: number): Observable<any> {
        return this.api.get(`${this.endpoint}/sessions/${sessionId}/results`);
    }

    // ── Public: Registered Teams for a session (website display) ──
    getSessionRegisteredTeams(sessionId: number): Observable<any> {
        return this.api.get(`${this.endpoint}/sessions/${sessionId}/registered-teams`);
    }
}
