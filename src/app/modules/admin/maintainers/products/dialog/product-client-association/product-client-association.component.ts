import { Component, inject }                                                                   from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogActions, MatDialogClose, MatDialogContent, MatDialogTitle } from '@angular/material/dialog';
import { Product }                                                                             from '@modules/admin/maintainers/products/domain/model/product';
import { MatButton, MatIconButton }                                                            from '@angular/material/button';
import { MatIcon }                                                                             from '@angular/material/icon';
import { MatTooltip }                                                                          from '@angular/material/tooltip';

@Component({
    selector   : 'app-product-client-association',
    imports    : [
        MatDialogContent,
        MatDialogTitle,
        MatButton,
        MatDialogActions,
        MatDialogClose,
        MatIcon,
        MatTooltip,
        MatIconButton
    ],
    templateUrl: './product-client-association.component.html'
})
export class ProductClientAssociationComponent {
    readonly data = inject(MAT_DIALOG_DATA);
    readonly product = this.data.product as Product;
}
