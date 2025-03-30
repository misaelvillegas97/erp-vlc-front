import { Component, inject, resource, signal, WritableSignal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators }        from '@angular/forms';
import { ColumnConfig }                                        from '@shared/components/table-builder/column.type';
import { TranslocoDirective, TranslocoPipe, TranslocoService } from '@ngneat/transloco';
import { Notyf }                                               from 'notyf';
import { MatFormFieldModule }                                  from '@angular/material/form-field';
import { PageHeaderComponent }                                 from '@layout/components/page-header/page-header.component';
import { MatTooltip }                                          from '@angular/material/tooltip';
import { RouterLink }                                          from '@angular/router';
import { MatIconAnchor }                                       from '@angular/material/button';
import { MatIcon }                                             from '@angular/material/icon';
import { TableBuilderComponent }                               from '@shared/components/table-builder/table-builder.component';
import { MatInput }                                            from '@angular/material/input';

@Component({
    selector   : 'app-list',
    imports    : [
        MatFormFieldModule,
        PageHeaderComponent,
        TranslocoDirective,
        MatTooltip,
        RouterLink,
        MatIconAnchor,
        MatIcon,
        ReactiveFormsModule,
        TableBuilderComponent,
        MatInput,
        TranslocoPipe,

    ],
    templateUrl: './list.component.html'
})
export class ListComponent {
    readonly #ts = inject(TranslocoService);
    readonly #notyf = new Notyf();

    searchControl = new FormControl('', [ Validators.minLength(3), Validators.maxLength(100) ]);

    // Recurso para cargar los tipos de gasto. Reemplaza la llamada simulada por la invocación a tu servicio real.
    expenseTypesResource = resource({
        request: () => this.searchControl.value || '',
        loader : ({request}): Promise<any[]> =>
            // this.expenseTypeService.findAll(request)
            new Promise(resolve => {
                resolve([
                    {id: 1, name: 'Transporte', description: 'Transporte de productos'},
                    {id: 2, name: 'Alimentación', description: 'Alimentación de empleados'},
                    {id: 3, name: 'Servicios', description: 'Servicios de limpieza'},
                ]);
            })
    });

    // Configuración de columnas para el table-builder
    columnsConfig: WritableSignal<ColumnConfig<any>[]> = signal(undefined);


    ngAfterViewInit() {
        this.columnsConfig.set(this.buildColumnsConfig());
    }

    buildColumnsConfig = (): ColumnConfig<any>[] => [
        {
            key    : 'name',
            header : this.#ts.translate('maintainers.expense-type.fields.name'),
            display: {type: 'text'},
            visible: true
        },
        {
            key    : 'description',
            header : this.#ts.translate('maintainers.expense-type.fields.description'),
            display: {
                type   : 'text',
                classes: 'text-truncate',
            },
            visible: true
        },
        {
            key    : 'actions',
            header : '',
            visible: true
        }
    ];
}
