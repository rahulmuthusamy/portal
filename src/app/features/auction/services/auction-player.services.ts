import { Injectable } from '@angular/core';
import { BaseCrudService } from '@core/services/base-crud.service';
import { Player } from '../models/player.model';
import { ApiService } from '@core/services/api.service';

@Injectable({
    providedIn: 'root',
})
export class AuctionPlayerService extends BaseCrudService<Player> {
    constructor(api: ApiService) {
        super(api, '/auctionPlayer');
    }
}
