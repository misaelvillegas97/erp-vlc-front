import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule }                      from '@angular/common';
import { ActivatedRoute, Router }            from '@angular/router';
import { WarehouseService }                  from '@modules/admin/inventory/services/warehouse.service';
import { Warehouse }                         from '@modules/admin/inventory/domain/models/warehouse.model';
import { NotyfService }                      from '@shared/services/notyf.service';
import { firstValueFrom }                    from 'rxjs';
import { MatCardModule }                     from '@angular/material/card';
import { MatIconModule }                     from '@angular/material/icon';
import { MatButtonModule }                   from '@angular/material/button';
import { MatTooltipModule }                  from '@angular/material/tooltip';
import { MatProgressSpinnerModule }          from '@angular/material/progress-spinner';
import { PageDetailHeaderComponent }         from '@shared/components/page-detail-header/page-detail-header.component';
import { FuseConfirmationService }           from '@fuse/services/confirmation';

@Component({
    selector   : 'app-warehouse-detail',
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
    templateUrl: './detail.component.html'
})
export class WarehouseDetailComponent implements OnInit {
    private readonly warehouseService = inject(WarehouseService);
    private readonly router = inject(Router);
    private readonly route = inject(ActivatedRoute);
    private readonly notyf = inject(NotyfService);
    private readonly confirmationService = inject(FuseConfirmationService);

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
                this.router.navigate([ '/inventory/warehouse/list' ]);
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
            this.router.navigate([ '/inventory/warehouse/list' ]);
        } finally {
            this.isLoading.set(false);
        }
    }

    editWarehouse(): void {
        this.router.navigate([ '/inventory/warehouse/edit' ], {queryParams: {id: this.warehouseId}});
    }

    deleteWarehouse(): void {
        const dialog = this.confirmationService.open({
            title  : 'Eliminar almacén',
            message: `¿Está seguro que desea eliminar el almacén "${ this.warehouse()?.name }"?`,
            actions: {
                confirm: {label: 'Eliminar'},
                cancel : {label: 'Cancelar'}
            }
        });

        dialog.afterClosed().subscribe(result => {
            if (result === 'confirmed') {
                this.isLoading.set(true);
                this.warehouseService.deleteWarehouse(this.warehouseId).subscribe({
                    next : () => {
                        this.notyf.success('Almacén eliminado correctamente');
                        this.router.navigate([ '/inventory/warehouse/list' ]);
                    },
                    error: () => {
                        this.notyf.error('Error al eliminar el almacén');
                        this.isLoading.set(false);
                    }
                });
            }
        });
    }

    goBack(): void {
        this.router.navigate([ '/inventory/warehouse/list' ]);
    }
}
