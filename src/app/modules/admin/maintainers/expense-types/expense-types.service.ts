import { inject, Injectable } from '@angular/core';
import { HttpClient }         from '@angular/common/http';

@Injectable({providedIn: 'root'})
export class ExpenseTypesService {
    readonly #http = inject(HttpClient);

    findAll() {
        return this.#http.get<any[]>('/api/expense-types');
    }

    create(dto: any) {
        return this.#http.post('/api/expense-types', dto);
    }

    update(id: string, dto: any) {
        return this.#http.put(`/api/expense-types/${ id }`, dto);
    }

    delete(id: string) {
        return this.#http.delete(`/api/expense-types/${ id }`);
    }

    findById(id: string) {
        return this.#http.get(`/api/expense-types/${ id }`);
    }
}
