import { ApiService } from './api.service';
import { Observable } from 'rxjs';

export class BaseCrudService<T> {
    constructor(
        protected api: ApiService,
        protected endpoint: string
    ) { }

    getAll(params?: any): Observable<T[]> {
        return this.api.get<T[]>(this.endpoint, params);
    }

    getById(id: number): Observable<T> {
        return this.api.get<T>(`${this.endpoint}/${id}`);
    }

    create(data: Partial<T>): Observable<T> {
        return this.api.post<T>(this.endpoint, data);
    }

    update(id: number, data: Partial<T>): Observable<T> {
        return this.api.put<T>(`${this.endpoint}/${id}`, data);
    }

    delete(id: number): Observable<void> {
        return this.api.delete<void>(`${this.endpoint}/${id}`);
    }
}
