import { Injectable } from '@angular/core';
import { ApiService } from '@core/services/api.service';
import { BaseCrudService } from '@core/services/base-crud.service';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class TournamentService extends BaseCrudService<any> {
    constructor(api: ApiService) {
        super(api, '/tournaments');
    }

    getPointsTable(tournamentId: number): Observable<any> {
        return this.api.get(`${this.endpoint}/${tournamentId}/points-table`);
    }

    getTournamentMatches(tournamentId: number): Observable<any> {
        return this.api.get(`/matches?TournamentID=${tournamentId}`);
    }

    generateFixtures(tournamentId: number): Observable<any> {
        return this.api.post(`${this.endpoint}/${tournamentId}/fixtures/generate`, {});
    }

    closeRegistration(tournamentId: number): Observable<any> {
        return this.api.patch(`${this.endpoint}/${tournamentId}/registration/close`, {});
    }

    getStandings(tournamentId: number): Observable<any> {
        return this.api.get(`${this.endpoint}/${tournamentId}/standings`);
    }

    getStats(tournamentId: number): Observable<any> {
        return this.api.get(`${this.endpoint}/${tournamentId}/stats`);
    }

    registerTeam(tournamentId: number, teamId: number): Observable<any> {
        return this.api.post(`${this.endpoint}/${tournamentId}/register-team`, { teamId });
    }

    getStandingsNew(tournamentId: number): Observable<any> {
        return this.api.get(`${this.endpoint}/${tournamentId}/standings-new`);
    }

    getRegisteredTeams(tournamentId: number): Observable<any> {
        return this.api.get(`${this.endpoint}/${tournamentId}/registered-teams`);
    }

    getTournamentMatchesNew(tournamentId: number): Observable<any> {
        return this.api.get(`${this.endpoint}/${tournamentId}/matches`);
    }

    generateFixturesNew(tournamentId: number): Observable<any> {
        return this.api.post(`${this.endpoint}/${tournamentId}/generate-fixtures`, {});
    }
}
