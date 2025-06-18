import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule }                      from '@angular/common';
import { ActivatedRoute, Router }            from '@angular/router';
import { PageDetailHeaderComponent }         from '@shared/components/page-detail-header/page-detail-header.component';
import { InventoryService }                  from '@modules/admin/inventory/services/inventory.service';
import { InventoryItem }                     from '@modules/admin/inventory/domain/models/inventory-item.model';
import { InventoryBatch }                    from '@modules/admin/inventory/domain/models/inventory-batch.model';
import { NotyfService }                      from '@shared/services/notyf.service';
import { firstValueFrom }                    from 'rxjs';
import { MatCardModule }                     from '@angular/material/card';
import { MatIconModule }                     from '@angular/material/icon';
import { MatButtonModule }                   from '@angular/material/button';
import { MatTooltipModule }                  from '@angular/material/tooltip';
import { MatProgressSpinnerModule }          from '@angular/material/progress-spinner';
import { FuseConfirmationService }           from '@fuse/services/confirmation';
import { WarehouseService }                  from '@modules/admin/inventory/services/warehouse.service';
import { Warehouse }                         from '@modules/admin/inventory/domain/models/warehouse.model';

@Component({
    selector   : 'app-inventory-items-detail',
    standalone : true,
    imports    : [
        CommonModule,
        PageDetailHeaderComponent,
        MatCardModule,
        MatIconModule,
        MatButtonModule,
        MatTooltipModule,
        MatProgressSpinnerModule
    ],
    templateUrl: './items-detail.component.html'
})
export class InventoryItemsDetailComponent implements OnInit {
    private readonly inventoryService = inject(InventoryService);
    private readonly warehouseService = inject(WarehouseService);
    private readonly router = inject(Router);
    private readonly route = inject(ActivatedRoute);
    private readonly notyf = inject(NotyfService);
    private readonly confirmationService = inject(FuseConfirmationService);

    isLoading = signal(false);
    inventoryItem = signal<InventoryItem | null>(null);
    warehouse = signal<Warehouse | null>(null);
    batches = signal<InventoryBatch[]>([]);
    isBatchesLoading = signal(false);
    itemId = '';

    ngOnInit(): void {
        this.route.params.subscribe(params => {
            if (params['id']) {
                this.itemId = params['id'];
                this.loadInventoryItem(this.itemId);
                this.loadBatches(this.itemId);
            } else {
                this.notyf.error('ID de elemento no proporcionado');
                this.router.navigate([ '/admin/inventory/inventory-items' ]);
            }
        });
    }

    async loadBatches(itemId: string): Promise<void> {
        try {
            this.isBatchesLoading.set(true);
            const batches = await firstValueFrom(this.inventoryService.getBatchesByItemId(itemId));
            this.batches.set(batches);
        } catch (error) {
            this.notyf.error('Error al cargar los lotes del elemento');
            console.error('Error loading batches:', error);
        } finally {
            this.isBatchesLoading.set(false);
        }
    }

    async loadInventoryItem(id: string): Promise<void> {
        try {
            this.isLoading.set(true);
            const item = await firstValueFrom(this.inventoryService.getInventoryItem(id));
            this.inventoryItem.set(item);

            if (item.warehouseId) {
                await this.loadWarehouse(item.warehouseId);
            }
        } catch (error) {
            this.notyf.error('Error al cargar el elemento de inventario');
            console.error('Error loading inventory item:', error);
            this.router.navigate([ '/admin/inventory/inventory-items' ]);
        } finally {
            this.isLoading.set(false);
        }
    }

    async loadWarehouse(warehouseId: string): Promise<void> {
        try {
            const warehouse = await firstValueFrom(this.warehouseService.getWarehouse(warehouseId));
            this.warehouse.set(warehouse);
        } catch (error) {
            console.error('Error loading warehouse:', error);
        }
    }

    editInventoryItem(): void {
        this.router.navigate([ '/admin/inventory/inventory-items', this.itemId, 'edit' ]);
    }

    deleteInventoryItem(): void {
        const dialog = this.confirmationService.open({
            title  : 'Eliminar elemento de inventario',
            message: `¿Está seguro que desea eliminar el elemento "${ this.inventoryItem()?.name }"?`,
            actions: {
                confirm: {label: 'Eliminar'},
                cancel : {label: 'Cancelar'}
            }
        });

        dialog.afterClosed().subscribe(result => {
            if (result === 'confirmed') {
                this.isLoading.set(true);
                this.inventoryService.deleteInventoryItem(this.itemId).subscribe({
                    next : () => {
                        this.notyf.success('Elemento eliminado correctamente');
                        this.router.navigate([ '/admin/inventory/inventory-items' ]);
                    },
                    error: () => {
                        this.notyf.error('Error al eliminar el elemento');
                        this.isLoading.set(false);
                    }
                });
            }
        });
    }

    goBack(): void {
        this.router.navigate([ '/admin/inventory/inventory-items' ]);
    }

    getStockStatus(item: InventoryItem): { status: string, color: string } {
        if (!item.minimumStock) {
            return {status: 'Normal', color: 'bg-green-100 text-green-800'};
        }

        if (item.quantity <= 0) {
            return {status: 'Sin stock', color: 'bg-red-100 text-red-800'};
        }

        if (item.quantity < item.minimumStock) {
            return {status: 'Bajo stock', color: 'bg-amber-100 text-amber-800'};
        }

        if (item.maximumStock && item.quantity > item.maximumStock) {
            return {status: 'Exceso de stock', color: 'bg-blue-100 text-blue-800'};
        }

        return {status: 'Normal', color: 'bg-green-100 text-green-800'};
    }

    isExpiringSoon(dateOrItem: Date | string | InventoryItem | InventoryBatch): boolean {
        let expirationDate: Date;

        if (dateOrItem instanceof Date || typeof dateOrItem === 'string') {
            if (!dateOrItem) return false;
            expirationDate = new Date(dateOrItem);
        } else if ('expirationDate' in dateOrItem) {
            if (!dateOrItem.expirationDate) return false;
            expirationDate = new Date(dateOrItem.expirationDate);
        } else {
            return false;
        }

        const today = new Date();
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(today.getDate() + 30);

        return expirationDate <= thirtyDaysFromNow && expirationDate >= today;
    }

    isExpired(dateOrItem: Date | string | InventoryItem | InventoryBatch): boolean {
        let expirationDate: Date;

        if (dateOrItem instanceof Date || typeof dateOrItem === 'string') {
            if (!dateOrItem) return false;
            expirationDate = new Date(dateOrItem);
        } else if ('expirationDate' in dateOrItem) {
            if (!dateOrItem.expirationDate) return false;
            expirationDate = new Date(dateOrItem.expirationDate);
        } else {
            return false;
        }

        const today = new Date();
        return expirationDate < today;
    }
}
