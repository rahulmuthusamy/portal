import { Injectable } from '@angular/core';
import { BaseCrudService } from '@core/services/base-crud.service';
import { ApiService } from '@core/services/api.service';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class TeamsService extends BaseCrudService<any> {
    constructor(api: ApiService) {
        super(api, '/teams');
    }

    addPlayerToTeam(teamId: number, playerId: number): Observable<any> {
        return this.api.post(`${this.endpoint}/${teamId}/players`, { playerId });
    }

    removePlayerFromTeam(teamId: number, playerId: number): Observable<any> {
        return this.api.delete(`${this.endpoint}/${teamId}/players/${playerId}`);
    }

    getTeamPlayers(teamId: number): Observable<any> {
        return this.api.get(`${this.endpoint}/${teamId}/players`);
    }

    getAvailablePlayers(): Observable<any> {
        return this.api.get(`${this.endpoint}/players/available`);
    }
}
