import { Component, inject, resource, signal, WritableSignal } from '@angular/core';
import { MatIcon }                                             from '@angular/material/icon';
import { MatIconAnchor }                                       from '@angular/material/button';
import { MatTooltip }                                          from '@angular/material/tooltip';
import { RouterLink }                                          from '@angular/router';

import { TranslocoDirective, TranslocoService } from '@ngneat/transloco';
import { firstValueFrom }                       from 'rxjs';

import { PageHeaderComponent }   from '@layout/components/page-header/page-header.component';
import { SuppliersService }      from '@modules/admin/maintainers/suppliers/suppliers.service';
import { ColumnConfig }          from '@shared/components/table-builder/column.type';
import { TableBuilderComponent } from '@shared/components/table-builder/table-builder.component';
import { Supplier }              from '@modules/admin/maintainers/suppliers/domain/model/supplier';

@Component({
    selector   : 'app-list',
    imports    : [
        MatIcon,
        MatIconAnchor,
        PageHeaderComponent,
        TranslocoDirective,
        TableBuilderComponent,
        MatTooltip,
        RouterLink
    ],
    templateUrl: './list.component.html'
})
export class ListComponent {
    columnsConfig: WritableSignal<ColumnConfig<Supplier>[]> = signal(undefined);
    readonly #ts = inject(TranslocoService);
    readonly #supplierService = inject(SuppliersService);
    supplierResource = resource({
        params: () => '',
        loader: ({params}) => firstValueFrom(this.#supplierService.findAll(params))
    });

    ngOnInit() {
        this.columnsConfig.set(this.buildColumnsConfig());
    }

    buildColumnsConfig = (): ColumnConfig<Supplier>[] => ([
        {
            key    : 'rut',
            header : this.#ts.translate('maintainers.suppliers.fields.rut'),
            visible: true,
        },
        {
            key    : 'businessName',
            header : this.#ts.translate('maintainers.suppliers.fields.business-name'),
            visible: true,
        },
        {
            key    : 'fantasyName',
            header : this.#ts.translate('maintainers.suppliers.fields.fantasy-name'),
            visible: true,
        },
        {
            key    : 'type',
            header : this.#ts.translate('maintainers.suppliers.fields.type'),
            visible: true,
        },
        {
            key    : 'isActive',
            header : this.#ts.translate('maintainers.suppliers.fields.is-active'),
            visible: true,
        },
        {
            key    : 'phone',
            header : this.#ts.translate('maintainers.suppliers.fields.phone'),
            visible: true,
        },
        {
            key    : 'email',
            header : this.#ts.translate('maintainers.suppliers.fields.email'),
            visible: true,
        }
    ]);
}
