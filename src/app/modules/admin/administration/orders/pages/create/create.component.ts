import { Component, computed, inject, resource }                                                                from '@angular/core';
import { PageDetailHeaderComponent }                                                                            from '@shared/components/page-detail-header/page-detail-header.component';
import { TranslocoDirective, TranslocoPipe, TranslocoService }                                                  from '@ngneat/transloco';
import { MatFormFieldModule }                                                                                   from '@angular/material/form-field';
import { FormsModule, ReactiveFormsModule, UntypedFormArray, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MatInputModule }                                                                                       from '@angular/material/input';
import { OrdersService }                                                                                        from '@modules/admin/administration/orders/orders.service';
import { Router }                                                                                               from '@angular/router';
import { OrderStatusEnum }                                                                                      from '@modules/admin/administration/orders/domain/enums/order-status.enum';
import { OrderTypeEnum }                                                                                        from '@modules/admin/administration/orders/domain/enums/order-type.enum';
import { MatAutocompleteModule }                                                                                from '@angular/material/autocomplete';
import { ClientService }                                                                                        from '@modules/admin/maintainers/clients/client.service';
import { toSignal }                                                                                             from '@angular/core/rxjs-interop';
import { debounceTime, firstValueFrom }                                                                         from 'rxjs';
import { MatButton, MatIconButton }                                                                             from '@angular/material/button';
import { MatProgressSpinner }                                                                                   from '@angular/material/progress-spinner';
import { displayWithFn, displayWithTranslationFn }                                                              from '@core/utils';
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

    readonly allowedOrderStatuses = [ OrderStatusEnum.CREATED, OrderStatusEnum.IN_PROGRESS, OrderStatusEnum.PENDING_DELIVERY ];

    form: UntypedFormGroup = this.#fb.group({
        client          : [ '', [ Validators.required ] ],
        status      : [ OrderStatusEnum.CREATED, [ Validators.required ] ],
        type            : [ OrderTypeEnum.PURCHASE_ORDER, [ Validators.required ] ],
        deliveryDate: [ {value: undefined, disabled: true}, [ Validators.required ] ],
        deliveryLocation: [ '', [ Validators.required ] ],
        productInput    : [ '' ],
        products    : this.#fb.array([], [ Validators.required ]),
        observations: [ undefined ],
    });

    // Clients
    readonly clientInput = toSignal(this.form.get('client').valueChanges.pipe(debounceTime(1_000)));
    readonly clientsResource = resource({
        loader: () => {
            const request = this.clientInput() || '';
            if (!request) return firstValueFrom(this.#clientService.findAll({}));
            if (typeof request === 'object') return firstValueFrom(this.#clientService.findAll({}));

            return firstValueFrom(this.#clientService.findAll({fantasyName: request}));
        },
    });

    // Client addresses
    readonly deliveryLocationInput = toSignal(this.form.get('deliveryLocation').valueChanges.pipe(debounceTime(1_000)));
    readonly deliveryLocationResource = resource<ClientAddress[], unknown>({
        loader: async () => {
            const client = this.clientInput();
            const address = this.deliveryLocationInput();

            if (!client || typeof client !== 'object' || !client?.address) return [];

            const addresses = client.address;

            if (!address) return addresses;

            const filteredAddresses = addresses.filter((addr) => addr.street.toLowerCase().includes(address.toLowerCase()));

            if (filteredAddresses && filteredAddresses.length > 0) return filteredAddresses;

            const osmAddress = await firstValueFrom(this.#osmService.search(address));

            if (!osmAddress) return [];

            return ClientAddressMapper.mapFromPlaceArray(osmAddress);
        },
    });

    // Status
    readonly statusInput = toSignal(this.form.get('status').valueChanges.pipe(debounceTime(300)));
    readonly statusResource = resource<OrderStatusEnum[], unknown>({
        loader: async () => {
            const request = this.statusInput() || '';
            if (!request) return this.allowedOrderStatuses;
            return this.allowedOrderStatuses.filter((status) =>
                this.#translationService.translate(`enums.order-status.${ status }`)
                    .toLowerCase()
                    .includes(request.toLowerCase())
            );
        },
    });

    // Products
    readonly productsInput = toSignal(this.form.get('productInput').valueChanges.pipe(debounceTime(300)));
    readonly selectedProducts = toSignal(this.form.get('products').valueChanges);
    readonly productsResource = resource({
        loader: () => {
            const request = this.productsInput() || '';
            if (!request) return firstValueFrom(this.#productsService.findAll({}));

            return firstValueFrom(this.#productsService.findAll({name: request}));
        }
    });
    readonly productsTotal = computed(() => {
        const selectedProducts = this.selectedProducts();
        let subtotal: number = 0,
            iva: number = 0,
            total: number = 0;

        if (!selectedProducts?.length) return {subtotal, iva, total};

        subtotal = selectedProducts.reduce((acc, product) => acc + (product.quantity * product.unitaryPrice), 0);
        iva = subtotal * 0.19;
        total = subtotal + iva;

        return {subtotal, iva, total};
    });

    // Display functions
    protected readonly displayClientWithFn = displayWithFn<Client>('fantasyName');
    protected readonly displayProductWithFn = displayWithFn<Product>('name');
    protected readonly trackByFn = trackByFn;
    protected readonly displayWithTranslationFn = displayWithTranslationFn<string>(this.#translationService, 'enums.order-status.');

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

        const order = this.form.getRawValue();

        const parsedData = {
            clientId        : order.client.id,
            type            : order.type,
            status          : order.status,
            deliveryLocation: order.deliveryLocation,
            deliveryDate    : order.deliveryDate.toISODate(),
            products        : order.products.map((product) => ({
                id          : product.id,
                upcCode     : product.upcCode,
                description : product.name,
                quantity    : product.quantity,
                unitaryPrice: product.unitaryPrice,
                totalPrice  : product.quantity * product.unitaryPrice
            })),
            observations    : order.observations,
        };

        firstValueFrom(this.#ordersService.create(parsedData))
            .then(() => this.#router.navigate([ '/operations/orders/list' ]))
            .catch((error) => {
                console.error('Error creating order', error);
                this.form.enable();
            });

        setTimeout(() => {
            this.form.enable();
        }, 5000);
    }
}
