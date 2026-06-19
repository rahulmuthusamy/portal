import { Injectable } from '@angular/core';
import { BaseCrudService } from '@core/services/base-crud.service';
import { Player } from '../models/player.model';
import { ApiService } from '@core/services/api.service';

@Injectable({
    providedIn: 'root',
})
export class AuctionSessionService extends BaseCrudService<Player> {
    constructor(api: ApiService) {
        super(api, '/sessions');
    }

    getAuctionList() {
        return this.api.get('/sessions/upcoming');
    }
}
