import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class OnboardingService {
    private endpoint = '/onboarding';

    constructor(private api: ApiService) { }

    getPendingOwners(): Observable<any> {
        return this.api.get(`${this.endpoint}/admin/owners`);
    }

    verifyOwner(ownerId: number, status: 'approved' | 'rejected'): Observable<any> {
        return this.api.post(`${this.endpoint}/admin/owners/${ownerId}/verify`, { status });
    }

    submitPlayerDocs(documentType: string, docFile: File): Observable<any> {
        const formData = new FormData();
        formData.append('documentType', documentType);
        formData.append('document', docFile);
        return this.api.post(`${this.endpoint}/player/documents`, formData);
    }

    getPendingPayments(): Observable<any> {
        return this.api.get(`${this.endpoint}/admin/payments`);
    }

    verifyPayment(paymentId: number, status: 'verified' | 'rejected'): Observable<any> {
        return this.api.post(`${this.endpoint}/admin/payments/${paymentId}/verify`, { status });
    }

    getPendingPlayers(): Observable<any> {
        return this.api.get(`${this.endpoint}/admin/players`);
    }

    verifyPlayer(playerId: number, status: 'verified' | 'rejected', notes?: string): Observable<any> {
        return this.api.post(`${this.endpoint}/admin/players/${playerId}/verify`, { status, notes });
    }

    registerTeam(payload: any): Observable<any> {
        return this.api.post(`${this.endpoint}/public/register-team`, payload);
    }

    registerPlayerForAuction(payload: any): Observable<any> {
        return this.api.post(`${this.endpoint}/public/register-player`, payload);
    }

    getOwnerDashboard(): Observable<any> {
        return this.api.get(`${this.endpoint}/owner/dashboard`);
    }
}