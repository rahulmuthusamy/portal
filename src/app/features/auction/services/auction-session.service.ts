import { Injectable } from '@angular/core';
import { BaseCrudService } from '@core/services/base-crud.service';
import { Player } from '../models/player.model';
import { ApiService } from '@core/services/api.service';
import { Observable } from 'rxjs';

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

    /** Create session with optional UPI QR scanner image file */
    createSessionWithFile(data: any, qrFile?: File | null): Observable<any> {
        const formData = new FormData();
        Object.keys(data).forEach(key => {
            if (data[key] !== null && data[key] !== undefined) {
                formData.append(key, data[key]);
            }
        });
        if (qrFile) {
            formData.append('upiScanner', qrFile);
        }
        return this.api.post<any>(this.endpoint, formData);
    }

    /** Update session with optional UPI QR scanner image file */
    updateSessionWithFile(id: number, data: any, qrFile?: File | null): Observable<any> {
        const formData = new FormData();
        Object.keys(data).forEach(key => {
            if (data[key] !== null && data[key] !== undefined) {
                formData.append(key, data[key]);
            }
        });
        if (qrFile) {
            formData.append('upiScanner', qrFile);
        }
        return this.api.put<any>(`${this.endpoint}/${id}`, formData);
    }
}
