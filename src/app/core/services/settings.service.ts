import { Injectable } from '@angular/core';
import { ApiService } from '@core/services/api.service';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class SettingsService {
    private endpoint = '/settings';

    constructor(private api: ApiService) { }

    getAppSettings(): Observable<any> {
        return this.api.get(`${this.endpoint}/app-settings`);
    }

    updateAppSettings(data: any, logoFile?: File, upiScannerFile?: File): Observable<any> {
        const formData = new FormData();
        Object.keys(data).forEach(key => formData.append(key, data[key]));
        if (logoFile) {
            formData.append('logo', logoFile);
        }
        if (upiScannerFile) {
            formData.append('upiScanner', upiScannerFile);
        }
        return this.api.put(`${this.endpoint}/app-settings`, formData);
    }

    getGallery(params?: any): Observable<any> {
        return this.api.get(`${this.endpoint}/gallery`, params);
    }

    addGalleryImage(data: any, file: File): Observable<any> {
        const formData = new FormData();
        Object.keys(data).forEach(key => formData.append(key, data[key]));
        formData.append('file', file);
        return this.api.post(`${this.endpoint}/gallery`, formData);
    }

    updateGalleryImage(id: number, data: any, file?: File): Observable<any> {
        const formData = new FormData();
        Object.keys(data).forEach(key => formData.append(key, data[key]));
        if (file) {
            formData.append('file', file);
        }
        return this.api.put(`${this.endpoint}/gallery/${id}`, formData);
    }

    deleteGalleryImage(id: number): Observable<any> {
        return this.api.delete(`${this.endpoint}/gallery/${id}`);
    }

    getCarousel(): Observable<any> {
        return this.api.get(`${this.endpoint}/carousel`);
    }

    addCarouselImage(data: any, file: File): Observable<any> {
        const formData = new FormData();
        Object.keys(data).forEach(key => formData.append(key, data[key]));
        formData.append('file', file);
        return this.api.post(`${this.endpoint}/carousel`, formData);
    }

    updateCarouselImage(id: number, data: any, file?: File): Observable<any> {
        const formData = new FormData();
        Object.keys(data).forEach(key => formData.append(key, data[key]));
        if (file) {
            formData.append('file', file);
        }
        return this.api.put(`${this.endpoint}/carousel/${id}`, formData);
    }

    deleteCarouselImage(id: number): Observable<any> {
        return this.api.delete(`${this.endpoint}/carousel/${id}`);
    }

    getSponsors(): Observable<any> {
        return this.api.get(`${this.endpoint}/sponsors`);
    }

    addSponsor(data: any, file: File): Observable<any> {
        const formData = new FormData();
        Object.keys(data).forEach(key => formData.append(key, data[key]));
        formData.append('file', file);
        return this.api.post(`${this.endpoint}/sponsors`, formData);
    }

    updateSponsor(id: number, data: any, file?: File): Observable<any> {
        const formData = new FormData();
        Object.keys(data).forEach(key => formData.append(key, data[key]));
        if (file) {
            formData.append('file', file);
        }
        return this.api.put(`${this.endpoint}/sponsors/${id}`, formData);
    }

    deleteSponsor(id: number): Observable<any> {
        return this.api.delete(`${this.endpoint}/sponsors/${id}`);
    }

    addGalleryCategory(categoryName: string): Observable<any> {
        return new Observable(observer => {
            observer.next({ success: true, category: categoryName });
            observer.complete();
        });
    }

    getPolls(): Observable<any> {
        return this.api.get('/polls');
    }

    createPoll(pollData: any): Observable<any> {
        return this.api.post('/polls', pollData);
    }

    votePoll(pollId: number, optionId: number, playerId: number): Observable<any> {
        return this.api.post(`/polls/${pollId}/vote/${optionId}`, { playerId });
    }

    getPlayers(): Observable<any> {
        return this.api.get('/players-master');
    }

    togglePollStatus(id: number): Observable<any> {
        return this.api.patch(`/polls/${id}/toggle`, {});
    }

    deletePoll(id: number): Observable<any> {
        return this.api.delete(`/polls/${id}`);
    }

    // Location Master
    getLocations(activeOnly = false): Observable<any> {
        return this.api.get(`${this.endpoint}/locations`, activeOnly ? { active: 'true' } : {});
    }

    createLocation(data: any): Observable<any> {
        return this.api.post(`${this.endpoint}/locations`, data);
    }

    updateLocation(id: number, data: any): Observable<any> {
        return this.api.put(`${this.endpoint}/locations/${id}`, data);
    }

    deleteLocation(id: number): Observable<any> {
        return this.api.delete(`${this.endpoint}/locations/${id}`);
    }
}