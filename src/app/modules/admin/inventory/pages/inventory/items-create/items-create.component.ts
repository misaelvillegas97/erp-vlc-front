import { Component, inject, signal }   from '@angular/core';
import { CommonModule }                from '@angular/common';
import { Router }                      from '@angular/router';
import { PageHeaderComponent }         from '@layout/components/page-header/page-header.component';
import { InventoryItemsFormComponent } from '../items-form/items-form.component';
import { InventoryService }            from '@modules/admin/inventory/services/inventory.service';
import { InventoryItem }               from '@modules/admin/inventory/domain/models/inventory-item.model';
import { NotyfService }                from '@shared/services/notyf.service';
import { firstValueFrom }              from 'rxjs';
import { MatCardModule }               from '@angular/material/card';
import { MatIconModule }               from '@angular/material/icon';

@Component({
    selector   : 'app-inventory-items-create',
    standalone : true,
    imports    : [
        CommonModule,
        PageHeaderComponent,
        InventoryItemsFormComponent,
        MatCardModule,
        MatIconModule
    ],
    templateUrl: './items-create.component.html'
})
export class InventoryItemsCreateComponent {
    private readonly inventoryService = inject(InventoryService);
    private readonly router = inject(Router);
    private readonly notyf = inject(NotyfService);

    isLoading = signal(false);

    async onFormSubmit(item: InventoryItem): Promise<void> {
        try {
            this.isLoading.set(true);
            await firstValueFrom(this.inventoryService.createInventoryItem(item));
            this.notyf.success('Elemento de inventario creado correctamente');
            this.router.navigate([ '/inventory/inventory/list' ]);
        } catch (error) {
            this.notyf.error('Error al crear el elemento de inventario');
            console.error('Error creating inventory item:', error);
        } finally {
            this.isLoading.set(false);
        }
    }

    onFormCancel(): void {
        this.router.navigate([ '/inventory/inventory/list' ]);
    }
}
