import { Notyf }                                           from 'notyf';
import { mergeMap, Observable }                            from 'rxjs';
import { FuseConfirmationConfig, FuseConfirmationService } from '../../../../@fuse/services/confirmation';
import { inject }                                          from '@angular/core';
import { TranslocoService }                                from '@ngneat/transloco';

export abstract class AbstractListComponent<T> {
    public items$: Observable<T[]>;
    abstract columns: Array<keyof T | string>;
    protected _notyf = new Notyf();
    protected confirmationService: FuseConfirmationService = inject(FuseConfirmationService);
    protected translationService: TranslocoService = inject(TranslocoService);
    protected readonly _deleteConfirmation: FuseConfirmationConfig = {
        title  : this.translationService.translate('modal.delete-confirmation.title'),
        message: this.translationService.translate('modal.delete-confirmation.message'),
        actions: {
            confirm: {
                label: this.translationService.translate('modal.delete-confirmation.confirm'),
            },
            cancel : {
                label: this.translationService.translate('modal.delete-confirmation.cancel'),
            }
        },
    };

    protected constructor(
        private readonly service: { delete: (id: string) => any },
        private readonly items: any,
        private readonly customDeleteConfirmation?: FuseConfirmationConfig
    ) {
        this.items$ = items;
        this._deleteConfirmation = customDeleteConfirmation || this._deleteConfirmation;
    }

    abstract edit(item: T): void;

    delete(item: T) {
        const confirmation = this.confirmationService.open(this._deleteConfirmation);

        confirmation.afterClosed()
            .pipe(
                mergeMap((result) => result === 'confirmed' ? this.service.delete(item['id']) : [])
            )
            .subscribe({
                next : () => this._notyf.success('Item deleted'),
                error: (error) => this._notyf.error('Error deleting item'),
            });
    }
}
