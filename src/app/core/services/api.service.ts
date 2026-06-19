import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
    providedIn: 'root',
})
export class ApiService {
    private baseUrl = environment.apiUrl;

    constructor(private http: HttpClient) { }

    private normalizeOptions(optionsOrParams?: any): any {
        if (!optionsOrParams) {
            return {};
        }

        const isOptionsObject =
            optionsOrParams.params !== undefined ||
            optionsOrParams.headers !== undefined ||
            optionsOrParams.withCredentials !== undefined;

        return isOptionsObject
            ? optionsOrParams
            : { params: optionsOrParams };
    }

    get<T>(url: string, paramsOrOptions?: any): Observable<T> {
        const fullUrl = url.startsWith('http') ? url : `${this.baseUrl}${url}`;
        const options = this.normalizeOptions(paramsOrOptions);
        return this.http.get<any>(fullUrl, options as any) as Observable<T>;
    }

    post<T>(url: string, body: any, optionsOrParams?: any): Observable<T> {
        const fullUrl = url.startsWith('http') ? url : `${this.baseUrl}${url}`;
        const options = this.normalizeOptions(optionsOrParams);
        return this.http.post<any>(fullUrl, body, options as any) as Observable<T>;
    }

    put<T>(url: string, body: any): Observable<T> {
        const fullUrl = url.startsWith('http') ? url : `${this.baseUrl}${url}`;
        return this.http.put<any>(fullUrl, body) as Observable<T>;
    }

    delete<T>(url: string): Observable<T> {
        const fullUrl = url.startsWith('http') ? url : `${this.baseUrl}${url}`;
        return this.http.delete<any>(fullUrl) as Observable<T>;
    }

    patch<T>(url: string, body: any): Observable<T> {
        const fullUrl = url.startsWith('http') ? url : `${this.baseUrl}${url}`;
        return this.http.patch<any>(fullUrl, body) as Observable<T>;
    }
}
