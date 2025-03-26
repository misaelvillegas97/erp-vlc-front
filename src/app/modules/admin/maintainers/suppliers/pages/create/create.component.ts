import { Component, inject }                                                    from '@angular/core';
import { TranslocoDirective, TranslocoPipe, TranslocoService }                  from '@ngneat/transloco';
import { PageDetailHeaderComponent }                                            from '@shared/components/page-detail-header/page-detail-header.component';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router }                                                               from '@angular/router';
import { Notyf }                                                                from 'notyf';
import { SupplierTypeEnum }                                                     from '@modules/admin/maintainers/suppliers/domain/enums/supplier-type.enum';
import { SupplierTaxCategoryEnum }                                              from '@modules/admin/maintainers/suppliers/domain/enums/supplier-tax-category.enum';
import { MatFormFieldModule }                                                   from '@angular/material/form-field';
import { MatInput }                                                             from '@angular/material/input';

@Component({
    selector   : 'app-create',
    imports: [
        TranslocoDirective,
        PageDetailHeaderComponent,
        ReactiveFormsModule,
        MatFormFieldModule,
        TranslocoPipe,
        MatInput
    ],
    templateUrl: './create.component.html'
})
export class CreateComponent {
    readonly #fb = inject(FormBuilder);
    form: FormGroup = this.#fb.group({
        rut         : new FormControl<string>(undefined, [ Validators.required ]), //*
        businessName: new FormControl<string>(undefined, [ Validators.required ]), //*
        fantasyName : new FormControl<string>(undefined, [ Validators.required ]), //*
        type            : new FormControl<SupplierTypeEnum>(SupplierTypeEnum.JURIDICA, [ Validators.required ]),
        taxCategory     : new FormControl<SupplierTaxCategoryEnum>(SupplierTaxCategoryEnum.PRIMERA_CATEGORIA, [ Validators.required ]),
        siiCode         : new FormControl<string>(undefined),
        economicActivity: new FormControl<string>(undefined),
        address     : new FormControl<string>(undefined), //*
        commune         : new FormControl<string>(undefined),
        city        : new FormControl<string>(undefined), //*
        phone       : new FormControl<string>(undefined), //*
        email       : new FormControl<string>(undefined, [ Validators.email, Validators.required ]), //*
        contactPerson   : new FormControl<string>(undefined),
        contactPhone    : new FormControl<string>(undefined),
        isActive        : new FormControl<boolean>(true),
        notes           : new FormControl<string>(undefined),
        tags            : new FormControl<string[]>(undefined),
        paymentTermDays : new FormControl<number>(undefined, [ Validators.required ]),
    });
    readonly #router = inject(Router);
    readonly #ts = inject(TranslocoService);
    readonly #notyf = new Notyf();
}
