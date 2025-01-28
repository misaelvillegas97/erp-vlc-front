import { inject, Injectable } from '@angular/core';
import { HttpClient }         from '@angular/common/http';
import { Observable }         from 'rxjs';
import { Product }            from '@modules/admin/maintainers/products/domain/model/product';

@Injectable({providedIn: 'root'})
export class ProductsService {
    readonly #http: HttpClient = inject(HttpClient);

    findAll(query: any): Observable<Product[]> {
        return this.#http.get<Product[]>('/api/products', {params: query});
    }

    create(product: any) {
        return this.#http.post('/api/products', product);
    }

    associateClient({productId, clientId, providerCode}: any) {
        return this.#http.post(`/api/products/${ productId }/provider-code`, {clientId, providerCode});
    }
}
