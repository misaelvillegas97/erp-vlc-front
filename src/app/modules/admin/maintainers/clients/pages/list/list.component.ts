import { Component, inject, resource, signal, Signal, TemplateRef, viewChild, WritableSignal } from '@angular/core';
import { toSignal }                                                                            from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule, Validators }                                        from '@angular/forms';
import { MatIconAnchor, MatIconButton }                                                        from '@angular/material/button';
import { MatFormFieldModule }                                                                  from '@angular/material/form-field';
import { MatIcon }                                                                             from '@angular/material/icon';
import { MatInputModule }                                                                      from '@angular/material/input';
import { MatTableModule }                                                                      from '@angular/material/table';
import { MatTooltip }                                                                          from '@angular/material/tooltip';
import { RouterLink }                                                                          from '@angular/router';

import { TranslocoDirective, TranslocoService } from '@ngneat/transloco';
import { Notyf }                                from 'notyf';
import { debounceTime, firstValueFrom }         from 'rxjs';

import { FuseConfirmationService }              from '@fuse/services/confirmation';
import { PageHeaderComponent }                  from '@layout/components/page-header/page-header.component';
import { Client }                               from '@modules/admin/maintainers/clients/domain/model/client';
import { ClientService }                        from '@modules/admin/maintainers/clients/client.service';
import { TableBuilderComponent }                from '@shared/components/table-builder/table-builder.component';
import { ColumnConfig }                         from '@shared/components/table-builder/column.type';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';

@Component({
    selector   : 'app-list',
    standalone : true,
    imports: [
        PageHeaderComponent,
        TranslocoDirective,
        MatIcon,
        MatIconAnchor,
        MatTooltip,
        MatFormFieldModule,
        MatInputModule,
        MatTableModule,
        ReactiveFormsModule,
        RouterLink,
        TableBuilderComponent,
        MatMenuTrigger,
        MatIconButton,
        MatMenu,
        MatMenuItem
    ],
    templateUrl: './list.component.html'
})
export class ListComponent {
    searchControl = new FormControl(undefined, [ Validators.minLength(3), Validators.maxLength(100) ]);
    searchControlSignal = toSignal(this.searchControl.valueChanges.pipe(debounceTime(1_000)), {initialValue: ''});
    readonly #ts = inject(TranslocoService);
    readonly #clientService = inject(ClientService);

    // #region Table config
    readonly actionsCell: Signal<TemplateRef<any>> = viewChild('actionsCell');
    columnsConfig: WritableSignal<ColumnConfig[]> = signal(undefined);

    clientsResource = resource({
        request: () => this.searchControlSignal() || '',
        loader : ({request}) => firstValueFrom(this.#clientService.findAll(request))
    });
    readonly #fuseConfirmationService = inject(FuseConfirmationService);
    readonly #notyf = new Notyf();

    ngAfterViewInit() {
        this.columnsConfig.set(this.buildColumnsConfig());
    }

    openDeleteDialog(client: Client): void {
        const confirmation = this.#fuseConfirmationService.open({
            title  : this.#ts.translate('modal.delete-confirmation.title'),
            message: this.#ts.translate('modal.delete-confirmation.message'),
            actions: {
                confirm: {
                    label: this.#ts.translate('modal.delete-confirmation.confirm'),
                },
                cancel : {
                    label: this.#ts.translate('modal.delete-confirmation.cancel'),
                }
            },
        });

        firstValueFrom(confirmation.afterClosed()).then((result) => {
            if (result === 'confirmed') {
                this.#clientService.delete(client.id).subscribe({
                    next : () => {
                        this.#notyf.success(this.#ts.translate('modal.delete-confirmation.success'));
                        this.clientsResource.reload();
                    },
                    error: () => {
                        this.#notyf.error(this.#ts.translate('modal.delete-confirmation.error'));
                    }
                });
            }
        });
    }

    buildColumnsConfig = (): ColumnConfig[] => [
        {key: 'businessName', header: this.#ts.translate('maintainers.client.fields.business-name'), display: {type: 'text'}, visible: true},
        {key: 'fantasyName', header: this.#ts.translate('maintainers.client.fields.fantasy-name'), display: {type: 'text'}, visible: true},
        {key: 'code', header: this.#ts.translate('maintainers.client.fields.code'), display: {type: 'text'}, visible: true},
        {key: 'email', header: this.#ts.translate('maintainers.client.fields.email'), display: {type: 'text'}, visible: true},
        {key: 'phone', header: this.#ts.translate('maintainers.client.fields.phone'), display: {type: 'text'}, visible: true},
        {
            key    : 'actions',
            header : '',
            display: {type: 'custom', customTemplate: this.actionsCell(), containerClasses: 'block w-4'},
            visible: true
        }
    ];
}
