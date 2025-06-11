import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule }                      from '@angular/common';
import { ActivatedRoute, Router }            from '@angular/router';
import { PageHeaderComponent }               from '@layout/components/page-header/page-header.component';
import { WarehouseFormComponent }            from '../form/form.component';
import { WarehouseService }                  from '@modules/admin/inventory/services/warehouse.service';
import { Warehouse }                         from '@modules/admin/inventory/domain/models/warehouse.model';
import { NotyfService }                      from '@shared/services/notyf.service';
import { firstValueFrom }                    from 'rxjs';
import { MatCardModule }                     from '@angular/material/card';
import { MatIconModule }                     from '@angular/material/icon';
import { MatProgressSpinner }                from '@angular/material/progress-spinner';

@Component({
    selector   : 'app-warehouse-edit',
    standalone : true,
    imports    : [
        CommonModule,
        PageHeaderComponent,
        WarehouseFormComponent,
        MatCardModule,
        MatIconModule,
        MatProgressSpinner
    ],
    templateUrl: './edit.component.html'
})
export class WarehouseEditComponent implements OnInit {
    private readonly warehouseService = inject(WarehouseService);
    private readonly router = inject(Router);
    private readonly route = inject(ActivatedRoute);
    private readonly notyf = inject(NotyfService);

    isLoading = signal(false);
    warehouse = signal<Warehouse | null>(null);
    warehouseId = '';

    ngOnInit(): void {
        this.route.queryParams.subscribe(params => {
            if (params['id']) {
                this.warehouseId = params['id'];
                this.loadWarehouse(this.warehouseId);
            } else {
                this.notyf.error('ID de almacén no proporcionado');
                this.router.navigate([ '/admin/inventory/warehouse/list' ]);
            }
        });
    }

    async loadWarehouse(id: string): Promise<void> {
        try {
            this.isLoading.set(true);
            const warehouse = await firstValueFrom(this.warehouseService.getWarehouse(id));
            this.warehouse.set(warehouse);
        } catch (error) {
            this.notyf.error('Error al cargar el almacén');
            console.error('Error loading warehouse:', error);
            this.router.navigate([ '/admin/inventory/warehouse/list' ]);
        } finally {
            this.isLoading.set(false);
        }
    }

    async onFormSubmit(warehouse: Warehouse): Promise<void> {
        try {
            this.isLoading.set(true);
            await firstValueFrom(this.warehouseService.updateWarehouse(this.warehouseId, warehouse));
            this.notyf.success('Almacén actualizado correctamente');
            this.router.navigate([ '/admin/inventory/warehouse/list' ]);
        } catch (error) {
            this.notyf.error('Error al actualizar el almacén');
            console.error('Error updating warehouse:', error);
        } finally {
            this.isLoading.set(false);
        }
    }

    onFormCancel(): void {
        this.router.navigate([ '/admin/inventory/warehouse/list' ]);
    }
}
