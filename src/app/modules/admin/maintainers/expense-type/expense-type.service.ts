import { inject, Injectable } from '@angular/core';
import { HttpClient }         from '@angular/common/http';

@Injectable({providedIn: 'root'})
export class ExpenseTypeService {
    readonly #http = inject(HttpClient);

    findAll() {
        return this.#http.get<any[]>('/api/expense-type');
    }

    create(dto: any) {
        return this.#http.post('/api/expense-type', dto);
    }

    update(id: string, dto: any) {
        return this.#http.put(`/api/expense-type/${ id }`, dto);
    }

    delete(id: string) {
        return this.#http.delete(`/api/expense-type/${ id }`);
    }

    findById(id: string) {
        return this.#http.get(`/api/expense-type/${ id }`);
    }
}
