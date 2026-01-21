import { Injectable } from '@angular/core';
import { BaseCrudService } from '@core/services/base-crud.service';
import { ApiService } from '@core/services/api.service';
import { environment } from '@environments/environment';

@Injectable({
    providedIn: 'root',
})
export class TeamsService extends BaseCrudService<any> {
    constructor(api: ApiService) {
        super(api, `${environment.apiUrl}/teams`);
    }
}
