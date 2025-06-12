import { Component, inject, signal } from '@angular/core';
import { CommonModule }              from '@angular/common';
import { Router }                    from '@angular/router';
import { PageHeaderComponent }       from '@layout/components/page-header/page-header.component';
import { WarehouseFormComponent }    from '../form/form.component';
import { WarehouseService }          from '@modules/admin/inventory/services/warehouse.service';
import { Warehouse }                 from '@modules/admin/inventory/domain/models/warehouse.model';
import { NotyfService }              from '@shared/services/notyf.service';
import { firstValueFrom }            from 'rxjs';
import { MatCard, MatCardContent }   from '@angular/material/card';
import { MatIcon }                   from '@angular/material/icon';

@Component({
    selector   : 'app-warehouse-create',
    standalone : true,
    imports    : [
        CommonModule,
        PageHeaderComponent,
        WarehouseFormComponent,
        MatCard,
        MatCardContent,
        MatIcon
    ],
    templateUrl: './create.component.html'
})
export class WarehouseCreateComponent {
    private readonly warehouseService = inject(WarehouseService);
    private readonly router = inject(Router);
    private readonly notyf = inject(NotyfService);

    isLoading = signal(false);

    async onFormSubmit(warehouse: Warehouse): Promise<void> {
        try {
            this.isLoading.set(true);
            await firstValueFrom(this.warehouseService.createWarehouse(warehouse));
            this.notyf.success('Almacén creado correctamente');
            this.router.navigate([ '/inventory/warehouse/list' ]);
        } catch (error) {
            this.notyf.error('Error al crear el almacén');
            console.error('Error creating warehouse:', error);
        } finally {
            this.isLoading.set(false);
        }
    }

    onFormCancel(): void {
        this.router.navigate([ '/inventory/warehouse/list' ]);
    }
}
