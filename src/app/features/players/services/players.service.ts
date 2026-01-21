import { Injectable } from '@angular/core';
import { BaseCrudService } from '@core/services/base-crud.service';
import { Player } from '../models/player.model';
import { ApiService } from '@core/services/api.service';
import { environment } from '@environments/environment';

@Injectable({
    providedIn: 'root',
})
export class PlayerService extends BaseCrudService<Player> {
    constructor(api: ApiService) {
        super(api, `${environment.apiUrl}/players`);
    }
}
