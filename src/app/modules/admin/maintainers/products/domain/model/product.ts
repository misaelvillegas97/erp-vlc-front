import { ProductsClient } from '@modules/admin/maintainers/products/domain/model/products-client';

export interface Product {
    id: string;
    upcCode: string;
    name: string;
    description?: string;
    unitaryPrice: number;
    providerCodes?: ProductsClient[];
}
