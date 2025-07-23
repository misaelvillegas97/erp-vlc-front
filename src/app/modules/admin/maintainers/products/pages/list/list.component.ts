import { Component, computed, inject, model }                  from '@angular/core';
import { TranslocoDirective, TranslocoPipe, TranslocoService } from '@ngneat/transloco';
import { PageHeaderComponent }                                 from '@layout/components/page-header/page-header.component';
import { MatIconAnchor, MatIconButton, MatMiniFabButton }      from '@angular/material/button';
import { MatIcon }                                             from '@angular/material/icon';
import { MatTooltip }                                          from '@angular/material/tooltip';
import { RouterLink }                                          from '@angular/router';
import { MatFormFieldModule }                                  from '@angular/material/form-field';
import { MatInputModule }                                      from '@angular/material/input';
import { FormsModule }                                         from '@angular/forms';
import { MatDialog }                                           from '@angular/material/dialog';
import { Product }                                             from '@modules/admin/maintainers/products/domain/model/product';
import { MatTableModule }                                      from '@angular/material/table';
import { CurrencyPipe }                                        from '@angular/common';
import { MatSortModule }                                       from '@angular/material/sort';
import { ProductsService }                                     from '@modules/admin/maintainers/products/products.service';
import { rxResource }                                          from '@angular/core/rxjs-interop';
import { MatMenu, MatMenuItem, MatMenuTrigger }                from '@angular/material/menu';
import { AssociateClientComponent }                            from '@modules/admin/maintainers/products/dialog/associate-client/associate-client.component';
import { FuseConfirmationService }                             from '../../../../../../../@fuse/services/confirmation';
import { ProductClientAssociationComponent }                   from '@modules/admin/maintainers/products/dialog/product-client-association/product-client-association.component';

@Component({
    selector   : 'app-list',
    imports: [
        TranslocoDirective,
        PageHeaderComponent,
        MatIcon,
        MatTooltip,
        RouterLink,
        MatIconAnchor,
        MatFormFieldModule,
        MatInputModule,
        FormsModule,
        MatMiniFabButton,
        MatTableModule,
        CurrencyPipe,
        MatSortModule,
        MatMenuTrigger,
        MatMenu,
        MatMenuItem,
        MatIconButton,
        TranslocoPipe
    ],
    templateUrl: './list.component.html'
})
export class ListComponent {
    nameFilter = model(undefined);
    unitaryPriceFilter = model(undefined);
    upcCodeFilter = model(undefined);
    readonly displayedColumns = [ 'name', 'upcCode', 'unitaryPrice', 'description', 'actions' ];
    readonly displayedFilterColumns = this.displayedColumns.map((col) => col + 'Filter');
    readonly #dialog = inject(MatDialog);
    readonly #service = inject(ProductsService);
    readonly #fuseConfirmationService = inject(FuseConfirmationService);
    readonly #translationService = inject(TranslocoService);

    #filters = computed(() => {
        const filters = {};

        if (this.nameFilter()) filters['name'] = this.nameFilter();
        if (this.unitaryPriceFilter()) filters['unitaryPrice'] = this.unitaryPriceFilter();
        if (this.upcCodeFilter()) filters['upcCode'] = this.upcCodeFilter();

        return filters;
    });

    productsResource = rxResource({
        params: () => this.#filters(),
        stream: ({params}) => this.#service.findAll(params),
    });

    filterProducts() {
        this.productsResource.reload();
    }

    associateClient(product: Product) {
        const associationDialog = this.#dialog.open(AssociateClientComponent, {data: {product}});

        associationDialog.afterClosed().subscribe((result) => result && this.productsResource.reload());
    }

    viewAssociation(product: Product) {
        const associationDialog = this.#dialog.open(
            ProductClientAssociationComponent,
            {
                data     : {product},
                autoFocus: false,
                width    : '700px'
            }
        );

        associationDialog.afterClosed().subscribe(() => this.productsResource.reload());
    }

    delete(product: Product) {
        const confirmation = this.#fuseConfirmationService.open({
            title  : this.#translationService.translate('modal.delete-confirmation.title'),
            message: this.#translationService.translate('modal.delete-confirmation.message'),
            actions: {
                confirm: {
                    label: this.#translationService.translate('modal.delete-confirmation.confirm'),
                },
                cancel : {
                    label: this.#translationService.translate('modal.delete-confirmation.cancel'),
                }
            },
        });
    }
}
