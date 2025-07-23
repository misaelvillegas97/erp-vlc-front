import { NgIf }                                                                                                 from '@angular/common';
import { Component, inject, resource, ResourceRef }                                                             from '@angular/core';
import { FormsModule, ReactiveFormsModule, UntypedFormArray, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MatButton, MatIconButton }                                                                             from '@angular/material/button';
import { MatError, MatFormFieldModule, MatLabel }                                                               from '@angular/material/form-field';
import { MatInput }                                                                                             from '@angular/material/input';
import { MatProgressSpinner }                                                                                   from '@angular/material/progress-spinner';
import { Router }                                                                                               from '@angular/router';

import { TranslocoDirective, TranslocoPipe, TranslocoService } from '@ngneat/transloco';
import { INotyfNotificationOptions, Notyf }                    from 'notyf';
import { PageDetailHeaderComponent }                           from '@shared/components/page-detail-header/page-detail-header.component';
import { ClientService }                                       from '@modules/admin/maintainers/clients/client.service';
import { toSignal }                                            from '@angular/core/rxjs-interop';
import { debounceTime, firstValueFrom }                        from 'rxjs';
import { OpenStreetMapService }                                from '@shared/services/open-street-map.service';
import { MatAutocomplete, MatAutocompleteTrigger, MatOption }  from '@angular/material/autocomplete';
import { ReadablePlace }                                       from '@shared/domain/model/place';
import { displayWithFn }                                       from '@core/utils';
import { MatLine }                                             from '@angular/material/core';
import { MatIcon }                                             from '@angular/material/icon';
import { MatTooltip }                                          from '@angular/material/tooltip';
import { ClientAddress }                                       from '@modules/admin/maintainers/clients/domain/model/client-address';
import { MatCheckbox }                                         from '@angular/material/checkbox';

@Component({
    selector   : 'app-create',
    standalone : true,
    imports: [
        PageDetailHeaderComponent,
        TranslocoDirective,
        FormsModule,
        MatButton,
        MatError,
        MatFormFieldModule,
        MatInput,
        MatLabel,
        MatProgressSpinner,
        NgIf,
        ReactiveFormsModule,
        TranslocoPipe,
        MatAutocomplete,
        MatOption,
        MatAutocompleteTrigger,
        MatLine,
        MatIconButton,
        MatIcon,
        MatTooltip,
        MatCheckbox
    ],
    templateUrl: './create.component.html',
    styles     : `
        :host {
            height: 100%;
        }
    `
})
export class CreateComponent {
    readonly #fb = inject(UntypedFormBuilder);
    readonly #router = inject(Router);
    readonly #translateService = inject(TranslocoService);
    readonly #clientService = inject(ClientService);
    readonly #osmService = inject(OpenStreetMapService);
    readonly #notyf = new Notyf();

    form: UntypedFormGroup = this.#fb.group({
        businessName : [ '', [ Validators.required ] ],
        fantasyName  : [ '', [ Validators.required ] ],
        code         : [ '', [] ],
        nationalId   : [ '', [ Validators.required ] ],
        email        : [ '', [ Validators.required, Validators.email ] ],
        phoneNumber  : [ '', [ Validators.required ] ],
        addressSearch: [ '', [] ],
        address  : this.#fb.array([]),
        deletable: [ true, [] ]
    });

    // Address
    readonly addressInput = toSignal(this.form.get('addressSearch').valueChanges.pipe(debounceTime(500)));
    readonly addressResource: ResourceRef<ReadablePlace[]> = resource<ReadablePlace[], string>({
        params: () => this.addressInput() || '',
        loader: async ({params}) => {
            if (!params) return [];

            const places = await firstValueFrom(this.#osmService.search(params));

            const readablePlaces: ReadablePlace[] = places.map((place) => ({
                address: `${ place.address.road }${ place.address.house_number ? ' #' + place.address.house_number : '' }, ${ place.address.city ?? place.address.town }, ${ place.address.state }, ${ place.address.country }`,
                postcode: place.address.postcode,
                lat     : place.lat,
                lon     : place.lon,
                location: place.address
            }));

            return readablePlaces;
        }
    });

    // Display
    protected readonly displayWithFn = displayWithFn<ReadablePlace>('address');

    addAddress(place: ReadablePlace) {
        const array = this.form.get('address') as UntypedFormArray;
        array.push(this.#fb.group({
            street: [ place.address ],
            city  : [ place.location.city || place.location.town ],
            lat   : [ place.lat ],
            long  : [ place.lon ]
        }));

        this.form.get('addressSearch').setValue('');
    }

    removeAddress(index: number) {
        const array = this.form.get('address') as UntypedFormArray;
        array.removeAt(index);
    }

    openInGmaps(place: ClientAddress) {
        window.open(`https://www.google.com/maps/search/?api=1&query=${ place.lat },${ place.long }`, '_blank');
    }

    submit() {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            this.#notyf.error({message: this.#translateService.translate('errors.validation.message'), ...this.notyfOptions()});
            return;
        }

        this.form.disable();

        this.#clientService
            .post(this.form.getRawValue())
            .subscribe({
                next : (result) => {
                    this.#notyf.success({message: this.#translateService.translate('maintainers.client.new.success'), ...this.notyfOptions()});
                    this.#router.navigate([ '/maintainers', 'clients' ]);
                },
                error: (error) => {
                    this.#notyf.error({message: this.#translateService.translate('errors.service.message')});
                    this.form.enable();
                }
            });
    }

    private notyfOptions = (): Partial<INotyfNotificationOptions> => ({
        duration   : 5000,
        ripple     : true,
        position   : {x: 'right', y: 'top'},
        dismissible: true
    });

    private addressGroupBuilder = (): UntypedFormGroup => this.#fb.group({
        street: [ undefined, [ Validators.required ] ],
        city  : [ undefined, [ Validators.required ] ],
        lat   : [ undefined, [ Validators.required ] ],
        long  : [ undefined, [ Validators.required ] ]
    });
}
