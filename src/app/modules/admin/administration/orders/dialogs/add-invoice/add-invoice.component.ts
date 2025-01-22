import { Component }       from '@angular/core';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButton }       from '@angular/material/button';

@Component({
    selector   : 'app-add-invoice',
    imports    : [
        MatDialogModule,
        MatButton
    ],
    templateUrl: './add-invoice.component.html'
})
export class AddInvoiceComponent {

}
