import { Component, EventEmitter, inject, Input, OnInit, Output, signal } from '@angular/core';
import { CommonModule }                                                   from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators }        from '@angular/forms';
import { MatButtonModule }                                                from '@angular/material/button';
import { MatCardModule }                                                  from '@angular/material/card';
import { MatFormFieldModule }                                             from '@angular/material/form-field';
import { MatIconModule }                                                  from '@angular/material/icon';
import { MatInputModule }                                                 from '@angular/material/input';
import { MatSelectModule }                                                from '@angular/material/select';
import { MatSlideToggleModule }                                           from '@angular/material/slide-toggle';
import { MatTooltipModule }                                               from '@angular/material/tooltip';
import { MatProgressSpinner }                                             from '@angular/material/progress-spinner';
import { MatDatepickerModule }                                            from '@angular/material/datepicker';
import { MatNativeDateModule }                                            from '@angular/material/core';
import { InventoryItem }                                                  from '@modules/admin/inventory/domain/models/inventory-item.model';
import { WarehouseService }                                               from '@modules/admin/inventory/services/warehouse.service';
import { firstValueFrom }                                                 from 'rxjs';
import { NotyfService }                                                   from '@shared/services/notyf.service';
import { Warehouse }                                                      from '@modules/admin/inventory/domain/models/warehouse.model';

@Component({
    selector   : 'app-inventory-items-form',
    standalone : true,
    imports    : [
        CommonModule,
        ReactiveFormsModule,
        MatButtonModule,
        MatCardModule,
        MatFormFieldModule,
        MatIconModule,
        MatInputModule,
        MatSelectModule,
        MatSlideToggleModule,
        MatTooltipModule,
        MatProgressSpinner,
        MatDatepickerModule,
        MatNativeDateModule
    ],
    templateUrl: './items-form.component.html'
})
export class InventoryItemsFormComponent implements OnInit {
    private readonly fb = inject(FormBuilder);
    private readonly warehouseService = inject(WarehouseService);
    private readonly notyf = inject(NotyfService);

    @Input() inventoryItem: InventoryItem | null = null;
    @Input() isLoading = false;
    @Output() formSubmit = new EventEmitter<InventoryItem>();
    @Output() formCancel = new EventEmitter<void>();

    // Form
    itemForm: FormGroup = this.fb.group({
        name          : [ '', [ Validators.required, Validators.maxLength(100) ] ],
        description   : [ '', Validators.maxLength(500) ],
        upcCode       : [ '', Validators.maxLength(50) ],
        warehouseId   : [ '', Validators.required ],
        quantity      : [ 0, [ Validators.required, Validators.min(0) ] ],
        minimumStock  : [ 0, Validators.min(0) ],
        maximumStock  : [ 0, Validators.min(0) ],
        reorderPoint  : [ 0, Validators.min(0) ],
        location      : [ '', Validators.maxLength(100) ],
        batchNumber   : [ '', Validators.maxLength(50) ],
        expirationDate: [ null ],
        isReserved    : [ false ]
    });

    formTitle = signal('Nuevo Elemento de Inventario');
    warehouses = signal<Warehouse[]>([]);

    ngOnInit(): void {
        this.loadWarehouses();

        if (this.inventoryItem) {
            this.formTitle.set('Editar Elemento de Inventario');
            this.itemForm.patchValue({
                name          : this.inventoryItem.name,
                description   : this.inventoryItem.description || '',
                upcCode       : this.inventoryItem.upcCode || '',
                warehouseId   : this.inventoryItem.warehouseId,
                quantity      : this.inventoryItem.quantity,
                minimumStock  : this.inventoryItem.minimumStock || 0,
                maximumStock  : this.inventoryItem.maximumStock || 0,
                reorderPoint  : this.inventoryItem.reorderPoint || 0,
                location      : this.inventoryItem.location || '',
                batchNumber   : this.inventoryItem.batchNumber || '',
                expirationDate: this.inventoryItem.expirationDate ? new Date(this.inventoryItem.expirationDate) : null,
                isReserved    : this.inventoryItem.isReserved
            });
        }
    }

    async loadWarehouses(): Promise<void> {
        try {
            const response = await firstValueFrom(this.warehouseService.getWarehouses());
            this.warehouses.set(response.items);
        } catch (error) {
            this.notyf.error('Error al cargar los almacenes');
        }
    }

    onSubmit(): void {
        if (this.itemForm.invalid) {
            this.itemForm.markAllAsTouched();
            return;
        }

        const formValue = this.itemForm.getRawValue();
        const itemData: InventoryItem = {
            id: this.inventoryItem?.id || undefined,
            name          : formValue.name,
            description   : formValue.description || undefined,
            upcCode       : formValue.upcCode || undefined,
            warehouseId   : formValue.warehouseId,
            quantity      : formValue.quantity,
            minimumStock  : formValue.minimumStock || undefined,
            maximumStock  : formValue.maximumStock || undefined,
            reorderPoint  : formValue.reorderPoint || undefined,
            location      : formValue.location || undefined,
            batchNumber   : formValue.batchNumber || undefined,
            expirationDate: formValue.expirationDate,
            isReserved    : formValue.isReserved,
            createdAt     : this.inventoryItem?.createdAt || new Date(),
            updatedAt     : new Date()
        };

        this.formSubmit.emit(itemData);
    }

    onCancel(): void {
        this.formCancel.emit();
    }

    resetForm(): void {
        if (this.inventoryItem) {
            this.itemForm.patchValue({
                name          : this.inventoryItem.name,
                description   : this.inventoryItem.description || '',
                upcCode       : this.inventoryItem.upcCode || '',
                warehouseId   : this.inventoryItem.warehouseId,
                quantity      : this.inventoryItem.quantity,
                minimumStock  : this.inventoryItem.minimumStock || 0,
                maximumStock  : this.inventoryItem.maximumStock || 0,
                reorderPoint  : this.inventoryItem.reorderPoint || 0,
                location      : this.inventoryItem.location || '',
                batchNumber   : this.inventoryItem.batchNumber || '',
                expirationDate: this.inventoryItem.expirationDate ? new Date(this.inventoryItem.expirationDate) : null,
                isReserved    : this.inventoryItem.isReserved
            });
        } else {
            this.itemForm.reset({
                name          : '',
                description   : '',
                upcCode       : '',
                warehouseId   : '',
                quantity      : 0,
                minimumStock  : 0,
                maximumStock  : 0,
                reorderPoint  : 0,
                location      : '',
                batchNumber   : '',
                expirationDate: null,
                isReserved    : false
            });
        }
    }
}
