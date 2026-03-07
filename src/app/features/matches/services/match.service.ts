import { Injectable } from '@angular/core';
import { ApiService } from '@core/services/api.service';
import { BaseCrudService } from '@core/services/base-crud.service';
import { environment } from '@environments/environment';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class MatchService extends BaseCrudService<any> {
    constructor(api: ApiService) {
        super(api, `${environment.apiUrl}/matches`);
    }

    getLiveScore(matchId: number): Observable<any> {
        return this.api.get(`${this.endpoint}/${matchId}/live-score`);
    }

    getLiveScoreDetailed(matchId: number): Observable<any> {
        return this.api.get(`${this.endpoint}/${matchId}/live-score-detailed`);
    }

    getScorecard(matchId: number): Observable<any> {
        return this.api.get(`${this.endpoint}/${matchId}/scorecard`);
    }

    getMatchSquads(matchId: number): Observable<any> {
        return this.api.get(`${this.endpoint}/${matchId}/squads`);
    }

    recordToss(matchId: number, data: { tossWinnerId: number, tossDecision: string }): Observable<any> {
        return this.api.post(`${this.endpoint}/${matchId}/toss`, data);
    }

    startInnings(matchId: number, data: { inningsNumber: number }): Observable<any> {
        return this.api.post(`${this.endpoint}/${matchId}/innings`, data);
    }

    recordBall(ballData: any): Observable<any> {
        return this.api.post(`${this.endpoint}/ball`, ballData);
    }

    undoLastBall(matchId: number): Observable<any> {
        return this.api.post(`${this.endpoint}/${matchId}/undo-ball`, {});
    }

    completeInnings(inningsId: number): Observable<any> {
        return this.api.post(`${this.endpoint}/innings/complete`, { inningsId });
    }

    saveMatchSquad(matchId: number, teamId: number, players: any[]): Observable<any> {
        return this.api.post(`${this.endpoint}/${matchId}/squad`, { teamId, players });
    }

    getMatchSquad(matchId: number): Observable<any> {
        return this.api.get(`${this.endpoint}/${matchId}/squad`);
    }

    startMatch(matchId: number, tossWinnerId: number, tossDecision: string): Observable<any> {
        return this.api.post(`${this.endpoint}/${matchId}/start`, { tossWinnerId, tossDecision });
    }

    recordBallNew(ballData: any): Observable<any> {
        return this.api.post(`${this.endpoint}/${ballData.matchId}/ball-new`, ballData);
    }

    generateScorecard(matchId: number): Observable<any> {
        return this.api.get(`${this.endpoint}/${matchId}/scorecard-full`);
    }

    completeMatch(matchId: number, winnerId: number, resultNote: string): Observable<any> {
        return this.api.post(`${this.endpoint}/${matchId}/complete`, { winnerId, resultNote });
    }
}
