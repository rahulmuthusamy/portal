import { Injectable } from '@angular/core';
import { ApiService } from '@core/services/api.service';
import { environment } from '@environments/environment';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class AuctionManagementService {
    private endpoint = `${environment.apiUrl}/auction`;

    constructor(private api: ApiService) { }

    createSession(data: any): Observable<any> {
        return this.api.post(`${this.endpoint}/sessions`, data);
    }

    startAuction(sessionId: number): Observable<any> {
        return this.api.post(`${this.endpoint}/sessions/${sessionId}/start`, {});
    }

    completeAuction(sessionId: number): Observable<any> {
        return this.api.post(`${this.endpoint}/sessions/${sessionId}/complete`, {});
    }

    registerTeam(sessionId: number, teamId: number): Observable<any> {
        return this.api.post(`${this.endpoint}/sessions/${sessionId}/teams`, { teamId });
    }

    getTeamDashboard(sessionId: number, teamId: number): Observable<any> {
        return this.api.get(`${this.endpoint}/sessions/${sessionId}/teams/${teamId}/dashboard`);
    }

    addPlayerToPool(sessionId: number, playerId: number, basePrice: number): Observable<any> {
        return this.api.post(`${this.endpoint}/sessions/${sessionId}/players`, { playerId, basePrice });
    }

    validateBid(sessionId: number, teamId: number, playerId: number, bidAmount: number): Observable<any> {
        return this.api.post(`${this.endpoint}/sessions/${sessionId}/validate-bid`, { teamId, playerId, bidAmount });
    }

    sellPlayer(sessionId: number, playerId: number, teamId: number, finalBid: number): Observable<any> {
        return this.api.post(`${this.endpoint}/sessions/${sessionId}/sell`, { playerId, teamId, finalBid });
    }

    markUnsold(sessionId: number, playerId: number): Observable<any> {
        return this.api.post(`${this.endpoint}/sessions/${sessionId}/unsold`, { playerId });
    }

    getAuctionResults(sessionId: number): Observable<any> {
        return this.api.get(`${this.endpoint}/sessions/${sessionId}/results`);
    }
}
