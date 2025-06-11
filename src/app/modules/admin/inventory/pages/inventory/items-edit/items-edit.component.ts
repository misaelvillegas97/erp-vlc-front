import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule }                      from '@angular/common';
import { ActivatedRoute, Router }            from '@angular/router';
import { PageHeaderComponent }               from '@layout/components/page-header/page-header.component';
import { InventoryItemsFormComponent }       from '../items-form/items-form.component';
import { InventoryService }                  from '@modules/admin/inventory/services/inventory.service';
import { InventoryItem }                     from '@modules/admin/inventory/domain/models/inventory-item.model';
import { NotyfService }                      from '@shared/services/notyf.service';
import { firstValueFrom }                    from 'rxjs';
import { MatCardModule }                     from '@angular/material/card';
import { MatIconModule }                     from '@angular/material/icon';
import { MatProgressSpinnerModule }          from '@angular/material/progress-spinner';

@Component({
    selector   : 'app-inventory-items-edit',
    standalone : true,
    imports    : [
        CommonModule,
        PageHeaderComponent,
        InventoryItemsFormComponent,
        MatCardModule,
        MatIconModule,
        MatProgressSpinnerModule
    ],
    templateUrl: './items-edit.component.html'
})
export class InventoryItemsEditComponent implements OnInit {
    private readonly inventoryService = inject(InventoryService);
    private readonly router = inject(Router);
    private readonly route = inject(ActivatedRoute);
    private readonly notyf = inject(NotyfService);

    isLoading = signal(false);
    inventoryItem = signal<InventoryItem | null>(null);
    itemId = '';

    ngOnInit(): void {
        this.route.params.subscribe(params => {
            if (params['id']) {
                this.itemId = params['id'];
                this.loadInventoryItem(this.itemId);
            } else {
                this.notyf.error('ID de elemento no proporcionado');
                this.router.navigate([ '/admin/inventory/inventory-items' ]);
            }
        });
    }

    async loadInventoryItem(id: string): Promise<void> {
        try {
            this.isLoading.set(true);
            const item = await firstValueFrom(this.inventoryService.getInventoryItem(id));
            this.inventoryItem.set(item);
        } catch (error) {
            this.notyf.error('Error al cargar el elemento de inventario');
            console.error('Error loading inventory item:', error);
            this.router.navigate([ '/admin/inventory/inventory-items' ]);
        } finally {
            this.isLoading.set(false);
        }
    }

    async onFormSubmit(item: InventoryItem): Promise<void> {
        try {
            this.isLoading.set(true);
            await firstValueFrom(this.inventoryService.updateInventoryItem(this.itemId, item));
            this.notyf.success('Elemento de inventario actualizado correctamente');
            this.router.navigate([ '/admin/inventory/inventory-items' ]);
        } catch (error) {
            this.notyf.error('Error al actualizar el elemento de inventario');
            console.error('Error updating inventory item:', error);
        } finally {
            this.isLoading.set(false);
        }
    }

    onFormCancel(): void {
        this.router.navigate([ '/admin/inventory/inventory-items' ]);
    }
}
