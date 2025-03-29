import { Component, computed, inject, Signal }                                  from '@angular/core';
import { TranslocoDirective, TranslocoPipe, TranslocoService }                  from '@ngneat/transloco';
import { PageDetailHeaderComponent }                                            from '@shared/components/page-detail-header/page-detail-header.component';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router }                                                               from '@angular/router';
import { Notyf }                                                                from 'notyf';
import { SupplierTypeEnum }                                                     from '@modules/admin/maintainers/suppliers/domain/enums/supplier-type.enum';
import { MatFormFieldModule }                                                   from '@angular/material/form-field';
import { MatInput }                                                             from '@angular/material/input';
import { MatSelectModule }                                                      from '@angular/material/select';
import { CdkTextareaAutosize }                                                  from '@angular/cdk/text-field';
import { MatChipInputEvent, MatChipsModule }                                    from '@angular/material/chips';
import communes                                                                 from 'assets/json/comunas.json';
import { MatAutocomplete, MatAutocompleteTrigger }                              from '@angular/material/autocomplete';
import { displayWithFn }                                                        from '@core/utils';
import { MatButton }                                                            from '@angular/material/button';
import { SupplierMapper }                                                       from '@modules/admin/maintainers/suppliers/domain/model/supplier';
import { MatProgressSpinner }                                                   from '@angular/material/progress-spinner';
import { Commune }                                                              from '@shared/models/comune';
import { firstValueFrom }                                                       from 'rxjs';
import { SuppliersService }                                                     from '@modules/admin/maintainers/suppliers/suppliers.service';
import { UpperCasePipe }                                                        from '@angular/common';
import { fuseAnimations }                                                       from '../../../../../../../@fuse/animations';

@Component({
    selector   : 'app-create',
    imports   : [
        TranslocoDirective,
        PageDetailHeaderComponent,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatSelectModule,
        TranslocoPipe,
        MatInput,
        CdkTextareaAutosize,
        MatChipsModule,
        MatAutocomplete,
        MatAutocompleteTrigger,
        MatButton,
        MatProgressSpinner,
        UpperCasePipe
    ],
    templateUrl: './create.component.html',
    animations: fuseAnimations,
})
export class CreateComponent {
    readonly #fb = inject(FormBuilder);
    readonly #ts = inject(TranslocoService);
    readonly #service = inject(SuppliersService);
    readonly #router = inject(Router);
    readonly #notyf = new Notyf();

    sortedCommunes: Signal<Commune[]> = computed((): Commune[] => communes.sort((a: Commune, b: Commune) => a.name.localeCompare(b.name)));
    // Required fields: rut, businessName, fantasyName, email, paymentTermDays, type
    // Optional fields: economicActivity, address, phone, city, contactPerson, contactPhone, isActive, notes, tags
    form: FormGroup = this.#fb.group({
        rut            : new FormControl<string>(undefined, [ Validators.required ]),
        businessName   : new FormControl<string>(undefined, [ Validators.required ]),
        fantasyName    : new FormControl<string>(undefined, [ Validators.required ]),
        type            : new FormControl<SupplierTypeEnum>(SupplierTypeEnum.JURIDICA, [ Validators.required ]),
        economicActivity: new FormControl<string>(undefined),
        address        : new FormControl<string>(undefined),
        city           : new FormControl<string>(undefined),
        phone          : new FormControl<string>(undefined),
        email          : new FormControl<string>(undefined, [ Validators.email, Validators.required ]),
        contactPerson   : new FormControl<string>(undefined),
        contactPhone    : new FormControl<string>(undefined),
        isActive       : new FormControl<boolean>({value: true, disabled: true}),
        notes           : new FormControl<string>(undefined),
        tags            : new FormControl<string[]>(undefined),
        paymentTermDays: new FormControl<number>(undefined, [ Validators.required, Validators.min(1) ]),
    });
    filteredCities: any[] = this.sortedCommunes();

    cityControl = new FormControl<string>(undefined);
    tagsControl = new FormControl<string>(undefined);
    separatorKeysCodes: number[] = [ 188, 13, 9 ];

    protected readonly SupplierTypeEnums = Object.values(SupplierTypeEnum);

    addTag = ($event: MatChipInputEvent) => {
        const input = $event.input;
        const value = $event.value;

        if ((value || '').trim()) {
            this.form.patchValue({
                tags: [ ...(this.form.value.tags || []), value.trim() ]
            });
        }

        if (input) {
            input.value = '';
        }
    };

    removeTag = (tag: string) => {
        const tags = this.form.value.tags || [];
        const index = tags.indexOf(tag);

        if (index >= 0) {
            tags.splice(index, 1);
            this.form.patchValue({tags});
        }
    };
    protected readonly displayWithFn = displayWithFn('name');

    onCitySelected = (event: any) => {
        const selectedCity = event.option.value;
        this.form.patchValue({city: selectedCity});
    };

    onCityInput = (event: any) => {
        event.stopPropagation();
        const inputValue = event.target.value;

        this.filteredCities = this.sortedCommunes().filter((city: any) =>
            city.name.toLowerCase().includes(inputValue.toLowerCase())
        );

        if (this.filteredCities.length === 0) {
            this.filteredCities = this.sortedCommunes();
        }

        if (inputValue === '') {
            this.filteredCities = this.sortedCommunes();
        }
    };

    submit = async () => {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            this.#notyf.error(this.#ts.translate('errors.form.invalid'));
            return;
        }

        this.form.disable();

        const formValue = SupplierMapper.fromForm(this.form.getRawValue());

        await firstValueFrom(this.#service.post(formValue))
            .then(() => this.#notyf.success(this.#ts.translate('notyf-modal.create.success')))
            .then(() => this.#router.navigate([ 'maintainers', 'suppliers' ]))
            .catch(() => this.form.enable())
            .catch(() => this.#notyf.error(this.#ts.translate('notyf-modal.create.error')));
    };
}
