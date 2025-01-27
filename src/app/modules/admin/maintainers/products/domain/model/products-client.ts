import { Client }  from '@modules/admin/maintainers/clients/domain/model/client';
import { Product } from '@modules/admin/maintainers/products/domain/model/product';

export interface ProductsClient {
    id: string;
    providerCode: number;
    client: Client;
    product: Product;
}
