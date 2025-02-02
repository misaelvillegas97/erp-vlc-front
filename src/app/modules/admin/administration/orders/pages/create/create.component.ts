import { Component, computed, inject, resource }                                                                from '@angular/core';
import { PageDetailHeaderComponent }                                                                            from '@shared/components/page-detail-header/page-detail-header.component';
import { TranslocoDirective, TranslocoPipe, TranslocoService }                                                  from '@ngneat/transloco';
import { MatFormFieldModule }                                                                                   from '@angular/material/form-field';
import { FormsModule, ReactiveFormsModule, UntypedFormArray, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MatInputModule }                                                                                       from '@angular/material/input';
import { OrdersService }                                                                                        from '@modules/admin/administration/orders/orders.service';
import { Router }                                                                                               from '@angular/router';
import { OrderStatusEnumValues }                                                                                from '@modules/admin/administration/orders/domain/enums/order-status.enum';
import { OrderTypeEnum }                                                                                        from '@modules/admin/administration/orders/domain/enums/order-type.enum';
import { MatAutocompleteModule }                                                                                from '@angular/material/autocomplete';
import { ClientService }                                                                                        from '@modules/admin/maintainers/clients/client.service';
import { rxResource, toSignal }                                                                                 from '@angular/core/rxjs-interop';
import { debounceTime, firstValueFrom }                                                                         from 'rxjs';
import { MatButton, MatIconButton }                                                                             from '@angular/material/button';
import { MatProgressSpinner }                                                                                   from '@angular/material/progress-spinner';
import { Selector }                                                                                             from '@shared/selectors/model/selector';
import { displayWithFn }                                                                                        from '@core/utils';
import { Client }                                                                                               from '@modules/admin/maintainers/clients/domain/model/client';
import { MatDatepickerModule }                                                                                  from '@angular/material/datepicker';
import { ProductsService }                                                                                      from '@modules/admin/maintainers/products/products.service';
import { Product }                                                                                              from '@modules/admin/maintainers/products/domain/model/product';
import { MatIcon }                                                                                              from '@angular/material/icon';
import { MatTableModule }                                                                                       from '@angular/material/table';
import { trackByFn }                                                                                            from '@libs/ui/utils/utils';
import { CurrencyPipe }                                                                                         from '@angular/common';
import { ClientAddress, ClientAddressMapper }                                                                   from '@modules/admin/maintainers/clients/domain/model/client-address';
import { OpenStreetMapService }                                                                                 from '@shared/services/open-street-map.service';

@Component({
    selector   : 'app-create',
    imports: [
        PageDetailHeaderComponent,
        TranslocoDirective,
        TranslocoPipe,
        MatFormFieldModule,
        ReactiveFormsModule,
        MatInputModule,
        MatAutocompleteModule,
        MatDatepickerModule,
        MatButton,
        MatProgressSpinner,
        MatIcon,
        FormsModule,
        MatTableModule,
        MatIconButton,
        CurrencyPipe
    ],
    templateUrl: './create.component.html'
})
export class CreateComponent {
    readonly #fb = inject(UntypedFormBuilder);
    readonly #router = inject(Router);
    readonly #translationService = inject(TranslocoService);
    readonly #ordersService = inject(OrdersService);
    readonly #clientService = inject(ClientService);
    readonly #productsService = inject(ProductsService);
    readonly #osmService = inject(OpenStreetMapService);

    form: UntypedFormGroup = this.#fb.group({
        client          : [ '', [ Validators.required ] ],
        status          : [ OrderStatusEnumValues[0], [ Validators.required ] ],
        type            : [ OrderTypeEnum.PURCHASE_ORDER, [ Validators.required ] ],
        deliveryDate    : [ undefined, [ Validators.required ] ],
        deliveryLocation: [ '', [ Validators.required ] ],
        productInput    : [ '' ],
        products        : this.#fb.array([], [ Validators.required ])
    });

    // Clients
    readonly clientInput = toSignal(this.form.get('client').valueChanges.pipe(debounceTime(1_000)));
    readonly clientsResource = rxResource({
        request: () => this.clientInput() || '',
        loader : ({request, abortSignal}) => {
            if (!request) return this.#clientService.findAll({});
            if (typeof request === 'object') return this.#clientService.findAll({});

            return this.#clientService.findAll({fantasyName: request});
        },
    });

    // Client addresses
    readonly deliveryLocationInput = toSignal(this.form.get('deliveryLocation').valueChanges.pipe(debounceTime(1_000)));
    readonly deliveryLocationResource = resource<ClientAddress[], any>({
        request: () => ({client: this.clientInput(), address: this.deliveryLocationInput()}),
        loader : async ({request}) => {
            console.log('request', request);
            if (!request.client || typeof request.client !== 'object' || !request.client?.address) return [];

            const addresses = request.client.address;

            if (!request.address) return addresses;

            const filteredAddresses = addresses.filter((address) => address.street.toLowerCase().includes(request.address.toLowerCase()));

            if (filteredAddresses && filteredAddresses.length > 0) return addresses;

            const address = await firstValueFrom(this.#osmService.search(request.address));

            if (!address) return [];

            return ClientAddressMapper.mapFromPlaceArray(address);
        },
    });

    // Status
    readonly statusInput = toSignal(this.form.get('status').valueChanges.pipe(debounceTime(300)));
    readonly statusResource = resource({
        request: () => this.statusInput() || '',
        loader : async ({request}) => {
            if (!request) return OrderStatusEnumValues;
            return OrderStatusEnumValues.filter((status) => status.label.toLowerCase().includes(request.toLowerCase()));
        },
    });

    // Products
    readonly productsInput = toSignal(this.form.get('productInput').valueChanges.pipe(debounceTime(300)));
    readonly selectedProducts = toSignal(this.form.get('products').valueChanges);
    readonly productsResource = rxResource({
        request: () => this.productsInput() || '',
        loader : ({request}) => {
            if (!request) return this.#productsService.findAll({});

            return this.#productsService.findAll({name: request});
        }
    });
    readonly productsTotal = computed(() => {
        const selectedProducts = this.selectedProducts();
        let subtotal: number = 0,
            iva: number = 0,
            total: number = 0;

        console.log('selectedProducts', selectedProducts);

        if (!selectedProducts?.length) return {subtotal, iva, total};

        subtotal = selectedProducts.reduce((acc, product) => acc + (product.quantity * product.unitaryPrice), 0);
        iva = subtotal * 0.19;
        total = subtotal + iva;

        return {subtotal, iva, total};
    });

    // Display functions
    protected readonly displayWithSelectorFn = displayWithFn<Selector>('label');
    protected readonly displayClientWithFn = displayWithFn<Client>('fantasyName');
    protected readonly displayProductWithFn = displayWithFn<Product>('name');
    protected readonly trackByFn = trackByFn;

    addProduct(product: Product) {
        const productFormArray = this.form.get('products') as UntypedFormArray;

        productFormArray.push(this.#fb.group({
            id          : [ product.id, [ Validators.required ] ],
            name        : [ product.name, [ Validators.required ] ],
            upcCode     : [ product.upcCode, [ Validators.required ] ],
            quantity    : [ 1, [ Validators.required ] ],
            unitaryPrice: [ product.unitaryPrice, [ Validators.required ] ]
        }));

        this.form.get('productInput').reset();
    }

    removeProduct(product: any) {
        console.log('product', product);
    }

    submit() {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        this.form.disable();

        setTimeout(() => {
            this.form.enable();
        }, 5000);
    }

    protected readonly displayWithFn = displayWithFn<ClientAddress>('street');
}
