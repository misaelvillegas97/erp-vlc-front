import { inject, Injectable } from '@angular/core';
import { HttpClient }         from '@angular/common/http';

@Injectable({providedIn: 'root'})
export class ProductsService {
    readonly #http: HttpClient = inject(HttpClient);

    findAll() {
        return this.#http.get('/api/products');
    }

    create(product: any) {
        return this.#http.post('/api/products', product);
    }
}
